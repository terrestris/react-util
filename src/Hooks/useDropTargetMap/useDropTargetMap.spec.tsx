import FileUtil from '@terrestris/ol-util/dist/FileUtil/FileUtil';
import { Map } from 'ol';

import * as useMap from '../useMap/useMap';
import useDropTargetMap from './useDropTargetMap';

describe('useDropTargetMap', () => {

  beforeEach(() => {
    const map = new Map();
    const useMapSpy = jest.spyOn(useMap, 'default');
    useMapSpy.mockReturnValue(map);
  });

  it('onDrop calls the FileUtil.addShpLayerFromFile when called with a zip', () => {
    const {
      onDrop
    } = useDropTargetMap();

    const file = new File([''], 'peter.zip', {
      type: 'application/zip'
    });

    const mockEvent = {
      dataTransfer: {
        files: [file]
      },
      preventDefault: () => {}
    };
    FileUtil.addShpLayerFromFile = jest.fn();
    const mockFunction = FileUtil.addShpLayerFromFile;

    // @ts-ignore
    onDrop(mockEvent);

    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  it('onDrop calls the FileUtil.addGeojsonLayerFromFile for all other files', () => {
    const {
      onDrop
    } = useDropTargetMap();

    const file = new File([''], 'peter.json', {
      type: 'application/json'
    });

    const mockEvent = {
      dataTransfer: {
        files: [file]
      },
      preventDefault: () => {}
    };
    FileUtil.addGeojsonLayerFromFile = jest.fn();
    const mockFunction = FileUtil.addGeojsonLayerFromFile;

    // @ts-ignore
    onDrop(mockEvent);

    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  it('onDragOver calls preventDefault on the event', () => {
    const {
      onDragOver
    } = useDropTargetMap();

    const mockFunction = jest.fn();
    const mockEvent = {
      preventDefault: mockFunction
    };

    // @ts-ignore
    onDragOver(mockEvent);

    expect(mockFunction).toHaveBeenCalledTimes(1);
  });
});
