import OlOverviewMap from 'ol/control/OverviewMap';
import OlLayerBase from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import OlLayerImage from 'ol/layer/Image';
import OlLayer from 'ol/layer/Layer';
import OlLayerTile from 'ol/layer/Tile';
import { ObjectEvent } from 'ol/Object';
import { getUid } from 'ol/util';
import OlView from 'ol/View';
import { apply as applyMapboxStyle } from 'ol-mapbox-style';
import React, {
  useEffect,
  useRef,
  useState} from 'react';

import useMap from '../../Hooks/useMap/useMap';
import BackgroundLayerPreview, {
  BackgroundLayerLoadingMaskProps
} from '../BackgroundLayerPreview/BackgroundLayerPreview';

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

/**
 * This component supports TileWMS and ImageWMS layers. Besides that, mapbox vector tile layers are
 * also supported in a limited way:
 *
 * * you'll need to render the vector tile layer inside of a group layer
 * * the group layer needs to have a property isVectorTile set to true
 * * the group layer needs to have a property url pointing to the json description
 */
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
      } else if (selectedLayer instanceof LayerGroup) {
        if (selectedLayer.get('isVectorTile')) {
          ovLayer = new LayerGroup();
          applyMapboxStyle(ovLayer, selectedLayer.get('url'));
        } else {
          ovLayer = new LayerGroup({
            layers: selectedLayer.getLayers()
          });
        }
      }
      if (ovLayer && mapTarget.current) {
        const overViewControl = new OlOverviewMap({
          collapsible: false,
          target: mapTarget.current,
          className: 'ol-overviewmap react-util-bg-layer-chooser-overviewmap',
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
