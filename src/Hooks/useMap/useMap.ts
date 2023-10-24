import OlMap from 'ol/Map';
import {
  useContext
} from 'react';

import MapContext from '../../Context/MapContext/MapContext';

export const useMap = (): (OlMap | undefined) => {
  return useContext(MapContext);
};

export default useMap;
