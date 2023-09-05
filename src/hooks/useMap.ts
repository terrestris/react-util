import {
  useContext
} from 'react';

import OlMap from 'ol/Map';

import MapContext from '../contexts/MapContext';

export const useMap = (): (OlMap | undefined) => {
  return useContext(MapContext);
};

export default useMap;
