import MathUtil from '@terrestris/base-util/dist/MathUtil/MathUtil';
import _isNil from 'lodash/isNil';
import BaseEvent from 'ol/events/Event';
import OlFeature from 'ol/Feature';
import OlGeolocation from 'ol/Geolocation';
import OlGeometry from 'ol/geom/Geometry';
import OlGeomLineString from 'ol/geom/LineString';
import OlGeomPoint from 'ol/geom/Point';
import OlLayerVector from 'ol/layer/Vector';
import RenderFeature from 'ol/render/Feature';
import OlSourceVector from 'ol/source/Vector';
import OlStyleIcon from 'ol/style/Icon';
import OlStyleStyle from 'ol/style/Style';
import {useEffect, useMemo, useState} from 'react';

import useMap from '../useMap/useMap';
import {useOlLayer} from '../useOlLayer/useOlLayer';
import mapMarker from './geolocation-marker.png';
import mapMarkerHeading from './geolocation-marker-heading.png';

export type UseGeoLocationArgs = {
  active: boolean;
  enableTracking?: boolean;
  follow?: boolean;
  onError?: () => void;
  onGeoLocationChange?: (actualGeoLocation: GeoLocation) => void;
  showMarker?: boolean;
  trackingOptions?: PositionOptions;
};

export type GeoLocation = {
  accuracy: number;
  heading: number;
  position: number[];
  speed: number;
};

export type GeoLocationType = {
  actualPosition: GeoLocation;
  trackedLine: OlGeomLineString;
};

/**
 * This hook allows to debounce a setState.
 */
export const useGeoLocation = ({
  active,
  enableTracking = false,
  follow = false,
  onError = () => {},
  onGeoLocationChange = () => {},
  showMarker = false,
  trackingOptions = {
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 600000
  }
}: UseGeoLocationArgs): GeoLocationType | undefined => {

  const map = useMap();

  const [actualPosition, setActualPosition] = useState<GeoLocation>();

  const trackedLine = useMemo(() => new OlGeomLineString([], 'XYZM'), []);
  const markerFeature = useMemo(() => new OlFeature<OlGeomPoint>(), []);

  useOlLayer(() => new OlLayerVector({
    properties: {
      name: 'react-geo_geolocationlayer',
    },
    source: new OlSourceVector<OlFeature<OlGeomPoint>>({
      features: [markerFeature]
    }),
    style: (feature: OlFeature<OlGeometry> | RenderFeature) => {
      const heading = feature.get('heading');
      const src = (Number.isFinite(heading) && heading !== 0) ? mapMarkerHeading : mapMarker;
      const rotation = (Number.isFinite(heading) && heading !== 0) ? heading * Math.PI / 180 : 0;

      return [new OlStyleStyle({
        image: new OlStyleIcon({
          rotation,
          src
        })
      })];
    }
  }), [], showMarker && active);

  /**
   * Callback of the interactions on change event.
   */
  const onLocationChanged = (geoLocationEvent: BaseEvent) => {
    const ac = geoLocationEvent.target as OlGeolocation;

    const position = ac.getPosition() ?? [0, 0];
    const accuracy = ac.getAccuracy();
    let heading = ac.getHeading() || 0;
    const speed = ac.getSpeed() || 0;

    const x = position[0];
    const y = position[1];
    const fCoords = trackedLine.getCoordinates();
    const previous = fCoords[fCoords.length - 1];
    const prevHeading = previous && previous[2];
    if (prevHeading) {
      let headingDiff = heading - MathUtil.mod(prevHeading);

      // force the rotation change to be less than 180°
      if (Math.abs(headingDiff) > Math.PI) {
        const sign = (headingDiff >= 0) ? 1 : -1;
        headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
      }
      heading = prevHeading + headingDiff;
    }
    trackedLine.appendCoordinate([x, y, heading, Date.now()]);

    // only keep the 20 last coordinates
    trackedLine.setCoordinates(trackedLine.getCoordinates().slice(-20));

    const actualGeoLocation: GeoLocation = {
      position,
      accuracy,
      heading,
      speed
    };
    setActualPosition(actualGeoLocation);
    onGeoLocationChange(actualGeoLocation);
  };

  // Geolocation Control
  const olGeoLocation = useMemo(() => active ? new OlGeolocation({
    projection: map?.getView().getProjection()
  }) : undefined, [active, map]);

  // re-centers the view by putting the given coordinates at 3/4 from the top or
  // the screen
  const getCenterWithHeading = (position: [number, number], rotation: number, resolution: number) => {
    const size = map?.getSize() ?? [0, 0];
    const height = size[1];

    return [
      position[0] - Math.sin(rotation) * height * resolution / 4,
      position[1] + Math.cos(rotation) * height * resolution / 4
    ];
  };

  useEffect(() => {
    olGeoLocation?.on('change', onLocationChanged);
    olGeoLocation?.on('error', onError);

    return () => {
      olGeoLocation?.un('change', onLocationChanged);
      olGeoLocation?.un('error', onError);
    };
  }, [olGeoLocation, onError]);

  useEffect(() => {
    olGeoLocation?.setTracking(enableTracking);
  }, [enableTracking]);

  useEffect(() => {
    olGeoLocation?.setTrackingOptions(trackingOptions);
  }, [trackingOptions]);

  useEffect(() => {
    const deltaMean = 500; // the geolocation sampling period mean in ms
    // use sampling period to get a smooth transition
    let m = Date.now() - deltaMean * 1.5;
    m = Math.max(m, 0);

    // interpolate position along positions LineString
    const c = trackedLine.getCoordinateAtM(m, true);
    if (!_isNil(c)) {
      if (follow) {
        map?.getView().setCenter(getCenterWithHeading([c[0], c[1]], -c[2], map?.getView().getResolution() ?? 0));
        map?.getView().setRotation(-c[2]);
      }
      if (showMarker) {
        const pointGeometry = new OlGeomPoint([c[0], c[1]]);
        markerFeature.setGeometry(pointGeometry);
      }
    }
  }, [actualPosition, showMarker, follow, map]);

  return {
    actualPosition,
    trackedLine
  };
};

export default useGeoLocation;
