import Logger from '@terrestris/base-util/dist/Logger';
import _cloneDeep from 'lodash/cloneDeep';
import _isNil from 'lodash/isNil';
import _isString from 'lodash/isString';
import { Coordinate as OlCoordinate } from 'ol/coordinate';
import OlFeature from 'ol/Feature';
import OlFormatGML2 from 'ol/format/GML2';
import OlGeometry from 'ol/geom/Geometry';
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
  onSuccess?: (features: CoordinateInfoResult) => void;
  queryLayers?: OlBaseLayer[];
};

export const useCoordinateInfo = ({
  queryLayers = [],
  featureCount = 1,
  fetchOpts = {},
  drillDown = false,
  onSuccess = () => {},
  onError = () => {}
}: UseCoordinateInfoArgs): void => {

  const map = useMap();

  const [clickCoordinate, setClickCoordinate] = useState<any>();
  const [features, setFeatures] = useState<FeatureMap>({});
  const [loading, setLoading] = useState<boolean>(false);


  /**
   * We're cloning the click coordinate and features to
   * not pass the internal state reference to the parent component.
   * Also note that we explicitly don't use feature.clone() to
   * keep all feature properties (in particular the id) intact.
   */
  const getCoordinateInfoStateObject = useCallback((): CoordinateInfoResult => ({
    clickCoordinate: _cloneDeep(clickCoordinate),
    loading,
    features: _cloneDeep(features)
  }), [clickCoordinate, features, loading]);

  const layerFilter = useCallback((layerCandidate: OlBaseLayer): boolean => {
    return queryLayers.includes(layerCandidate);
  }, [queryLayers]);

  const onMapClick = useCallback((olEvt: OlMapBrowserEvent<MouseEvent>) => {
    if (_isNil(map)) {
      return;
    }
    const mapView = map.getView();
    const viewResolution = mapView.getResolution();
    const viewProjection = mapView.getProjection();
    const pixel = map.getEventPixel(olEvt.originalEvent);
    const coordinate = olEvt.coordinate;

    const promises: Promise<any>[] = [];

    const mapLayers =
      map.getAllLayers()
        .filter(layerFilter)
        .filter(l => l.getData && l.getData(pixel) && isWmsLayer(l));
    mapLayers.forEach(l => {
      const layerSource = (l as WmsLayer).getSource();
      if (!layerSource) {
        return Promise.resolve();
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
        promises.push(fetch(featureInfoUrl, opts));
      }

      return !drillDown;
    });

    map.getTargetElement().style.cursor = 'wait';

    setLoading(true);

    Promise.all(promises)
      .then((responses: Response[]) => {
        setClickCoordinate(coordinate);
        const textResponses = responses.map(response => response.text());
        return Promise.all(textResponses);
      })
      .then((textResponses: string[]) => {
        const featureMap: { [index: string]: OlFeature[] } = {};

        textResponses.forEach((featureCollection: string, idx: number) => {
          const fc = format.readFeatures(featureCollection);
          fc.forEach((feature: OlFeature<OlGeometry>) => {
            const id = feature.getId();
            const featureTypeName = _isString(id) ? id.split('.')[0] : id?.toString() ?? `UNKNOWN-${idx}`;

            if (!featureMap[featureTypeName]) {
              featureMap[featureTypeName] = [];
            }

            featureMap[featureTypeName].push(feature);
          });
        });

        setFeatures(featureMap);
        onSuccess(getCoordinateInfoStateObject());

      })
      .catch((error: any) => {
        Logger.error(error);

        onError(error);
      })
      .finally(() => {
        map.getTargetElement().style.cursor = '';
        setLoading(false);
      });
  }, [drillDown, featureCount, fetchOpts, getCoordinateInfoStateObject, layerFilter, map, onError, onSuccess]);

  useEffect(() => {
    map?.on('click', onMapClick);

    return () => {
      map?.un('click', onMapClick);
    };
  }, [map, onMapClick]);

};

export default useCoordinateInfo;
