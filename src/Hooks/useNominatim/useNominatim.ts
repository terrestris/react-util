

// See https://nominatim.org/release-docs/develop/api/Output/ for some more information
import { UrlUtil } from '@terrestris/base-util';
import Logger from '@terrestris/base-util/dist/Logger';
import { GeoJSON } from 'geojson';
import { useEffect, useState } from 'react';

export type NominatimPlace = {
  // eslint-disable-next-line camelcase
  place_id: number;
  // eslint-disable-next-line camelcase
  osm_type: string;
  // eslint-disable-next-line camelcase
  osm_id: number;
  boundingbox: string[];
  // eslint-disable-next-line camelcase
  display_name: string;
  category: string;
  type: string;
  importance: number;
  icon?: string;
  address?: any;
  extratags?: any;
  namedetails?: any;
  geojson: GeoJSON;
  licence: string;
};

export type UseNominatimArgs = {
  searchTerm: string;
  /**
   * Time in miliseconds that the search waits before doing a request.
   */
  debounceTime?: number;
  /**
   * The Nominatim Base URL. See https://wiki.openstreetmap.org/wiki/Nominatim
   */
  nominatimBaseUrl?: string;
  /**
   * Output format.
   */
  format?: string;
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
   * Output geometry of results in geojson format.
   */
  polygonGeoJSON?: number;
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
  /**
   * A callback function which gets called if data fetching has failed.
   */
  onFetchError?: (error: any) => void;
  /**
   * A callback function which gets called if data fetching has succeeded.
   */
  onFetchSuccess?: (places: NominatimPlace[]) => void;
  /**
   * The minimal amount of characters in the input to start a search.
   */
  minChars?: number;
};

export const useNominatim = ({
  addressDetails = 1,
  bounded = 1,
  countryCodes = 'de',
  debounceTime = 300,
  format = 'json',
  limit = 10,
  minChars = 3,
  nominatimBaseUrl = 'https://nominatim.openstreetmap.org/search?',
  onFetchError,
  onFetchSuccess,
  polygonGeoJSON = 1,
  searchResultLanguage,
  searchTerm,
  viewBox = '-180,90,180,-90'
}: UseNominatimArgs): NominatimPlace[] | undefined => {

  const [nominatimResults, setNominatimResults] = useState<NominatimPlace[]>([]);

  const onError = (error: any) => {
    Logger.error(`Error while requesting Nominatim: ${error}`);
    onFetchError?.(error);
  };

  // TODO abort controller
  const fetchResults = async (baseParams: any) => {
    const getRequestParams = UrlUtil.objectToRequestString(baseParams);
    try {
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
        onError(new Error(`Return code: ${response.status}`));
      }
      const responseJson = await response.json();
      setNominatimResults(responseJson);
      onFetchSuccess?.(responseJson);
    } catch (error) {
      onError(error);
    }
  };

  /**
   * Trigger search when searchTerm has changed
   */
  useEffect(() => {
    setNominatimResults([]);

    if (!searchTerm) {
      setNominatimResults([]);
    }

    if (!searchTerm || searchTerm.length < minChars) {
      return () => undefined;
    }

    const timeout = setTimeout(async () => {
      await fetchResults({
        format: format,
        viewbox: viewBox,
        bounded: bounded,
        // eslint-disable-next-line camelcase
        polygon_geojson: polygonGeoJSON,
        addressdetails: addressDetails,
        limit: limit,
        countrycodes: countryCodes,
        q: searchTerm
      });
    }, debounceTime);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchTerm]);

  return nominatimResults;
};

export default useNominatim;
