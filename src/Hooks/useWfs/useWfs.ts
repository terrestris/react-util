import Logger from '@terrestris/base-util/dist/Logger';
import WfsFilterUtil, { SearchConfig } from '@terrestris/ol-util/dist/WfsFilterUtil/WfsFilterUtil';
import _isNil from 'lodash/isNil';
import OlFeature from 'ol/Feature';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlFormatGml3 from 'ol/format/GML3';
import { useState } from 'react';

import { useAsyncEffect } from '../../index';

export type WfsQueryArgs = {
  additionalFetchOptions?: Partial<RequestInit>;
  baseUrl: string;
  minChars?: number;
  onFetchError?: (s: any) => void;
  onFetchSuccess?: (features: OlFeature[]) => void;
  searchConfig?: SearchConfig;
  searchTerm?: string;
};

export type WfsResponse = {
  features: OlFeature[] | undefined;
  loading: boolean;
};

export const useWfs = ({
  additionalFetchOptions = {},
  baseUrl,
  minChars = 3,
  onFetchError,
  onFetchSuccess,
  searchTerm,
  searchConfig
}: WfsQueryArgs): WfsResponse => {

  const [features, setFeatures] = useState<OlFeature[] | undefined>();
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Perform the WFS request.
   * @private
   */
  const performWfsRequest = async () => {
    if (_isNil(searchConfig)) {
      Logger.error('No search configuration given.');
      return;
    }

    if (!searchTerm) {
      return;
    }

    const request = WfsFilterUtil.getCombinedRequests(searchConfig, searchTerm);

    if (!_isNil(request)) {
      const requestBody = (new XMLSerializer()).serializeToString(request);
      setLoading(true);
      const response = await fetch(`${baseUrl}`, {
        method: 'POST',
        credentials: additionalFetchOptions?.credentials ?? 'same-origin',
        body: requestBody,
        ...additionalFetchOptions
      });
      const responseString = await response.text();

      let ff: OlFeature[];
      if (searchConfig?.outputFormat?.includes('json')) {
        const json = JSON.parse(responseString);
        const format = new OlFormatGeoJSON({
          featureProjection: searchConfig?.srsName,
          dataProjection: searchConfig?.srsName,
        });
        ff = format.readFeatures(json);
      } else {
        const format = new OlFormatGml3({
          featureNS: searchConfig?.featureNS,
          srsName: searchConfig?.srsName
        });
        ff = format.readFeatures(responseString);
      }
      setLoading(false);
      setFeatures(ff);
      onFetchSuccess?.(ff);
    } else {
      onFetchError?.('Missing GetFeature request parameters');
      setLoading(false);
    }
  };

  useAsyncEffect(async () => {
    if (!_isNil(searchTerm) && searchTerm.length >= minChars) {
      await performWfsRequest();
    } else {
      setFeatures([]);
      setLoading(false);
    }
  }, [searchTerm]);

  return {
    loading,
    features
  };
};
