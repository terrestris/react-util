import {
  useCallback, useEffect, useState
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
  features: FeatureLayerResult[];
  loading: boolean;
}

export interface UseCoordinateInfoArgs {
  active: boolean;
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
  const id = feature.getId();
  return isString(id) ? id.split('.')[0] : id?.toString() ?? uniqueId('UNKNOWN');
};

export const useCoordinateInfo = ({
  active,
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
  const [featureResults, setFeatureResults] = useState<FeatureLayerResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (map && loading) {
      map.getTargetElement().style.cursor = 'wait';
      return () => {
        map.getTargetElement().style.cursor = 'auto';
      };
    }
    return undefined;
  }, [loading, map]);

  const onPointerMove = useCallback((olEvt: OlMapBrowserEvent<MouseEvent>) => {
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

  const handleMapEvent = useCallback(async (olEvt: OlMapBrowserEvent<MouseEvent>) => {
    if (_isNil(map)) {
      return;
    }
    const mapView = map.getView();
    const viewResolution = mapView.getResolution();
    const viewProjection = mapView.getProjection();
    const pixel = map.getEventPixel(olEvt.originalEvent);
    const coordinate = olEvt.coordinate;

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

    setLoading(true);

    try {
      const results: FeatureLayerResult[] = [];

      for (const layer of wmsMapLayers) {
        try {
          if (!drillDown && results.length > 0) {
            break;
          }
          const wmsLayerSource = layer.getSource();
          if (!wmsLayerSource) {
            continue;
          }
          const infoFormat = await getInfoFormat(layer);
          const featureInfoUrl = wmsLayerSource.getFeatureInfoUrl(
            coordinate,
          viewResolution!,
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
            const response = await fetch(featureInfoUrl, opts);
            let format: OlFormatGML2 | OlFormatGml3 | OlFormatGml32 | OlFormatGeoJSON | null = null;

            let isJson = false;
            if (infoFormat === 'application/vnd.ogc.gml') {
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
          Logger.error(error);
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
      setFeatureResults(clonedResults);
      setClickCoordinate(clonedCoordinate);

      onSuccess?.({
        clickCoordinate: clonedCoordinate,
        loading: false,
        features: clonedResults
      });

    } catch (error: any) {
      Logger.error(error);
      onError?.(error);
    }
    setLoading(false);

  }, [drillDown, featureCount, fetchOpts, getInfoFormat, layerFilter, map, onError, onSuccess]);

  useEffect(() => {
    let keyMove: EventsKey | undefined;
    let keyRest: EventsKey | undefined;
    let keyClick: EventsKey | undefined;
    if (active) {
      if (registerOnClick) {
        keyClick = map?.on('click', handleMapEvent);
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
      if (keyClick) {
        map?.un('click', keyClick.listener);
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
    active, map, onPointerMove, handleMapEvent, registerOnClick, registerOnPointerMove, registerOnPointerRest
  ]);

  // We want to propagate the state here so the variables do
  // not change on every render cycle.
  return {
    clickCoordinate,
    loading,
    features: featureResults
  };
};

export default useCoordinateInfo;
