import React, {ReactElement} from 'react';

import {
  act, fireEvent, render
} from '@testing-library/react';
import OlFeature from 'ol/Feature';
import OlGeometry from 'ol/geom/Geometry';
import OlVectorLayer from 'ol/layer/Vector';
import OlMap from 'ol/Map';
import OlSourceVector from 'ol/source/Vector';

import MapContext from '../Context/MapContext/MapContext';

export async function actSetTimeout(time: number): Promise<void> {
  return act(async () => {
    return new Promise(resolve => setTimeout(resolve, time));
  });
}

function fireClickEvents(map: OlMap, x: number, y: number) {
  const pointerId = Math.random().toFixed(10).slice(2);

  const evt1 = new MouseEvent('pointerdown', {
    clientX: x,
    clientY: y,
    button: 0
  });

  // @ts-expect-error append pointer id for test
  evt1.pointerId = pointerId;

  fireEvent(map.getViewport(), evt1);

  const evt2 = new MouseEvent('pointerup', {
    clientX: x,
    clientY: y,
    button: 0
  });

  // @ts-expect-error append pointer id for test
  evt2.pointerId = pointerId;

  fireEvent(document, evt2);
}

/**
 * Be aware that this will only work if the map was initialized with `setSize` and `renderSync` after adding it to
 * the dom.
 * @param map
 * @param x
 * @param y
 */
export function clickMap(map: OlMap, x: number, y: number) {
  jest.useFakeTimers();
  fireClickEvents(map, x, y);
  jest.runAllTimers();
  jest.useRealTimers();
}

/**
 * Be aware that this will only work if the map was initialized with `setSize` and `renderSync` after adding it to
 * the dom.
 * @param map
 * @param x
 * @param y
 */
export function doubleClickMap(map: OlMap, x: number, y: number) {
  fireClickEvents(map, x, y);
  fireClickEvents(map, x, y);
}

/**
 * This function renders the given element inside a map context and initializes the map with size `[400, 400]`, ready
 * to be used by the event functions in this file.
 */
export function renderInMapContext(map: OlMap, element: ReactElement, size: [number, number] = [400, 400]): any {
  const assemble = (newElement: ReactElement) => {
    const refCallback = (ref: HTMLDivElement) => {
      if (!map) {
        return;
      }
      if (ref === null) {
        map.setTarget(undefined);
      } else {
        map.setTarget(ref);
      }
    };

    return (
      <MapContext.Provider value={map}>
        <div
          id="map"
          className="map"
          ref={refCallback}
        />
        {newElement}
      </MapContext.Provider>
    );
  };

  const {
    rerender, ...results
  } = render(assemble(element));

  map.setSize(size);
  map.renderSync();

  const rerenderInMapContext = (newElement: ReactElement) => {
    rerender(assemble(newElement));
  };

  return {
    rerenderInMapContext,
    ...results
  };
}

export function mockForEachFeatureAtPixel(
  map: OlMap,
  pixel: [number, number],
  feature: OlFeature<OlGeometry>,
  layer?: OlVectorLayer<OlSourceVector>
): jest.SpyInstance {
  return jest.spyOn(map, 'forEachFeatureAtPixel').mockImplementation((atPixel, callback) => {
    if (pixel[0] === atPixel[0] && pixel[1] === atPixel[1]) {
      callback(feature, layer as any, null as any);
    }
  });
}
