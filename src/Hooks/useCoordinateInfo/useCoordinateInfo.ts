import {
  useCallback, useEffect, useMemo, useRef, useState
} from 'react';

import {
  cloneDeep, isString, uniqueId
} from 'lodash';

import _isNil from 'lodash/isNil';
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
import OlSource from 'ol/source/Source';
import { getUid } from 'ol/util';

import Logger from '@terrestris/base-util/dist/Logger';
import {
  isWfsLayer, isWmsLayer, WfsLayer, WmsLayer
} from '@terrestris/ol-util';

import useMap from '../useMap/useMap';

export interface FeatureLayerResult {
  feature: OlFeature;
  layer: WmsLayer|WfsLayer;
  featureType: string;
}

export interface CoordinateInfoResult {
  clickCoordinate: OlCoordinate | null;
  pixelCoordinate: [number, number] | null;
  features: FeatureLayerResult[];
  loading: boolean;
}

export interface UseCoordinateInfoArgs {
  active: boolean;
  clickEvent?: 'click' | 'dblclick';
  drillDown?: boolean;
  featureCount?: number;
  fetchOpts?: Record<string, RequestInit> | ((layer: WmsLayer) => RequestInit);
  getInfoFormat?: (layer: WmsLayer) => string | Promise<string>;
  layerFilter?: (layerCandidate: OlLayer<OlSource>) => boolean;
  onError?: (error: any) => void;
  onSuccess?: (result: CoordinateInfoResult) => void;
  registerOnClick?: boolean;
  registerOnPointerMove?: boolean;
  registerOnPointerRest?: boolean;
}

const getFeatureType = (feature: OlFeature) => {
  const id = feature.getId() ?? feature.get('id');
  return isString(id) ? id.split('.')[0] : id?.toString() ?? uniqueId('UNKNOWN');
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

  const [clickCoordinate, setClickCoordinate] = useState<OlCoordinate | null>(null);
  const [pixelCoordinate, setPixelCoordinate] = useState<[number, number] | null>(null);
  const [featureResults, setFeatureResults] = useState<FeatureLayerResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const mapView = useMemo(() => map?.getView(), [map]);
  const viewResolution = useMemo(() => mapView?.getResolution(), [mapView]);
  const viewProjection = useMemo(() => mapView?.getProjection(), [mapView]);

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
    map.getTargetElement().style.cursor = hits?.length > 0 ? 'pointer' : '';
  }, [layerFilter, map]);

  const handleMapEvent = useCallback(async (olEvt: OlMapBrowserEvent) => {
    if (_isNil(map) || _isNil(viewResolution) || _isNil(viewProjection)) {
      return;
    }

    if (clickEvent === 'dblclick') {
      // prevent map zoom on double click
      olEvt.stopPropagation();
    }

    const pixel = map.getEventPixel(olEvt.originalEvent);
    const coordinate = olEvt.coordinate;
    let evtPixelCoordinate: [number, number] = [0, 0];
    if (olEvt.originalEvent instanceof PointerEvent) {
      evtPixelCoordinate = [olEvt.originalEvent.x, olEvt.originalEvent.y];
    }

    const wmsMapLayers =
      map.getAllLayers()
        .reverse()
        .filter(layerFilter)
        .filter(l => l.getData && l.getData(pixel) && isWmsLayer(l)) as WmsLayer[];

    const wfsMapLayers =
      map.getAllLayers()
        .reverse()
        .filter(layerFilter)
        .filter(l => isWfsLayer(l)) as WfsLayer[];

    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();

    setLoading(true);

    try {
      const results: FeatureLayerResult[] = [];

      for (const layer of wmsMapLayers) {
        try {
          if (!drillDown && results.length > 0) {
            break;
          }

          const layerId = getUid(layer);
          const abortController = new AbortController();
          abortControllers.current.set(layerId, abortController);

          const wmsLayerSource = layer.getSource();
          if (!wmsLayerSource) {
            continue;
          }
          const infoFormat = await getInfoFormat(layer);
          const featureInfoUrl = wmsLayerSource.getFeatureInfoUrl(
            coordinate,
            viewResolution,
            viewProjection,
            {
              INFO_FORMAT: infoFormat,
              FEATURE_COUNT: featureCount
            }
          );
          if (featureInfoUrl) {
            let opts;
            if (fetchOpts instanceof Function) {
              opts = fetchOpts(layer as WmsLayer);
            } else {
              opts = fetchOpts[getUid(layer)];
            }
            const response = await fetch(featureInfoUrl, {
              ...opts,
              signal: abortController.signal
            });

            let format: OlFormatGML2 | OlFormatGml3 | OlFormatGml32 |
              OlFormatGeoJSON | OlFormatWMSGetFeatureInfo | null = null;

            let isJson = false;
            if (infoFormat === 'application/vnd.ogc.gml') {
              format = new OlFormatWMSGetFeatureInfo();
            } else if (infoFormat.indexOf('gml/2') > -1) {
              format = new OlFormatGML2();
            } else if (infoFormat === 'application/vnd.ogc.gml/3.1.1' || infoFormat === 'text/xml; subtype=gml/3.1.1') {
              format = new OlFormatGml3();
            } else if (infoFormat === 'application/vnd.ogc.gml/3.2' || infoFormat === 'text/xml; subtype=gml/3.2') {
              format = new OlFormatGml32();
            } else if (infoFormat === 'application/json' || infoFormat.indexOf('json') > -1) {
              format = new OlFormatGeoJSON();
              isJson = true;
            } else {
              continue;
            }

            const text = isJson ? await response.json() : await response.text();

            results.push(...format.readFeatures(text).map(f => ({
              feature: f,
              layer,
              featureType: getFeatureType(f)
            })));
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            Logger.error(error);
          }
        }
      }
      for (const layer of wfsMapLayers) {
        if (!drillDown && results.length > 0) {
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

      // We're cloning the click coordinate and features to be able
      // to alter the features without affecting the original ones
      // Also note that we explicitly don't use feature.clone() to
      // keep all feature properties (in particular the id) intact.
      const clonedResults = cloneDeep(results);
      const clonedCoordinate = cloneDeep(coordinate);
      const clonedPixelCoordinate = cloneDeep(evtPixelCoordinate);
      setFeatureResults(clonedResults);
      setClickCoordinate(clonedCoordinate);
      setPixelCoordinate(clonedPixelCoordinate);

      onSuccess?.({
        clickCoordinate: clonedCoordinate,
        pixelCoordinate: clonedPixelCoordinate,
        loading: false,
        features: clonedResults
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        Logger.error(error);
        onError?.(error);
      }
      setLoading(false);
    }
  }, [clickEvent, drillDown, featureCount, fetchOpts, getInfoFormat,
    layerFilter, map, onError, onSuccess, viewProjection, viewResolution]);

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
    if (map && loading) {
      map.getTargetElement().style.cursor = 'wait';
      return () => {
        map.getTargetElement().style.cursor = 'auto';
      };
    }
    return undefined;
  }, [loading, map]);

  useEffect(() => {
    return () => {
      abortControllers.current.forEach(c => c.abort());
      abortControllers.current.clear();
    };
  }, [viewResolution, abortControllers]);

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
