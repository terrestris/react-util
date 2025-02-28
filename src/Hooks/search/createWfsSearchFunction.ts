import {
  FeatureCollection, GeoJsonProperties, Geometry
} from 'geojson';
import _isNil from 'lodash/isNil';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlFormatGml2 from 'ol/format/GML2';
import OlFormatGml3 from 'ol/format/GML3';
import OlFormatGml32 from 'ol/format/GML32';

import logger from '@terrestris/base-util/dist/Logger';
import WfsFilterUtil, {
  SearchConfig
} from '@terrestris/ol-util/dist/WfsFilterUtil/WfsFilterUtil';

import { SearchFunction } from './useSearch/useSearch';

export type GmlVersion = 'GML2' | 'GML3' | 'GML32';

export type WfsArgs = {
  additionalFetchOptions?: Partial<RequestInit>;
  baseUrl: string;
  gmlVersion?: GmlVersion;
} & Omit<SearchConfig, 'olFilterOnly' | 'filter' | 'wfsFormatOptions'>;

const createGmlFormat = (
  version: GmlVersion,
  featureNS: string,
  srsName: string
) => {
  switch (version) {
    case 'GML32':
      return new OlFormatGml32({
        featureNS,
        srsName
      });
    case 'GML3':
      return new OlFormatGml3({
        featureNS,
        srsName
      });
    case 'GML2':
      return new OlFormatGml2({
        featureNS,
        srsName
      });
    default:
      throw new Error(`Unsupported GML version: ${version}`);
  }
};

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
    propertyNames,
    gmlVersion
  }: WfsArgs): SearchFunction<G, T, C> => {
  return async searchTerm => {
    const request = WfsFilterUtil.getCombinedRequests(
      {
        featureNS,
        featurePrefix,
        featureTypes,
        geometryName,
        maxFeatures,
        outputFormat,
        srsName,
        attributeDetails,
        propertyNames
      },
      searchTerm
    ) as Element;
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
        const formatGeoJson = new OlFormatGeoJSON();

        if (gmlVersion) {
          const formatGml = createGmlFormat(gmlVersion, featureNS, srsName);
          return formatGeoJson.writeFeaturesObject(
            formatGml.readFeatures(responseString)
          ) as C;
        }

        const gmlVersions: GmlVersion[] = ['GML32', 'GML3', 'GML2'];
        for (const version of gmlVersions) {
          try {
            const formatGml = createGmlFormat(version, featureNS, srsName);
            const features = formatGml.readFeatures(responseString);
            if (features.length > 0) {
              return formatGeoJson.writeFeaturesObject(features) as C;
            }
          } catch (error) {
            logger.warn(`Error parsing WFS response with ${version}:`, error);
          }
        }
      }
    }
    throw new Error('Failed to fetch WFS data');
  };
};
