import {
  isNil
} from 'lodash';
import BaseLayer from 'ol/layer/Base';
import {
  DependencyList,
  useEffect,
  useState
} from 'react';

import useMap from './useMap';

/**
 * This hook adds a layer to the map and removes/updates it if the dependency array changes.
 * It accepts an optional visible parameter that toggles the visible state of the layer. If it is undefined the
 * visible state will not get changed.
 * @param constructor returns a layer to be added to the map, will be called again, if the layer needs
 * to be updated
 * @param dependencies
 * @param visible
 */
export const useOlLayer = <LayerType extends BaseLayer>(
  constructor: () => LayerType|undefined,
  dependencies: DependencyList,
  visible?: undefined|boolean
): LayerType|undefined => {
  const map = useMap();
  const [layer, setLayer] = useState<LayerType>();
  useEffect(() => {
    if (!map) {
      return undefined;
    }

    const newLayer = constructor();

    if (!newLayer) {
      return undefined;
    }

    map.addLayer(newLayer);
    setLayer(newLayer);
    return () => {
      map.removeLayer(newLayer);
      setLayer(undefined);
    };
  }, [map, ...dependencies]);

  useEffect(() => {
    if (!layer || isNil(visible)) {
      return;
    }

    layer.setVisible(visible);
  }, [layer, visible]);

  return layer;
};
