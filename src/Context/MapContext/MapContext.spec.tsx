import { render, screen } from '@testing-library/react';
import OlMap from 'ol/Map';
import React from 'react';

import { useMap } from '../../Hooks/useMap/useMap';
import { TestUtil } from '../../Util/TestUtil';
import MapContext from './MapContext';

describe('MapContext', () => {
  const olMap = TestUtil.createMap();

  const MapThing = ({ map }: {map: OlMap | null}) => {
    if (!map) {
      return <span>No map found</span>;
    }
    return <span>{map.getView().getCenter()}</span>;
  };

  const Thing = () => {
    const map = useMap();
    return <MapThing map={map} />;
  };

  it('is defined', () => {
    expect(useMap).toBeDefined();
  });

  describe('with useMap', () => {
    it('provides the default value', () => {
      render(<Thing />);

      expect(screen.getByText('No map found')).toBeVisible();
    });

    it('provides a map if given', () => {
      render(<Thing />, {
        wrapper: props => (
          <MapContext.Provider
            value={olMap}
          >
            {props.children}
          </MapContext.Provider>
        )
      });

      expect(screen.queryByText('No map found')).toBeNull();
    });
  });

  describe('with Consumer', () => {
    it('provides the default value', () => {
      render(
        <MapContext.Consumer>
          {(map) => <MapThing map={map} />}
        </MapContext.Consumer>
      );

      expect(screen.getByText('No map found')).toBeVisible();
    });

    it('provides a map if given', () => {
      render(
        <MapContext.Consumer>
          {(map) => <MapThing map={map} />}
        </MapContext.Consumer>, {
          wrapper: props => (
            <MapContext.Provider
              value={olMap}
            >
              {props.children}
            </MapContext.Provider>
          )
        }
      );

      expect(screen.queryByText('No map found')).toBeNull();
    });
  });

});
