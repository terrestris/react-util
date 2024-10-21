import OlLayer from 'ol/layer/Layer';
import OlImageWMS from 'ol/source/ImageWMS';
import OlTileWMS from 'ol/source/TileWMS';

export interface TimeLayerAwareConfig {
  isWmsTime?: boolean;
  layer: OlLayer<OlImageWMS | OlTileWMS, any>;
  customHandler?: (values: any) => void;
}

/**
 * HOC that updates layers based on the wrapped components time instant or
 * interval. Can for example be used with the TimeSlider component.
 * @param WrappedComponent A component with an onChange prop.
 * @param layers An array of layer configurations.
 * @return A time layer aware component.
 */
export const useTimeLayerAware = (layers: TimeLayerAwareConfig[]) => {
  /**
   * Finds the key time in the passed object regardless of upper- or lowercase
   * characters. Will return `TIME` (all uppercase) as a fallback.
   *
   * @param params The object to find the key in, basically the params of
   *   a WMS source that will end up as URL parameters.
   * @return The key for the time parameter, in the actual spelling.
   */
  const findTimeParam = (params: any) => {
    const keys = Object.keys(params);
    let foundKey = 'TIME'; // fallback
    keys.some(key => {
      const lcKey = key && key.toLowerCase && key.toLowerCase();
      if (lcKey === 'time') {
        foundKey = key;
        return true;
      }
      return false;
    });
    return foundKey;
  };

  const timeChanged = (newValues: any) => {
    layers.forEach(config => {
      if (config.isWmsTime) {
        const parms = config.layer.getSource()?.getParams();
        const timeParam = findTimeParam(parms);
        if (Array.isArray(newValues)) {
          parms[timeParam] = `${newValues[0]}/${newValues[1]}`;
        } else {
          parms[timeParam] = `${newValues}`;
        }
        config.layer.getSource()?.updateParams(parms);
      }
      if (config.customHandler) {
        config.customHandler(newValues);
      }
    });
  };

  return timeChanged;
};

export default useTimeLayerAware;
