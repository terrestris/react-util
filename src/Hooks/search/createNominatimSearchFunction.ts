// See https://nominatim.org/release-docs/develop/api/Output/ for some more information
import {
  Feature, Geometry
} from 'geojson';
import { Extent } from 'ol/extent';

import { UrlUtil } from '@terrestris/base-util';

import { SearchFunction } from './useSearch/useSearch';

export interface NominatimPlace {

  place_id: number;

  osm_type: string;

  osm_id: number;
  boundingbox: string[];

  display_name: string;
  category: string;
  type: string;
  importance: number;
  icon?: string;
  address?: any;
  extratags?: any;
  namedetails?: any;
  geojson: Geometry;
  licence: string;
}

export interface NominatimArgs {
  /**
   * The Nominatim Base URL. See https://wiki.openstreetmap.org/wiki/Nominatim
   */
  nominatimBaseUrl?: string;
  /**
   * The preferred area to find search results in [left],[top],[right],[bottom].
   */
  viewBox?: string;
  /**
   * Restrict the results to only items contained with the bounding box.
   * Restricting the results to the bounding box also enables searching by
   * amenity only. For example a search query of just "[pub]" would normally be
   * rejected but with bounded=1 will result in a list of items matching within
   * the bounding box.
   */
  bounded?: number;
  /**
   * Include a breakdown of the address into elements.
   */
  addressDetails?: number;
  /**
   * Limit the number of returned results.
   */
  limit?: number;
  /**
   * Limit search results to a specific country (or a list of countries).
   * [countrycode] should be the ISO 3166-1alpha2 code, e.g. gb for the United
   * Kingdom, de for Germany, etc.
   */
  countryCodes?: string;
  /**
   * Preferred language order for showing search results, overrides the value
   * specified in the "Accept-Language" HTTP header. Either use a standard RFC2616
   * accept-language string or a simple comma-separated list of language codes.
   */
  searchResultLanguage?: string;
}

export const createNominatimSearchFunction = ({
  addressDetails = 1,
  bounded = 1,
  countryCodes = 'de',
  limit = 10,
  nominatimBaseUrl = 'https://nominatim.openstreetmap.org/search?',
  searchResultLanguage,
  viewBox = '-180,90,180,-90'
}: NominatimArgs = {}): SearchFunction<Geometry, NominatimPlace> => {
  return async (searchTerm) => {
    const baseParams = {
      format: 'json',
      viewbox: viewBox,
      bounded: bounded,
      // eslint-disable-next-line camelcase
      polygon_geojson: '1',
      addressdetails: addressDetails,
      limit: limit,
      countrycodes: countryCodes,
      q: searchTerm
    };

    const getRequestParams = UrlUtil.objectToRequestString(baseParams);

    let fetchOpts: RequestInit = {};
    if (searchResultLanguage) {
      fetchOpts = {
        headers: {
          'accept-language': searchResultLanguage
        }
      };
    }
    const response = await fetch(`${nominatimBaseUrl}${getRequestParams}`, fetchOpts);
    if (!response.ok) {
      throw new Error(`Return code: ${response.status}`);
    }
    const places = await response.json() as NominatimPlace[];
    return {
      type: 'FeatureCollection',
      features: places.map(p => ({
        type: 'Feature',
        geometry: p.geojson,
        properties: p
      }))
    };
  };
};

export const createNominatimGetValueFunction = () =>
  (feature: Feature<Geometry, NominatimPlace>) => feature.properties.display_name;

export const createNominatimGetExtentFunction = () =>
  (feature: Feature<Geometry, NominatimPlace>) => {
    const bbox: number[] = feature.properties.boundingbox.map(parseFloat);
    return [
      bbox[2],
      bbox[0],
      bbox[3],
      bbox[1]
    ] as Extent;
  };
