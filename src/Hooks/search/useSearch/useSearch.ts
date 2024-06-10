import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import _isNil from 'lodash/isNil';
import { useEffect, useState } from 'react';

export type SearchFunction<
  G extends Geometry = Geometry,
  T extends GeoJsonProperties = Record<string, any>,
  C extends FeatureCollection<G, T> = FeatureCollection<G, T>
> =
  (searchTerm: string) => Promise<C|undefined>;

export type SearchOptions<
  G extends Geometry = Geometry,
  T extends NonNullable<GeoJsonProperties> = Record<string, any>,
  C extends FeatureCollection<G, T> = FeatureCollection<G, T>
> = {
  minChars?: number;
  debounceTime?: number;
  onFetchError?: (error: any) => void;
  onFetchSuccess?: (featureCollection: C|undefined) => void;
};

export const useSearch = <
  G extends Geometry = Geometry,
  T extends NonNullable<GeoJsonProperties> = Record<string, any>,
  C extends FeatureCollection<G, T> = FeatureCollection<G, T>
>(
    searchFunction: SearchFunction<G, T, C>,
    searchTerm: string | undefined,
    {
      minChars = 3,
      debounceTime = 100,
      onFetchError,
      onFetchSuccess
    }: SearchOptions<G, T, C>
  ) => {
  const [featureCollection, setFeatureCollection] = useState<C>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!_isNil(searchTerm) && searchTerm.length >= minChars) {
      setLoading(true);

      const timeout = setTimeout(async () => {
        try {
          const collection = await searchFunction(searchTerm);
          setFeatureCollection(collection);
          onFetchSuccess?.(collection);
        } catch (error) {
          onFetchError?.(error);
        } finally {
          setLoading(false);
        }
      }, debounceTime);

      return () => {
        clearTimeout(timeout);
      };

    } else {
      setFeatureCollection(undefined);
      setLoading(false);

      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounceTime, minChars, searchFunction, searchTerm]);

  return {
    loading,
    featureCollection
  };
};
