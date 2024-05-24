import moment from 'moment';
import OlTileLayer from 'ol/layer/Tile';
import OlTileWMS from 'ol/source/TileWMS';

import useTimeLayerAware from './useTimeLayerAware';

describe('useTimeLayerAware', () => {
  let layer: OlTileLayer<OlTileWMS>;
  let layerWithFunnyTimeSpelling: OlTileLayer<OlTileWMS>;
  const customHandler = jest.fn();

  beforeEach(() => {
    layer = new OlTileLayer({
      source: new OlTileWMS({
        params: {
          LAYERS: 'humpty:dumpty',
          TIME: 'overwrite me!'
        }
      })
    });
    layerWithFunnyTimeSpelling = new OlTileLayer({
      source: new OlTileWMS({
        params: {
          LAYERS: 'humpty:dumpty',
          tImE: 'overwrite me!'
        }
      })
    });
  });

  describe('Basics', () => {

    it('calls configured custom handlers', () => {
      const time = moment().toISOString();

      const timeLayerAware = useTimeLayerAware([{
        isWmsTime: false,
        customHandler: customHandler,
        layer
      }]);

      timeLayerAware(time);

      expect(customHandler).toHaveBeenCalledWith(time);
    });

    it('changes WMS Time layer parameter TIME, single instant', () => {
      const time = moment().toISOString();

      const timeLayerAware = useTimeLayerAware([{
        isWmsTime: true,
        layer: layer
      }, {
        isWmsTime: true,
        layer: layerWithFunnyTimeSpelling
      }]);

      timeLayerAware(time);

      expect(layer.getSource()?.getParams().TIME).toBe(time);
    });

    it('changes WMS Time layer parameter TIME, start and end instants', () => {
      const start = moment().toISOString();
      const end = moment().toISOString();

      const timeLayerAware = useTimeLayerAware([{
        isWmsTime: true,
        layer: layer
      }, {
        isWmsTime: true,
        layer: layerWithFunnyTimeSpelling
      }]);

      timeLayerAware([start, end]);

      expect(layer.getSource()?.getParams().TIME).toBe(`${start}/${end}`);
    });

    it('updates the correct parameter, even when spelled funnily', () => {
      const time = moment().toISOString();

      const timeLayerAware = useTimeLayerAware([{
        isWmsTime: true,
        layer: layer
      }, {
        isWmsTime: true,
        layer: layerWithFunnyTimeSpelling
      }]);

      timeLayerAware(time);

      const params = layerWithFunnyTimeSpelling.getSource()?.getParams();

      expect(params.tImE).toBe(time); // right one overwriten
      expect('TIME' in params).toBe(false); // only right one overwritten
    });
  });
});
