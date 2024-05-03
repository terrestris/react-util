import './BackgroundLayerPreview.less';

import { Coordinate } from 'ol/coordinate';
import OlLayerBase from 'ol/layer/Base';
import OlLayerImage from 'ol/layer/Image';
import OlLayer from 'ol/layer/Layer';
import OlLayerTile from 'ol/layer/Tile';
import OlMap from 'ol/Map';
import { getUid } from 'ol/util';
import OlView from 'ol/View';
import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import useMap from '../../Hooks/useMap/useMap';
import MapComponent from '../MapComponent/MapComponent';

export type BackgroundLayerPreviewProps = {
  width?: number;
  height?: number;
  layer: OlLayer;
  activeLayer?: OlLayer;
  onClick: (l: OlLayer) => void;
  zoom?: number;
  center?: Coordinate;
  backgroundLayerFilter: (l: OlLayerBase) => boolean;
  LoadingMask: React.FC<BackgroundLayerLoadingMaskProps>;
};

export type BackgroundLayerLoadingMaskProps = {
  loading: boolean;
  children: React.ReactNode;
};

export const BackgroundLayerPreview: React.FC<BackgroundLayerPreviewProps> = ({
  layer,
  activeLayer,
  width = 128,
  height = 128,
  onClick,
  zoom,
  center,
  backgroundLayerFilter,
  LoadingMask
}) => {

  const [loading, setLoading] = useState(false);

  const mainMap = useMap();

  const previewLayer = useMemo(() => {
    if (layer instanceof OlLayerTile) {
      return new OlLayerTile({
        source: layer.getSource()
      });
    } else if (layer instanceof OlLayerImage) {
      return new OlLayerImage({
        source: layer.getSource()
      });
    }
    return null;
  }, [layer]);

  const previewMap = useMemo(() => {
    return new OlMap({
      view: new OlView({
        projection: mainMap?.getView().getProjection(),
        resolutions: mainMap?.getView().getResolutions(),
        center: center,
        zoom: zoom
      }),
      controls: [],
      interactions: [],
      layers: previewLayer && [previewLayer]
    });
  }, [mainMap, previewLayer]);

  useEffect(() => {
    const setTrue = () => setLoading(true);
    const setFalse = () => setLoading(false);
    previewMap.on('loadstart', setTrue);
    previewMap.on('loadend', setFalse);

    return () => {
      previewMap.un('loadstart', setTrue);
      previewMap.un('loadend', setFalse);
    };
  }, [previewMap]);

  useEffect(() => {
    if (zoom) {
      previewMap.getView().setZoom(zoom);
    }
    if (center) {
      previewMap.getView().setCenter(center);
    }
  }, [zoom, center]);

  const getBgLayersFromMap = (): OlLayer[] => {
    return mainMap?.getLayerGroup()
      .getLayers()
      .getArray()
      .filter(backgroundLayerFilter) as OlLayer[] || [];
  };

  const updateBgLayerVisibility = (evt: React.MouseEvent<HTMLDivElement>) => {
    const target = evt?.currentTarget;
    const layerId = target?.dataset?.uid;

    if (!layerId) {
      return;
    }

    const newBgLayer = mainMap?.getLayerGroup()
      .getLayers()
      .getArray()
      .find(l => getUid(l) === layerId);

    if (!newBgLayer) {
      return;
    }

    getBgLayersFromMap().forEach(l => l.setVisible(false));
    newBgLayer.setVisible(true);

    if (evt.type === 'click') {
      onClick(newBgLayer as OlLayer);
    }
  };

  const restoreBgLayerVisibility = () => {
    getBgLayersFromMap().forEach(l => l.setVisible(false));
    activeLayer?.setVisible(true);
  };

  let isActive = false;
  const uid = getUid(layer);
  if (activeLayer) {
    const activeUid = getUid(activeLayer);
    isActive = uid === activeUid;
  }

  return (
    <div
      className={`layer-preview${isActive ? ' selected' : ''}`}
      key={uid}
      data-uid={uid}
      onMouseOver={updateBgLayerVisibility}
      onMouseLeave={restoreBgLayerVisibility}
      onClick={updateBgLayerVisibility}
    >
      <LoadingMask
        loading={loading}
      >
        <MapComponent
          mapDivId={`previewmap-${uid}`}
          style={{
            height,
            width
          }}
          map={previewMap}
        />
        <span
          className="layer-title"
        >
          {layer.get('name')}
        </span>
      </LoadingMask>
    </div>
  );
};

export default BackgroundLayerPreview;
