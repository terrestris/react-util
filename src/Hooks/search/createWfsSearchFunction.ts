import WfsFilterUtil, { SearchConfig } from '@terrestris/ol-util/dist/WfsFilterUtil/WfsFilterUtil';
import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import _isNil from 'lodash/isNil';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlFormatGml3 from 'ol/format/GML3';

import { SearchFunction } from './useSearch/useSearch';

export type WfsArgs = {
  additionalFetchOptions?: Partial<RequestInit>;
  baseUrl: string;
} & Omit<SearchConfig, 'olFilterOnly'|'filter'|'wfsFormatOptions'>;

export const createWfsSearchFunction = <
  G extends Geometry = Geometry,
  T extends GeoJsonProperties = Record<string, any>,
  C extends FeatureCollection<G, T> = FeatureCollection<G, T>
>({
    additionalFetchOptions = {},
    baseUrl,
    featureNS,
    featurePrefix,
    featureTypes,
    geometryName,
    maxFeatures,
    outputFormat = 'application/json',
    srsName = 'EPSG:4326',
    attributeDetails,
    propertyNames
  }: WfsArgs): SearchFunction<G, T, C> => {

  return async searchTerm => {
    const request = WfsFilterUtil.getCombinedRequests({
      featureNS,
      featurePrefix,
      featureTypes,
      geometryName,
      maxFeatures,
      outputFormat,
      srsName,
      attributeDetails,
      propertyNames
    }, searchTerm) as Element;
    const requestBody = (new XMLSerializer()).serializeToString(request);
    if (!_isNil(request)) {
      const response = await fetch(`${baseUrl}`, {
        method: 'POST',
        credentials: additionalFetchOptions?.credentials ?? 'same-origin',
        body: requestBody,
        ...additionalFetchOptions
      });

      if (outputFormat.includes('json')) {
        return response.json() as unknown as C;
      } else {
        const responseString = await response.text();

        const formatGml = new OlFormatGml3({
          featureNS,
          srsName
        });

        const formatGeoJson = new OlFormatGeoJSON();
        return formatGeoJson.writeFeaturesObject(formatGml.readFeatures(responseString)) as C;
      }
    } else {
      throw new Error('WFS request is empty/null');
    }
  };
};
