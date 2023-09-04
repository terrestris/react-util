import React, {
  useState,
  useEffect,
  useRef
} from 'react';

import OlOverviewMap from 'ol/control/OverviewMap';
import OlLayerBase from 'ol/layer/Base';
import OlLayer from 'ol/layer/Layer';
import OlView from 'ol/View';
import OlLayerTile from 'ol/layer/Tile';
import OlLayerImage from 'ol/layer/Image';
import { ObjectEvent } from 'ol/Object';
import { getUid } from 'ol/util';

import BackgroundLayerPreview, {
  BackgroundLayerLoadingMaskProps
} from '../BackgroundLayerPreview/BackgroundLayerPreview';

import useMap from '../hooks/useMap';

export type BackgroundLayerButtonProps = {
  layerOptionsVisible: boolean;
  onClick: () => void;
  buttonTooltip?: string;
};

export type BackgroundLayerChooserProps = {
  layers: OlLayer[];
  backgroundLayerFilter?: (layer: OlLayerBase) => boolean;
  Button: React.FC<BackgroundLayerButtonProps>;
  buttonTooltip?: string;
  LoadingMask: React.FC<BackgroundLayerLoadingMaskProps>;
};

export const BackgroundLayerChooser: React.FC<BackgroundLayerChooserProps> = ({
  layers,
  backgroundLayerFilter = (l: OlLayerBase) => !!l.get('isBackgroundLayer'),
  Button,
  buttonTooltip,
  LoadingMask
}) => {
  const map = useMap();
  const mapTarget = useRef(null);
  const [zoom, setZoom] = useState(map?.getView()?.getZoom());
  const [center, setCenter] = useState(map?.getView()?.getCenter());

  const [layerOptionsVisible, setLayerOptionsVisible] = useState<boolean>(false);
  const [selectedLayer, setSelectedLayer] = useState<OlLayer>();

  useEffect(() => {
    if (map) {
      const centerListener = (evt: ObjectEvent) => {
        if (layerOptionsVisible) {
          setCenter(evt.target.getCenter());
        }
      };
      const resolutionListener = (evt: ObjectEvent) => {
        if (layerOptionsVisible) {
          setZoom(evt.target.getZoom());
        }
      };
      map.getView().on('change:center', centerListener);
      map.getView().on('change:resolution', resolutionListener);
      return () => {
        map.getView().un('change:center', centerListener);
        map.getView().un('change:resolution', resolutionListener);
      };
    }
    return undefined;
  }, [map, layerOptionsVisible]);

  useEffect(() => {
    const activeLayerCand = layers.find(l => l.getVisible());
    setSelectedLayer(activeLayerCand as OlLayer);
  }, [layers]);

  useEffect(() => {
    if (selectedLayer && map) {
      const existingControl = map.getControls().getArray()
        .find(c => c instanceof OlOverviewMap);
      if (existingControl) {
        map.removeControl(existingControl);
      }
      let ovLayer;
      if (selectedLayer instanceof OlLayerTile) {
        ovLayer = new OlLayerTile({
          source: selectedLayer.getSource()
        });
      } else if (selectedLayer instanceof OlLayerImage) {
        ovLayer = new OlLayerImage({
          source: selectedLayer.getSource()
        });
      }
      if (ovLayer && mapTarget.current) {
        const overViewControl = new OlOverviewMap({
          collapsible: false,
          target: mapTarget.current,
          className: 'ol-overviewmap react-geo-bg-layer-chooser-overviewmap',
          layers: [ovLayer],
          view: new OlView({
            projection: map.getView().getProjection()
          })
        });
        map.addControl(overViewControl);
      }
    }
  }, [selectedLayer]);

  const onLayerSelect = (layer: OlLayer) => {
    setLayerOptionsVisible(false);
    setSelectedLayer(layer);
  };

  return (
    <div className={'bg-layer-chooser'}>
      {
        selectedLayer &&
        <div
          className="layer-cards"
          style={{
            maxWidth: layerOptionsVisible ? '100vw' : 0,
            opacity: layerOptionsVisible ? 1 : 0
          }}
        >
          {
            layers.map(layer => {
              return (
                <BackgroundLayerPreview
                  key={getUid(layer)}
                  activeLayer={selectedLayer}
                  onClick={l => onLayerSelect(l)}
                  layer={layer}
                  backgroundLayerFilter={backgroundLayerFilter}
                  zoom={zoom}
                  center={center}
                  LoadingMask={LoadingMask}
                />
              );
            })
          }
        </div>
      }
      <Button
        layerOptionsVisible={layerOptionsVisible}
        onClick={() => setLayerOptionsVisible(!layerOptionsVisible)}
        buttonTooltip={buttonTooltip}
      />
      <div className="bg-preview">
        <div className='overview-wrapper'>
          <div id="overview-map" ref={mapTarget} />
          <span className="layer-title">{selectedLayer?.get('name')}</span>
        </div>
      </div>
    </div>
  );
};

export default BackgroundLayerChooser;
