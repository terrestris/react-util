import { useState } from 'react';

import _groupBy from 'lodash/groupBy';

import _isNil from 'lodash/isNil';
import _mapValues from 'lodash/mapValues';

import { UrlUtil } from '@terrestris/base-util/dist/UrlUtil/UrlUtil';

import { useAsyncEffect } from '../../index';

export interface ProjectionDefinition {
  code: string;
  description: string;
  name: string;
  proj4: string;
  unit: string;
  bbox: number[] | [number, number, number, number];
}

export interface UseProjFromEpsgIOArgs {
  crsApiUrl?: string;
  searchValue?: string;
  onFetchError?: (error: any) => void;
}

export const useProjFromEpsgIO = ({
  crsApiUrl = 'https://epsg.io/',
  searchValue,
  onFetchError = () => undefined
}: UseProjFromEpsgIOArgs) => {

  const [projectionDefinitions, setProjectionDefinitions] = useState<ProjectionDefinition[]>();

  /**
   * Fetch CRS definitions from epsg.io for given search string
   */
  const fetchCrs = async () => {
    const queryParameters = {
      format: 'json',
      q: searchValue
    };

    return fetch(`${crsApiUrl}?${UrlUtil.objectToRequestString(queryParameters)}`)
      .then(response => response.json())
      .catch(onFetchError);
  };

  /**
   * This function transforms results of EPSG.io
   *
   * @param json The result object of EPSG.io-API, see where
   *  https://github.com/klokantech/epsg.io#api-for-results
   * @return Array of CRS definitions used in CoordinateReferenceSystemCombo
   */
  const transformResults = (json: any): ProjectionDefinition[] => {
    const results = json.results;
    if (results && results.length > 0) {
      return results.map((obj: any): ProjectionDefinition => ({
        code: obj.code,
        name: obj.name,
        proj4: obj.proj4,
        bbox: obj.bbox,
        description: obj.area,
        unit: obj.unit
      }));
    } else {
      return [];
    }
  };

  useAsyncEffect(async () => {
    if (!_isNil(searchValue)) {
      const result = await fetchCrs();
      setProjectionDefinitions(transformResults(result));
    }
  }, [searchValue]);

  if (_isNil(searchValue) || _isNil(projectionDefinitions)) {
    return undefined;
  }

  return _mapValues(
    _groupBy(projectionDefinitions, (p: ProjectionDefinition) => p.code),
    (projDefs: ProjectionDefinition[]) => Array.isArray(projDefs) ? projDefs[0] : undefined
  );
};
