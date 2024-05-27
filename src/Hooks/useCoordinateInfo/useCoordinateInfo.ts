import Logger from '@terrestris/base-util/dist/Logger';
import { isWfsLayer, isWmsLayer, WfsLayer, WmsLayer } from '@terrestris/ol-util';
import _cloneDeep from 'lodash/cloneDeep';
import _groupBy from 'lodash/groupBy';
import _isNil from 'lodash/isNil';
import _isString from 'lodash/isString';
import _uniqueId from 'lodash/uniqueId';
import { Coordinate as OlCoordinate } from 'ol/coordinate';
import OlFeature from 'ol/Feature';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlFormatGML2 from 'ol/format/GML2';
import OlBaseLayer from 'ol/layer/Base';
import OlMapBrowserEvent from 'ol/MapBrowserEvent';
import { getUid } from 'ol/util';
import { useCallback, useEffect, useState } from 'react';

import useMap from '../useMap/useMap';

export type FeatureMap = {
  [featureTypeName: string]: OlFeature[];
};

export type CoordinateInfoResult = {
  clickCoordinate: OlCoordinate | null;
  features: FeatureMap;
  loading: boolean;
};

export type UseCoordinateInfoArgs = {
  drillDown?: boolean;
  featureCount?: number;
  fetchOpts?: {
    [uid: string]: RequestInit;
  } | ((layer: WmsLayer) => RequestInit);
  onError?: (error: any) => void;
  onSuccess?: (result: CoordinateInfoResult) => void;
  queryLayers?: OlBaseLayer[];
  infoFormat?: 'gml'|'json';
};

const getInfoFormat = (type: 'gml'|'json') => {
  if (type === 'gml') {
    return 'application/vnd.ogc.gml';
  } else if (type === 'json') {
    return 'application/json';
  } else {
    throw new Error('Unknown info format type');
  }
};

export const useCoordinateInfo = ({
  queryLayers = [],
  featureCount = 1,
  fetchOpts = {},
  drillDown = false,
  onError = () => { },
  onSuccess = () => { },
  infoFormat = 'gml'
}: UseCoordinateInfoArgs): CoordinateInfoResult => {

  const map = useMap();

  const [clickCoordinate, setClickCoordinate] = useState<any>();
  const [features, setFeatures] = useState<FeatureMap>({});
  const [loading, setLoading] = useState<boolean>(false);

  const layerFilter = useCallback((layerCandidate: OlBaseLayer): boolean => {
    return queryLayers.includes(layerCandidate);
  }, [queryLayers]);

  const onMapClick = useCallback(async (olEvt: OlMapBrowserEvent<MouseEvent>) => {
    if (_isNil(map)) {
      return;
    }
    const mapView = map.getView();
    const viewResolution = mapView.getResolution();
    const viewProjection = mapView.getProjection();
    const pixel = map.getEventPixel(olEvt.originalEvent);
    const coordinate = olEvt.coordinate;

    const olFeatures: OlFeature[] = [];
    const wmsMapLayers =
      map.getAllLayers()
        .filter(layerFilter)
        .filter(l => l.getData && l.getData(pixel) && isWmsLayer(l));

    const wfsMapLayers =
      map.getAllLayers()
        .filter(layerFilter)
        .filter(l => isWfsLayer(l));

    setLoading(true);
    map.getTargetElement().style.cursor = 'wait';

    try {
      for (const l of wmsMapLayers) {
        if (!drillDown && olFeatures.length > 0) {
          break;
        }
        const wmsLayerSource = (l as WmsLayer).getSource();
        if (!wmsLayerSource) {
          continue;
        }
        const featureInfoUrl = wmsLayerSource.getFeatureInfoUrl(
          coordinate,
          viewResolution!,
          viewProjection,
          {
            INFO_FORMAT: getInfoFormat(infoFormat),
            FEATURE_COUNT: featureCount
          }
        );
        if (featureInfoUrl) {
          let opts;
          if (fetchOpts instanceof Function) {
            opts = fetchOpts(l as WmsLayer);
          } else {
            opts = fetchOpts[getUid(l)];
          }
          const response = await fetch(featureInfoUrl, opts);
          let format: OlFormatGML2 | OlFormatGeoJSON | null = null;

          if (infoFormat === 'gml') {
            format = new OlFormatGML2();
          } else if (infoFormat === 'json') {
            format = new OlFormatGeoJSON();
          } else {
            return;
          }

          const text = await response.text();

          olFeatures.push(...format.readFeatures(text));
        }
      }
      for (const l of wfsMapLayers) {
        if (!drillDown && olFeatures.length > 0) {
          break;
        }
        const wfsLayerSource = (l as WfsLayer).getSource();

        const wfsFeatures = wfsLayerSource?.getFeaturesAtCoordinate(coordinate);
        wfsFeatures?.forEach(feature => olFeatures.push(feature));
      }
      const featureMap: { [index: string]: OlFeature[] } = _groupBy(olFeatures, (feature: OlFeature) => {
        const id = feature.getId();
        return _isString(id) ? id.split('.')[0] : id?.toString() ?? _uniqueId('UNKNOWN');
      });
      setFeatures(featureMap);
      setClickCoordinate(coordinate);

      // We're cloning the click coordinate and features to
      // not pass the internal state reference to the parent component.
      // Also note that we explicitly don't use feature.clone() to
      // keep all feature properties (in particular the id) intact.
      onSuccess({
        clickCoordinate: _cloneDeep(coordinate),
        loading,
        features: _cloneDeep(featureMap)
      });

    } catch (error: any) {
      Logger.error(error);
      onError(error);
    }
    map.getTargetElement().style.cursor = '';
    setLoading(false);

  }, [drillDown, featureCount, fetchOpts, layerFilter, map, onError]);

  useEffect(() => {
    map?.on('click', onMapClick);

    return () => {
      map?.un('click', onMapClick);
    };
  }, [map, onMapClick]);

  return {
    clickCoordinate: _cloneDeep(clickCoordinate),
    loading,
    features: _cloneDeep(features)
  };
};

export default useCoordinateInfo;
