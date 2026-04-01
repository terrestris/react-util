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
import useOlListener from '../useOlListener/useOlListener';

export interface FeatureLayerResult {
  feature: OlFeature;
  layer: WmsLayer | WmtsLayer | WfsLayer;
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

  const mapView = useMemo(() => map?.getView(), [map]);

  const [mapCoordinate, setMapCoordinate] = useState<OlCoordinate | undefined>();
  const [pixelCoordinate, setPixelCoordinate] = useState<OlPixel | undefined>();
  const [featureResults, setFeatureResults] = useState<FeatureLayerResult[] | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [viewResolution, setViewResolution] = useState<number | undefined>(mapView?.getResolution());

  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const viewProjection = useMemo(() => mapView?.getProjection(), [mapView]);

  useOlListener(
    mapView,
    v => v.on('change:resolution', () => {
      setViewResolution(v.getResolution());
    }),
    [mapView]
  );

  const wmsMapLayerUids = useMemo(() => {
    if (_isNil(map) || _isNil(pixelCoordinate)) {
      return [];
    }
    return map.getAllLayers()
      .toReversed()
      .filter(layerFilter)
      .filter(l => l.getData && l.getData(pixelCoordinate) && isWmsLayer(l))
      .map(getUid);
  }, [layerFilter, map, pixelCoordinate]);

  const wmtsMapLayerUids = useMemo(() => {
    if (_isNil(map) || _isNil(pixelCoordinate)) {
      return [];
    }
    return map.getAllLayers()
      .toReversed()
      .filter(layerFilter)
      .filter(l => isWmtsLayer(l))
      .map(getUid);
  }, [layerFilter, map, pixelCoordinate]);

  const wfsMapLayerUids = useMemo(() => {
    if (_isNil(map) || _isNil(pixelCoordinate)) {
      return [];
    }
    return map.getAllLayers()
      .toReversed()
      .filter(layerFilter)
      .filter(l => isWfsLayer(l))
      .map(getUid);
  }, [layerFilter, map, pixelCoordinate]);

  const orderedLayerUids = useMemo(() => {
    if (_isNil(map)) {
      return [];
    }
    const all = map.getAllLayers().toReversed();
    const relevantLayers = map.getAllLayers()
      .filter(l => {
        const uid = getUid(l);
        return wfsMapLayerUids.includes(uid) || wmtsMapLayerUids.includes(uid) || wmsMapLayerUids.includes(uid);
      });

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

    return relevantLayers.map(getUid);
  }, [map, wfsMapLayerUids, wmtsMapLayerUids, wmsMapLayerUids]);

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
    const layerUids = useWms ? wmsMapLayerUids : wmtsMapLayerUids;

    for (const layerId of layerUids) {
      try {
        const abortController = abortControllers.current.get(layerId);

        if (! abortController) {
          continue;
        }

        const layer = map.getAllLayers().find(l => getUid(l) === layerId) as WmsLayer | WmtsLayer | undefined;
        if (!layer) {
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
            opts = fetchOpts[layerId];
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
  }, [map, viewResolution, viewProjection, wmsMapLayerUids, wmtsMapLayerUids,
    getInfoFormat, featureCount, fetchOpts, drillDown]);

  const getResultsFromWfsLayers = useCallback(async (
    coordinate: OlCoordinate
  ): Promise<FeatureLayerResult[]> => {
    if (_isNil(map) || _isNil(viewProjection)) {
      return [];
    }

    const results: FeatureLayerResult[] = [];

    for (const layerId of wfsMapLayerUids) {
      if (! drillDown && results.length > 0) {
        break;
      }

      const layer = map.getAllLayers().find(l => getUid(l) === layerId) as WfsLayer | undefined;
      if (!layer) {
        continue;
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
  }, [map, viewProjection, wfsMapLayerUids, drillDown]);

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
    setMapCoordinate(clonedCoordinate);
    setPixelCoordinate(clonedPixelCoordinate);
  }, [clickEvent, map, viewProjection, viewResolution]);

  /**
   * Resets featureResults when mapCoordinate changes.
   */
  useEffect(() => {
    if (!_isNil(mapCoordinate)) {
      setFeatureResults(undefined);
    }
  }, [mapCoordinate]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (_isNil(mapCoordinate) || _isNil(map) || orderedLayerUids?.length === 0) {
      return;
    }

    if (!_isNil(featureResults)) {
      return;
    }

    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();

    orderedLayerUids.forEach(uid => {
      const abortController = new AbortController();
      abortControllers.current.set(uid, abortController);
    });

    const fetchFeatures = async () => {
      try {
        setLoading(true);
        setFeatureResults(undefined);

        const promises: Promise<FeatureLayerResult[]>[] = [];
        const allRelevantLayerUids = [...wfsMapLayerUids, ...wmtsMapLayerUids, ...wmsMapLayerUids];

        for (const uid of orderedLayerUids) {
          const layerId = allRelevantLayerUids.find(id => id === uid);
          const layer = map.getAllLayers().find(l => getUid(l) === layerId);

          if (!layer) {
            continue;
          }
          if (isWmsLayer(layer)) {
            promises.push(getResultsFromImageLayers(mapCoordinate, true));
          } else if (isWmtsLayer(layer)) {
            promises.push(getResultsFromImageLayers(mapCoordinate, false));
          } else if (isWfsLayer(layer)) {
            promises.push(getResultsFromWfsLayers(mapCoordinate));
          }
        }

        let allResults: FeatureLayerResult[][] = await Promise.all(promises);
        allResults = await Promise.all(promises);

        if (!drillDown) {
          // filter empty results, order by layer index and return the first layer found
          const firstResult = allResults
            .filter(r => r.length > 0)
            .sort((a, b) => {
              const aIdx = orderedLayerUids.indexOf(getUid(a[0].layer));
              const bIdx = orderedLayerUids.indexOf(getUid(b[0].layer));
              return aIdx - bIdx;
            })[0] ?? [];
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
    mapCoordinate, drillDown, featureResults, getResultsFromImageLayers, getResultsFromWfsLayers, map, orderedLayerUids,
    onError, onSuccess, loading, wfsMapLayerUids, wmsMapLayerUids, wmtsMapLayerUids
  ]);

  /**
   * (Re)creates map event listeners whenever relevant props change (active, drilldown, clickEvent).
   */
  useEffect(() => {
    let keyMove: EventsKey | undefined;
    let keyRest: EventsKey | undefined;
    let keyClick: EventsKey | undefined;
    if (active) {
      if (registerOnClick && clickEvent) {
        keyClick = map?.on(clickEvent, handleMapEvent);
      }

      if (registerOnPointerMove && !drillDown) {
        keyMove = map?.on('pointermove', onPointerMove);
      }

      if (registerOnPointerRest && !drillDown) {
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
    registerOnPointerMove, registerOnPointerRest, clickEvent, drillDown
  ]);

  useEffect(() => {
    const controllers = abortControllers.current;
    return () => {
      controllers.forEach(c => c.abort());
      controllers.clear();
    };
  }, [viewResolution]);

  /**
   * Update mouse cursor when GFI is loading.
   */
  useEffect(() => {
    if (_isNil(map)) {
      return;
    }
    map.getTargetElement().style.cursor = loading ? 'wait' : 'auto';
  }, [loading, map]);

  // We want to propagate the state here so the variables do
  // not change on every render cycle.
  return {
    clickCoordinate: mapCoordinate,
    features: featureResults,
    loading,
    pixelCoordinate
  };
};

export default useCoordinateInfo;
