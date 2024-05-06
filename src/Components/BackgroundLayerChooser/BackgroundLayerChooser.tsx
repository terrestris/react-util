import './BackgroundLayerChooser.less';

import OlOverviewMap from 'ol/control/OverviewMap';
import OlLayerBase from 'ol/layer/Base';
import OlLayerGroup from 'ol/layer/Group';
import OlLayerImage from 'ol/layer/Image';
import OlLayer from 'ol/layer/Layer';
import OlLayerTile from 'ol/layer/Tile';
import { ObjectEvent } from 'ol/Object';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceOSM from 'ol/source/OSM';
import OlSourceTileWMS from 'ol/source/TileWMS';
import { getUid } from 'ol/util';
import OlView from 'ol/View';
import { apply as applyMapboxStyle } from 'ol-mapbox-style';
import React, {
  useEffect,
  useRef,
  useState
} from 'react';

import useMap from '../../Hooks/useMap/useMap';
import BackgroundLayerPreview, {
  BackgroundLayerLoadingMaskProps
} from '../BackgroundLayerPreview/BackgroundLayerPreview';
import NoBackgroundImage from './no-background.svg';

export type BackgroundLayerButtonProps = {
  layerOptionsVisible: boolean;
  onClick: () => void;
  buttonTooltip?: string;
};

export type BackgroundLayerChooserProps = {
  /**
   * Array of layers to be displayed in the BackgroundLayerChooser.
   */
  layers: OlLayer[];
  /**
   * Adds a button that clears the backgroundlayer.
   */
  allowEmptyBackground?: boolean;
  /**
   * Filters the backgroundlayers by a function.
   */
  backgroundLayerFilter?: (layer: OlLayerBase) => boolean;
  /**
   * Select a Layer that should be active initially.
   */
  initiallySelectedLayer?: OlLayer;
  /**
   * Customize the tooltip.
   */
  buttonTooltip?: string;
  /**
   * Sets the title of the No-Background Button
   */
  noBackgroundTitle?: string;
  LoadingMask: React.FC<BackgroundLayerLoadingMaskProps>;
  Button: React.FC<BackgroundLayerButtonProps>;
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
  allowEmptyBackground = false,
  buttonTooltip = 'Change background layer',
  initiallySelectedLayer,
  noBackgroundTitle = 'No Background',
  backgroundLayerFilter = (l: OlLayerBase) => !!l.get('isBackgroundLayer'),
  Button,
  LoadingMask
}) => {
  const map = useMap();

  const [zoom, setZoom] = useState(map?.getView()?.getZoom());
  const [center, setCenter] = useState(map?.getView()?.getCenter());
  const [layerOptionsVisible, setLayerOptionsVisible] = useState<boolean>(false);
  const [selectedLayer, setSelectedLayer] = useState<OlLayer>();
  const [isBackgroundImage, setIsBackgroundImage] = useState<boolean>(false);

  const mapTarget = useRef(null);

  useEffect(() => {
    if (map && layerOptionsVisible) {
      setCenter(map.getView().getCenter());
      setZoom(map.getView().getZoom());
      const centerListener = (evt: ObjectEvent) => {
        setCenter(evt.target.getCenter());
      };
      const resolutionListener = (evt: ObjectEvent) => {
        setZoom(evt.target.getZoom());
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

    if (!initiallySelectedLayer) {
      setSelectedLayer(activeLayerCand as OlLayer);
    }
  }, [layers]);

  useEffect(() => {
    if (!selectedLayer || !map) {
      return undefined;
    }
    const selectedLayerSource = selectedLayer.getSource();

    let ovLayer: OlLayer | OlLayerGroup;

    if (selectedLayer instanceof OlLayerTile) {
      let newSource: OlSourceOSM | OlSourceTileWMS;

      if (selectedLayerSource instanceof OlSourceTileWMS) {
        newSource = new OlSourceTileWMS({
          url: selectedLayerSource.getUrls()[0],
          params: selectedLayerSource.getParams(),
          tileLoadFunction: selectedLayerSource.getTileLoadFunction()
        });
      } else if (selectedLayerSource instanceof OlSourceOSM) {
        newSource = new OlSourceOSM();
      }

      if (newSource) {
        ovLayer = new OlLayerTile({
          source: newSource
        });
      }
    } else if (selectedLayer instanceof OlLayerImage) {
      let newSource: OlSourceImageWMS;

      if (selectedLayerSource instanceof OlSourceImageWMS) {
        newSource = new OlSourceImageWMS({
          url: selectedLayerSource.getUrl(),
          params: selectedLayerSource.getParams(),
          imageLoadFunction: selectedLayerSource.getImageLoadFunction()
        });
      }

      if (newSource) {
        ovLayer = new OlLayerImage({
          source: selectedLayer.getSource()
        });
      }
    } else if (selectedLayer instanceof OlLayerGroup) {
      if (selectedLayer.get('isVectorTile')) {
        ovLayer = new OlLayerGroup();
        applyMapboxStyle(ovLayer, selectedLayer.get('url'));
      } else {
        ovLayer = new OlLayerGroup({
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

      return () => {
        map.removeControl(overViewControl);
      }
    }

    return undefined;
  }, [selectedLayer, map, mapTarget.current]);

  const onLayerSelect = (layer: OlLayer) => {
    setLayerOptionsVisible(false);
    setSelectedLayer(layer);
  };

  return (
    <div className="bg-layer-chooser">
      {
        selectedLayer && layerOptionsVisible &&
        <div className="layer-cards">
          {
            layers.map(layer => (
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
            ))
          }
          {
            allowEmptyBackground &&
              <div
                className={`no-background${selectedLayer ? '' : ' selected'}`}
                onMouseOver={() => {
                  selectedLayer?.setVisible(false);
                }}
                onMouseLeave={() => {
                  selectedLayer?.setVisible(true);
                }}
                onClick={() => {
                  selectedLayer?.setVisible(false);
                  setSelectedLayer(undefined);
                  setLayerOptionsVisible(false);
                  setIsBackgroundImage(true);
                }}
              >
                <img
                  className='no-background-preview'
                  src={NoBackgroundImage}
                  alt="No background selected"
                />
                <span
                  className="layer-title"
                >
                  {noBackgroundTitle}
                </span>
              </div>
          }
        </div>
      }
      <Button
        layerOptionsVisible={layerOptionsVisible}
        onClick={() => setLayerOptionsVisible(!layerOptionsVisible)}
        buttonTooltip={buttonTooltip}
      />
      <div
        className="bg-preview"
      >
        {
          !isBackgroundImage ?
            <div
              id="overview-map"
              ref={mapTarget}
            /> :
            <img
              className='no-background-preview'
              src={NoBackgroundImage}
              alt="No background selected"
            />
        }
        {
          selectedLayer ?
            <span
              className="layer-title"
            >
              {selectedLayer.get('name')}
            </span> :
            <span
              className="layer-title"
            >
              {noBackgroundTitle}
            </span>
        }
      </div>
    </div>
  );
};

export default BackgroundLayerChooser;
