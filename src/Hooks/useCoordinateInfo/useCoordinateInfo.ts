import {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';

import _cloneDeep from 'lodash/cloneDeep';
import _isNil from 'lodash/isNil';
import _isString from 'lodash/isString';
import _uniqueId from 'lodash/uniqueId';
import { getUid } from 'ol';
import { Coordinate as OlCoordinate } from 'ol/coordinate';
import { EventsKey } from 'ol/events';
import OlFeature from 'ol/Feature';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlFormatGML2 from 'ol/format/GML2';
import OlFormatGml3 from 'ol/format/GML3';
import OlFormatGml32 from 'ol/format/GML32';
import OlFormatWMSGetFeatureInfo from 'ol/format/WMSGetFeatureInfo';
import OlLayer from 'ol/layer/Layer';
import OlMapBrowserEvent from 'ol/MapBrowserEvent';
import { Pixel as OlPixel } from 'ol/pixel';
import { toSize } from 'ol/size';
import OlSource from 'ol/source/Source';
import OlSourceWmts from 'ol/source/WMTS';

import OlTileGridWMTS from 'ol/tilegrid/WMTS';

import Logger from '@terrestris/base-util/dist/Logger';
import {
  isWfsLayer,
  isWmsLayer, isWmtsLayer, WmtsLayer,
  WfsLayer, WmsLayer
} from '@terrestris/ol-util';

import useMap from '../useMap/useMap';

export interface FeatureLayerResult {
  feature: OlFeature;
  layer: WmsLayer|WmtsLayer|WfsLayer;
  featureType: string;
}

export interface CoordinateInfoResult {
  clickCoordinate?: OlCoordinate;
  pixelCoordinate?: OlPixel;
  features?: FeatureLayerResult[];
  loading: boolean;
}

export interface UseCoordinateInfoArgs {
  active: boolean;
  clickEvent?: 'click' | 'dblclick';
  drillDown?: boolean;
  featureCount?: number;
  fetchOpts?: Record<string, RequestInit> | ((layer: WmsLayer | WmtsLayer) => RequestInit);
  getInfoFormat?: (layer: WmsLayer | WmtsLayer) => string | Promise<string>;
  layerFilter?: (layerCandidate: OlLayer<OlSource>) => boolean;
  onError?: (error: any) => void;
  onSuccess?: () => void;
  registerOnClick?: boolean;
  registerOnPointerMove?: boolean;
  registerOnPointerRest?: boolean;
}

const getFeatureType = (feature: OlFeature) => {
  const id = feature.getId() ?? feature.get('id');
  return _isString(id) ? id.split('.')[0] : id?.toString() ?? _uniqueId('UNKNOWN');
};

export const useCoordinateInfo = ({
  active,
  clickEvent = 'click',
  drillDown = false,
  featureCount = 1,
  fetchOpts = {},
  getInfoFormat = () => 'application/json',
  layerFilter = () => true,
  onError = () => undefined,
  onSuccess = () => undefined,
  registerOnClick = true,
  registerOnPointerMove = false,
  registerOnPointerRest = false
}: UseCoordinateInfoArgs): CoordinateInfoResult => {

  const map = useMap();

  const [clickCoordinate, setClickCoordinate] = useState<OlCoordinate | undefined>();
  const [pixelCoordinate, setPixelCoordinate] = useState<OlPixel | undefined>();
  const [featureResults, setFeatureResults] = useState<FeatureLayerResult[] | undefined>();
  const [loading, setLoading] = useState<boolean>(false);

  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const mapView = useMemo(() => map?.getView(), [map]);
  const viewResolution = useMemo(() => mapView?.getResolution(), [mapView]);
  const viewProjection = useMemo(() => mapView?.getProjection(), [mapView]);

  const wmsMapLayers = useMemo(() => {
    if (_isNil(map) || _isNil(pixelCoordinate)) {
      return [];
    }
    return map.getAllLayers()
      .reverse()
      .filter(layerFilter)
      .filter(l => l.getData && l.getData(pixelCoordinate) && isWmsLayer(l)) as WmsLayer[];
  }, [layerFilter, map, pixelCoordinate]);

  const wmtsMapLayers = useMemo(() => {
    if (_isNil(map) || _isNil(pixelCoordinate)) {
      return [];
    }
    return map.getAllLayers()
      .reverse()
      .filter(layerFilter)
      .filter(l => isWmtsLayer(l)) as WmtsLayer[];
  }, [layerFilter, map, pixelCoordinate]);

  const wfsMapLayers = useMemo(() => {
    if (_isNil(map) || _isNil(pixelCoordinate)) {
      return [];
    }
    return map.getAllLayers()
      .reverse()
      .filter(layerFilter)
      .filter(l => isWfsLayer(l)) as WfsLayer[];
  }, [layerFilter, map, pixelCoordinate]);

  const orderedLayers = useMemo(() => {
    if (_isNil(map)) {
      return [];
    }
    const all = map.getAllLayers().reverse();
    const relevantLayers = [...wfsMapLayers, ...wmtsMapLayers, ...wmsMapLayers];

    relevantLayers.sort((a, b) => {
      if (_isNil(a) || _isNil(b)) {
        return 0;
      }
      const aUid = getUid(a);
      const bUid = getUid(b);
      const aIndex = all.findIndex(l => getUid(l) === aUid);
      const bIndex = all.findIndex(l => getUid(l) === bUid);
      return aIndex - bIndex;
    });

    return relevantLayers;
  }, [map, wfsMapLayers, wmtsMapLayers, wmsMapLayers]);

  /**
   * Event handler for pointer move events on the map.
   * It checks if the pointer is currently dragging or if the map instance is not available.
   */
  const onPointerMove = useCallback((olEvt: OlMapBrowserEvent) => {
    if (olEvt.dragging || _isNil(map)) {
      return;
    }

    const pixel: OlPixel = map.getEventPixel(olEvt.originalEvent);
    const hits = map.getAllLayers()
      .filter(l => layerFilter(l))
      .filter(l => {
        const pixelData: any = l.getData(pixel);
        return pixelData && pixelData[3] > 0;
      });
    map.getTargetElement().style.cursor = hits?.length > 0 ? 'pointer' : 'auto';
  }, [layerFilter, map]);

  /**
   * Determines the appropriate feature info URL for a WMTS layer based on the provided parameters.
   * @param resourceUrl - The resource URL template for the WMTS layer, which may contain placeholders for style,
   *  tile matrix set, tile matrix, tile column, tile row, and pixel coordinates (I and J).
   * @param tileGrid - The tile grid configuration for the WMTS layer,
   *  which is used to calculate the tile coordinates and extent.
   * @param coordinate - The coordinate for which to determine the feature info URL.
   * @param resolution - The resolution of the map view, which is used to determine the appropriate tile matrix.
   * @param matrixSet - The identifier of the tile matrix set being used by the WMTS layer
   * @param style - The style identifier to be used in the feature info URL, defaulting to 'default' if not provided.
   */
  const determineWmtsFeatureInfoUrl = (
    resourceUrl: string,
    tileGrid: OlTileGridWMTS,
    coordinate: OlCoordinate,
    resolution: number,
    matrixSet: string,
    style = 'default'
  ): string | undefined => {
    if (_isNil(resourceUrl)) {
      Logger.warn('No featureInfoUrl defined on WMTS layer');
      return undefined;
    }

    if ( _isNil(tileGrid) || _isNil(coordinate) || _isNil(resolution) || _isNil(matrixSet)) {
      return undefined;
    }

    // See also example listed here: https://github.com/openlayers/openlayers/issues/14582
    const tileCoord = tileGrid.getTileCoordForCoordAndResolution(
      coordinate,
      resolution
    );
    const tileExtent = tileGrid.getTileCoordExtent(tileCoord);
    const matrix = tileGrid.getMatrixId(tileCoord[0]);
    const tileSize = toSize(tileGrid.getTileSize(tileCoord[0]));

    const i = Math.floor(
      ((coordinate[0] - tileExtent[0]) * tileSize[0]) /
        (tileExtent[2] - tileExtent[0])
    );
    const j = Math.floor(
      ((tileExtent[3] - coordinate[1]) * tileSize[1]) /
        (tileExtent[3] - tileExtent[1])
    );
    return resourceUrl
      .replace('{style}', style)
      .replace('{TileMatrixSet}', matrixSet)
      .replace('{TileMatrix}', matrix)
      .replace('{TileCol}', `${tileCoord[1]}`)
      .replace('{TileRow}', `${tileCoord[2]}`)
      .replace('{I}', `${i}`)
      .replace('{J}', `${j}`);
  };

  /**
   * Determines the appropriate OpenLayers format reader based on the provided info format string.
   * @param infoFormat - The info format string to determine the format reader for.
   */
  const determineInfoFormatter = (
    infoFormat: string
  ): OlFormatGML2 | OlFormatGml3 | OlFormatGml32 | OlFormatGeoJSON | OlFormatWMSGetFeatureInfo | undefined => {
    let format: OlFormatGML2 | OlFormatGml3 | OlFormatGml32 | OlFormatGeoJSON | OlFormatWMSGetFeatureInfo | undefined;

    if (infoFormat === 'application/vnd.ogc.gml') {
      format = new OlFormatWMSGetFeatureInfo();
    } else if (infoFormat.indexOf('gml/2') > -1) {
      format = new OlFormatGML2();
    } else if (
      infoFormat === 'application/vnd.ogc.gml/3.1.1' || infoFormat === 'text/xml; subtype=gml/3.1.1'
    ) {
      format = new OlFormatGml3();
    } else if (infoFormat === 'application/vnd.ogc.gml/3.2' || infoFormat === 'text/xml; subtype=gml/3.2') {
      format = new OlFormatGml32();
    } else if (infoFormat === 'application/json' || infoFormat.indexOf('json') > -1) {
      format = new OlFormatGeoJSON();
    }
    return format;
  };

  const getResultsFromImageLayers = useCallback(async (
    coordinate: OlCoordinate,
    useWms: boolean
  ): Promise<FeatureLayerResult[]> => {
    if (_isNil(map) || _isNil(viewResolution) || _isNil(viewProjection)) {
      return [];
    }

    const results: FeatureLayerResult[] = [];
    const layers = useWms ? wmsMapLayers : wmtsMapLayers;

    for (const layer of layers) {
      try {
        const layerId = getUid(layer);
        const abortController = abortControllers.current.get(layerId);

        if (! abortController) {
          continue;
        }

        const layerSource = layer.getSource();
        if (!layerSource) {
          continue;
        }

        const infoFormat = await getInfoFormat(layer);
        let featureInfoUrl;

        if (isWmsLayer(layer) && !(layerSource instanceof OlSourceWmts)) {
          featureInfoUrl = layerSource.getFeatureInfoUrl(
            coordinate,
            viewResolution,
            viewProjection,
            {
              INFO_FORMAT: infoFormat,
              FEATURE_COUNT: featureCount
            }
          );
        } else {
          const wmtsLayerSource = layer.getSource() as OlSourceWmts;
          const tileGrid = wmtsLayerSource.getTileGrid() as OlTileGridWMTS;
          if (_isNil(tileGrid)) {
            continue;
          }

          const featureInfoTemplates = layer.get('featureInfoTemplates') as Record<string, string>;

          featureInfoUrl = determineWmtsFeatureInfoUrl(
            featureInfoTemplates[infoFormat],
            tileGrid,
            coordinate,
            viewResolution,
            wmtsLayerSource.getMatrixSet()
          );
        }

        if (featureInfoUrl) {
          let opts;
          if (fetchOpts instanceof Function) {
            opts = fetchOpts(layer);
          } else {
            opts = fetchOpts[getUid(layer)];
          }

          const response = await fetch(featureInfoUrl, {
            ...opts,
            signal: abortController.signal
          });

          const format = determineInfoFormatter(infoFormat);
          const isJson = infoFormat === 'application/json' || infoFormat.indexOf('json') > -1;
          const text = isJson ? await response.json() : await response.text();

          if (! _isNil(format)) {
            const features = format.readFeatures(text).map(f => ({
              feature: f,
              layer,
              featureType: getFeatureType(f)
            }));
            results.push(...features);
          }
        }
        if (!drillDown && results.length > 0) {
          break;
        }

      } catch (error: any) {
        if (error.name !== 'AbortError') {
          Logger.error(error);
        }
      }
    }

    return results;
  }, [map, viewResolution, viewProjection, wmsMapLayers, wmtsMapLayers,
    getInfoFormat, featureCount, fetchOpts, drillDown]);

  const getResultsFromWfsLayers = useCallback(async (
    coordinate: OlCoordinate
  ): Promise<FeatureLayerResult[]> => {
    if (_isNil(map) || _isNil(viewProjection)) {
      return [];
    }

    const results: FeatureLayerResult[] = [];

    for (const layer of wfsMapLayers) {
      if (! drillDown && results.length > 0) {
        break;
      }

      const wfsLayerSource = layer.getSource();
      if (!wfsLayerSource) {
        continue;
      }

      results.push(...wfsLayerSource.getFeaturesAtCoordinate(coordinate).map(f => ({
        feature: f,
        layer,
        featureType: getFeatureType(f)
      })));
    }

    return results;
  }, [map, viewProjection, wfsMapLayers, drillDown]);

  /**
   * Event handler for map events (click, double-click, pointer rest) that retrieves the coordinate of the
   * event and updates the state accordingly.
   */
  const handleMapEvent = useCallback((olEvt: OlMapBrowserEvent) => {
    if (_isNil(map) || _isNil(viewResolution) || _isNil(viewProjection)) {
      return;
    }

    if (clickEvent === 'dblclick') {
      olEvt.stopPropagation();
    }

    const pixel = map.getEventPixel(olEvt.originalEvent);
    const coordinate = olEvt.coordinate;

    let evtPixelCoordinate: [number, number] = [0, 0];
    if (olEvt.originalEvent instanceof PointerEvent) {
      evtPixelCoordinate = [olEvt.originalEvent.x, olEvt.originalEvent.y];
    }

    const clonedCoordinate = _cloneDeep(coordinate);
    const clonedPixelCoordinate = _cloneDeep(evtPixelCoordinate ?? pixel);
    setClickCoordinate(clonedCoordinate);
    setPixelCoordinate(clonedPixelCoordinate);
  }, [clickEvent, map, viewProjection, viewResolution]);

  useEffect(() => {
    if (!_isNil(clickCoordinate)) {
      setFeatureResults(undefined);
    }
  }, [clickCoordinate]);

  useEffect(() => {
    if (_isNil(clickCoordinate) || _isNil(map) || orderedLayers?.length === 0) {
      return;
    }

    if (!_isNil(featureResults)) {
      return;
    }

    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();

    orderedLayers.forEach(layer => {
      const layerId = getUid(layer);
      const abortController = new AbortController();
      abortControllers. current.set(layerId, abortController);
    });

    const fetchFeatures = async () => {
      try {
        setLoading(true);

        const promises: Promise<FeatureLayerResult[]>[] = [];

        for (const layer of orderedLayers) {
          if (isWmsLayer(layer)) {
            promises.push(getResultsFromImageLayers(clickCoordinate, true));
          } else if (isWmtsLayer(layer)) {
            promises.push(getResultsFromImageLayers(clickCoordinate, false));
          } else if (isWfsLayer(layer)) {
            promises.push(getResultsFromWfsLayers(clickCoordinate));
          }

          if (!drillDown) {
            break;
          }
        }

        let allResults: FeatureLayerResult[][];
        if (drillDown) {
          allResults = await Promise.all(promises);
        } else {
          const firstResult = await Promise.race(promises);
          allResults = [firstResult];
        }

        const flatResults = allResults.flat();
        const clonedResults = _cloneDeep(flatResults);

        setFeatureResults(clonedResults);
        onSuccess?.();
      } catch (error: any) {
        if (error. name !== 'AbortError') {
          Logger.error(error);
        }
        onError?.(error);
      }
    };

    fetchFeatures().finally(() => {
      setLoading(false);
      map.getTargetElement().style.cursor = 'auto';
    });

  }, [
    clickCoordinate, drillDown, featureResults, getResultsFromImageLayers, getResultsFromWfsLayers, map, orderedLayers,
    onError, onSuccess
  ]);

  useEffect(() => {
    let keyMove: EventsKey | undefined;
    let keyRest: EventsKey | undefined;
    let keyClick: EventsKey | undefined;
    if (active) {
      if (registerOnClick && clickEvent) {
        keyClick = map?.on(clickEvent, handleMapEvent);
      }

      if (registerOnPointerMove) {
        keyMove = map?.on('pointermove', onPointerMove);
      }

      if (registerOnPointerRest) {
        // @ts-expect-error pointerrest is no default event
        keyRest = map?.on('pointerrest', handleMapEvent);
      }
    }

    return () => {
      if (keyClick && clickEvent) {
        map?.un(clickEvent, keyClick.listener);
      }

      if (keyMove) {
        map?.un('pointermove', keyMove.listener);
      }

      if (keyRest) {
        // @ts-expect-error pointerrest is no default event
        map?.un('pointerrest', keyRest.listener);
      }
    };
  }, [
    active, map, onPointerMove, handleMapEvent, registerOnClick,
    registerOnPointerMove, registerOnPointerRest, clickEvent
  ]);

  useEffect(() => {
    const controllers = abortControllers.current;
    return () => {
      controllers.forEach(c => c.abort());
      controllers.clear();
    };
  }, [viewResolution]);

  useEffect(() => {
    if (_isNil(map)) {
      return;
    }
    map.getTargetElement().style.cursor = loading ? 'wait' : 'auto';
  }, [loading, map]);

  // We want to propagate the state here so the variables do
  // not change on every render cycle.
  return {
    clickCoordinate,
    features: featureResults,
    loading,
    pixelCoordinate
  };
};

export default useCoordinateInfo;
