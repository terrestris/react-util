import Logger from '@terrestris/base-util/dist/Logger';
import _cloneDeep from 'lodash/cloneDeep';
import _groupBy from 'lodash/groupBy';
import _isNil from 'lodash/isNil';
import _isString from 'lodash/isString';
import _uniqueId from 'lodash/uniqueId';
import { Coordinate as OlCoordinate } from 'ol/coordinate';
import OlFeature from 'ol/Feature';
import OlFormatGML2 from 'ol/format/GML2';
import OlBaseLayer from 'ol/layer/Base';
import OlMapBrowserEvent from 'ol/MapBrowserEvent';
import { getUid } from 'ol/util';
import { useCallback, useEffect, useState } from 'react';

import { isWmsLayer, WmsLayer } from '../../Util/typeUtils';
import useMap from '../useMap/useMap';

export type FeatureMap = {
  [featureTypeName: string]: OlFeature[];
};

export type CoordinateInfoResult = {
  clickCoordinate: OlCoordinate | null;
  features: FeatureMap;
  loading: boolean;
};

const format = new OlFormatGML2();

export type UseCoordinateInfoArgs = {
  drillDown?: boolean;
  featureCount?: number;
  fetchOpts?: {
    [uid: string]: RequestInit;
  } | ((layer: WmsLayer) => RequestInit);
  onError?: (error: any) => void;
  queryLayers?: OlBaseLayer[];
};

export const useCoordinateInfo = ({
  queryLayers = [],
  featureCount = 1,
  fetchOpts = {},
  drillDown = false,
  onError = () => {}
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
    const mapLayers =
      map.getAllLayers()
        .filter(layerFilter)
        .filter(l => l.getData && l.getData(pixel) && isWmsLayer(l));

    setLoading(true);
    map.getTargetElement().style.cursor = 'wait';

    try {
      for (const l of mapLayers) {
        const layerSource = (l as WmsLayer).getSource();
        if (!layerSource) {
          continue;
        }
        const featureInfoUrl = layerSource.getFeatureInfoUrl(
          coordinate,
          viewResolution!,
          viewProjection,
          {
            INFO_FORMAT: 'application/vnd.ogc.gml',
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
          const fetchedResult = await fetch(featureInfoUrl, opts).then(r => r.text());
          const featureCollection = format.readFeatures(fetchedResult);
          olFeatures.push(...featureCollection);
        }

        if (!drillDown && olFeatures.length > 0) {
          return;
        }
      }
      const featureMap: { [index: string]: OlFeature[] } = _groupBy(olFeatures, (feature: OlFeature) => {
        const id = feature.getId();
        return _isString(id) ? id.split('.')[0] : id?.toString() ?? _uniqueId('UNKNOWN');
      });
      setFeatures(featureMap);
      setClickCoordinate(coordinate);

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
