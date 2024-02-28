import Logger from '@terrestris/base-util/dist/Logger';
import UrlUtil from '@terrestris/base-util/dist/UrlUtil/UrlUtil';
import { GeoJSON } from 'geojson';
import _isNil from 'lodash/isNil';
import { Extent as OlExtent } from 'ol/extent';
import { transformExtent } from 'ol/proj';
import React, { ChangeEvent, PropsWithChildren, ReactNode, useCallback, useEffect, useState } from 'react';

import { useMap } from '../../index';
import GenericSelectComponent, {
  GenericSelectComponentProps,
  GenericSelectProps
} from '../GenericSelectComponent/GenericSelectComponent';

// See https://nominatim.org/release-docs/develop/api/Output/ for some more information
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

interface OwnProps {
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
   * The minimal amount of characters entered to start a search.
   */
  minChars?: number;
  /**
   * Indicate if we should render the input and results. When setting to false,
   * you need to handle user input and result yourself
   */
  visible?: boolean;
  /**
   * The searchTerm may be given as prop. This is useful when setting
   * `visible` to `false`.
   */
  searchTerm?: string;
  /**
   * A callback function which gets called with the successfully fetched data.
   */
  onFetchSuccess?: (data: NominatimPlace[]) => void;
  /**
   * A callback function which gets called if data fetching has failed.
   */
  onFetchError?: (error: any) => void;
  /**
   * An optional CSS class which should be added.
   */
  className?: string;
  /**
   * A function that gets called when the clear Button is pressed or the input
   * value is empty.
   */
  onClear?: () => void;
  /**
   * Time in miliseconds that the search waits before doing a request.
   */
  debounceTime?: number;
  /**
   * Render function options
   */
  renderOption?: (nominatimPlace: NominatimPlace) => ReactNode;
  onSelect?: (event: ChangeEvent<HTMLSelectElement>, selectedValue: NominatimPlace) => void;
}

export type NominatimSearchProps<V, SelectProps> =
  OwnProps & GenericSelectComponentProps<V, GenericSelectProps<V, SelectProps>>;

/**
 * The NominatimSearch.
 */
export function NominatimSearch<SelectProps>({
  As,
  addressDetails = 1,
  bounded = 1,
  className = 'nominatim-search',
  countryCodes = 'de',
  debounceTime = 300,
  format = 'json',
  limit = 10,
  minChars = 3,
  nominatimBaseUrl = 'https://nominatim.openstreetmap.org/search?',
  onClear,
  onSelect,
  onFetchError,
  onFetchSuccess,
  polygonGeoJSON = 1,
  renderOption = (i: NominatimPlace) => <span>{i?.display_name}</span>,
  searchResultLanguage,
  viewBox = '-180,90,180,-90',
  visible = true,
  ...passThroughProps
}: PropsWithChildren<NominatimSearchProps<NominatimPlace, SelectProps>>){

  const map = useMap();

  const [searchTerm, setSearchTerm] = useState<string>();
  const [dataSource, setDataSource] = useState<NominatimPlace[]>([]);
  const [selectedItem, setSelectedItem] = useState<NominatimPlace>(undefined);

  const finalOnSelect = useCallback((selected: NominatimPlace) => {
    if (!_isNil(onSelect)) {
      onSelect(undefined, selected);
    } else if (selected && selected.boundingbox) {
      const olView = map.getView();
      const bbox: number[] = selected.boundingbox.map(parseFloat);
      let extent = [
        bbox[2],
        bbox[0],
        bbox[3],
        bbox[1]
      ] as OlExtent;

      extent = transformExtent(extent, 'EPSG:4326',
        olView.getProjection().getCode());

      olView.fit(extent, {
        duration: 500
      });
    }
  }, [onSelect]);

  const fetchResults = useCallback(async (baseParams: any) => {
    const getRequestParams = UrlUtil.objectToRequestString(baseParams);

    const onError = (error: any) => {
      Logger.error(`Error while requesting Nominatim: ${error}`);
      onFetchError?.(error);
    };

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

      setDataSource(responseJson);
      onFetchSuccess?.(responseJson);
    } catch (error) {
      onError(error);
    }
  }, [nominatimBaseUrl, onFetchError, onFetchSuccess, searchResultLanguage]);

  /**
   * Trigger search when searchTerm has changed
   */
  useEffect(() => {
    setDataSource([]);

    if (!searchTerm && onClear) {
      onClear();
    }

    if (!_isNil(searchTerm) && searchTerm?.length >= minChars) {
      const timeout = setTimeout(() => {
        fetchResults({
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
    }
    return () => undefined;
  }, [searchTerm, minChars, debounceTime, addressDetails, bounded, countryCodes,
    fetchResults, format, limit, onClear, polygonGeoJSON, viewBox]);

  /**
   * The function describes what to do when an item is selected.
   *
   * @param _
   * @param option The selected OptionData
   */
  const onMenuItemSelected = (_: any, option: NominatimPlace) => {
    if (!map) {
      return;
    }
    const selected = dataSource.find(
      i => i.place_id === option.place_id
    );
    if (selected) {
      finalOnSelect(selected);
      setSelectedItem(selected);
    }
  };

  const onChange = (st: any) => {
    setSearchTerm(st);
    setSelectedItem(undefined);
  };

  if (!visible) {
    return null;
  }

  return (
    <GenericSelectComponent<NominatimPlace, GenericSelectProps<NominatimPlace, any>>
      As={As}
      selectProps={{
        onChange,
        onSelect: onMenuItemSelected,
        value: _isNil(selectedItem) ? {'display_name': searchTerm} as NominatimPlace : selectedItem
      }}
      {...passThroughProps}
    >
      {dataSource.map(renderOption)}
    </GenericSelectComponent>
  );
}

export default NominatimSearch;
