import Logger from '@terrestris/base-util/dist/Logger';
import { isWfsLayer, isWmsLayer, WfsLayer, WmsLayer } from '@terrestris/ol-util';
import { isString, uniqueId } from 'lodash';
import _isNil from 'lodash/isNil';
import { Coordinate as OlCoordinate } from 'ol/coordinate';
import OlFeature from 'ol/Feature';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlFormatGML2 from 'ol/format/GML2';
import OlBaseLayer from 'ol/layer/Base';
import OlMapBrowserEvent from 'ol/MapBrowserEvent';
import { getUid } from 'ol/util';
import { useCallback, useEffect, useState } from 'react';

import useMap from '../useMap/useMap';

export type FeatureLayerResult = {
  feature: OlFeature;
  layer: WmsLayer|WfsLayer;
  featureType: string;
};

export type CoordinateInfoResult = {
  clickCoordinate: OlCoordinate | null;
  features: FeatureLayerResult[];
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

const getFeatureType = (feature: OlFeature) => {
  const id = feature.getId();
  return isString(id) ? id.split('.')[0] : id?.toString() ?? uniqueId('UNKNOWN');
};

export const useCoordinateInfo = ({
  queryLayers = [],
  featureCount = 1,
  fetchOpts = {},
  drillDown = false,
  onError,
  onSuccess,
  infoFormat = 'gml'
}: UseCoordinateInfoArgs): CoordinateInfoResult => {

  const map = useMap();

  const [clickCoordinate, setClickCoordinate] = useState<any>();
  const [featureResults, setFeatureResults] = useState<FeatureLayerResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const layerFilter = useCallback((layerCandidate: OlBaseLayer): boolean => {
    return queryLayers.includes(layerCandidate);
  }, [queryLayers]);

  useEffect(() => {
    if (map && loading) {
      map.getTargetElement().style.cursor = 'wait';
      return () => {
        map.getTargetElement().style.cursor = 'auto';
      };
    }
    return undefined;
  }, [loading, map]);

  const onMapClick = useCallback(async (olEvt: OlMapBrowserEvent<MouseEvent>) => {
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
        .filter(layerFilter)
        .filter(l => l.getData && l.getData(pixel) && isWmsLayer(l)) as WmsLayer[];

    const wfsMapLayers =
      map.getAllLayers()
        .filter(layerFilter)
        .filter(l => isWfsLayer(l)) as WfsLayer[];

    setLoading(true);

    try {
      const results: FeatureLayerResult[] = [];

      for (const layer of wmsMapLayers) {
        if (!drillDown && results.length > 0) {
          break;
        }
        const wmsLayerSource = layer.getSource();
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
            opts = fetchOpts(layer as WmsLayer);
          } else {
            opts = fetchOpts[getUid(layer)];
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

          results.push(...format.readFeatures(text).map(f => ({
            feature: f,
            layer,
            featureType: getFeatureType(f)
          })));
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
      setFeatureResults(results);
      setClickCoordinate(coordinate);

      // We can actually propagate the state variable here. It should
      // not be altered in another component.
      onSuccess?.({
        clickCoordinate: coordinate,
        loading: false,
        features: results
      });

    } catch (error: any) {
      Logger.error(error);
      onError?.(error);
    }
    setLoading(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drillDown, featureCount, fetchOpts, infoFormat, layerFilter, map]);

  useEffect(() => {
    map?.on('click', onMapClick);

    return () => {
      map?.un('click', onMapClick);
    };
  }, [map, onMapClick]);

  // We want to propagate the state here so the variables do
  // not change on every render cycle.
  return {
    clickCoordinate,
    loading,
    features: featureResults
  };
};

export default useCoordinateInfo;
