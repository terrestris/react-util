import FileUtil from '@terrestris/ol-util/dist/FileUtil/FileUtil';
import * as React from 'react';

import useMap from '../useMap/useMap';

/**
 * Adds layers to the map if GeoJSON files or shapefile zip files are
 * dropped on it.
 */
export const useDropTargetMap = () => {
  const map = useMap();

  /**
   * Calls an appropriate addLayer method depending on the fileending.
   * Currently expects shapefiles for '*.zip' and geojson for all other
   * endings.
   * @param event The drop event.
   */
  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!map) {
      return;
    }

    event.preventDefault();
    const files = event.dataTransfer?.files ?? [];

    if (files.length > 0) {
      for (let i = 0; i < files.length; ++i) {
        const file = files[i];
        if (file.name.match(/\.zip$/g)) {
          FileUtil.addShpLayerFromFile(file, map);
        } else {
          FileUtil.addGeojsonLayerFromFile(file, map);
        }
      }
    }
  };

  /**
   * Prevents default in order to prevent browser navigation/opening the file.
   * @param event The dragover event.
   */
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return {
    onDrop,
    onDragOver
  };
};

export default useDropTargetMap;
