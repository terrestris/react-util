import {
  useCallback, useEffect, useRef, useState
} from 'react';

import OlCollection from 'ol/Collection';

import { Coordinate as OlCoordinate } from 'ol/coordinate';
import OlFeature from 'ol/Feature';
import OlGeomCircle from 'ol/geom/Circle';
import OlGeometry, { Type } from 'ol/geom/Geometry';
import OlGeomLineString from 'ol/geom/LineString';
import OlGeomMultiLineString from 'ol/geom/MultiLineString';
import OlGeomMultiPolygon from 'ol/geom/MultiPolygon';
import OlGeomPolygon from 'ol/geom/Polygon';
import OlInteractionDraw, { DrawEvent as OlDrawEvent } from 'ol/interaction/Draw';
import OlLayerVector from 'ol/layer/Vector';
import OlMapBrowserEvent from 'ol/MapBrowserEvent';
import OlOverlay from 'ol/Overlay';
import OlSourceVector from 'ol/source/Vector';
import OlStyleCircle from 'ol/style/Circle';
import OlStyleFill from 'ol/style/Fill';
import OlStyleStroke from 'ol/style/Stroke';
import OlStyleStyle from 'ol/style/Style';

import MeasureUtil from '@terrestris/ol-util/dist/MeasureUtil/MeasureUtil';

import { CSS_PREFIX } from '../../constants';
import useMap from '../useMap/useMap';
import { useOlInteraction } from '../useOlInteraction/useOlInteraction';
import useOlLayer from '../useOlLayer/useOlLayer';
import useOlListener from '../useOlListener/useOlListener';

export type UseMeasureType = 'line' | 'polygon' | 'angle' | 'circle';

export interface UseMeasureProps {
  /**
   * Active state of the interaction.
   */
  active: boolean;
  /**
   * Name of system vector layer which will be used to draw measurement
   * results.
   */
  measureLayerName?: string;
  /**
   * Fill color of the measurement feature.
   */
  fillColor?: string;
  /**
   * Stroke color of the measurement feature.
   */
  strokeColor?: string;
  /**
   * Determines if a marker with current measurement should be shown every
   * time the user clicks while measuring a distance. Default is false.
   */
  showMeasureInfoOnClickedPoints?: boolean;
  /**
   * Determines if a marker with a line length should be added to each drawn
   * segment of a line or polygon while measuring a distance. Default is false.
   */
  showSegmentLengths?: boolean;
  /**
   * Determines if a tooltip with helpful information is shown next to the mouse
   * position. Default is true.
   */
  showHelpTooltip?: boolean;
  /**
   * How many decimal places will be allowed for the measure tooltips.
   * Default is 2.
   */
  decimalPlacesInTooltips?: number;
  /**
   * Used to allow / disallow multiple drawings at a time on the map.
   * Default is false.
   * TODO known issue: only label of the last drawn feature will be shown!
   */
  multipleDrawing?: boolean;
  /**
   * Tooltip which will be shown on map mouserover after measurement button
   * was activated.
   */
  clickToDrawText?: string;
  /**
   * Tooltip which will be shown after polygon measurement button was toggled
   * and at least one click in the map is occured.
   */
  continuePolygonMsg?: string;
  /**
   * Tooltip which will be shown after line measurement button was toggled
   * and at least one click in the map is occured.
   */
  continueLineMsg?: string;
  /**
   * Tooltip which will be shown after angle measurement button was toggled
   * and at least one click in the map is occured.
   */
  continueAngleMsg?: string;
  /**
   * CSS classes we'll assign to the popups and tooltips from measuring.
   * Overwrite this object to style the text of the popups / overlays, if you
   * don't want to use default classes.
   */
  measureTooltipCssClasses?: {
    tooltip: string;
    tooltipDynamic: string;
    tooltipStatic: string;
  };
  /**
   * Whether line, area, circle or angle will be measured.
   */
  measureType: UseMeasureType;
  /**
   * Whether the measure is using geodesic or cartesian mode. Geodesic is used by default.
   */
  geodesic?: boolean;
  /**
   * If set true, instead of the area, the radius will be measured.
   */
  measureRadius?: boolean;
}

function simplifyFeatureGeom(feature: OlFeature<OlGeometry>) {
  let geom = feature.getGeometry();

  if (geom instanceof OlGeomMultiPolygon) {
    geom = geom.getPolygons()[0] as OlGeomPolygon;
  }

  if (geom instanceof OlGeomMultiLineString) {
    geom = geom.getLineStrings()[0];
  }
  return geom;
}

export const useMeasure = ({
  measureType,
  measureLayerName = 'react-util-measure',
  fillColor = 'rgba(255, 0, 0, 0.5)',
  strokeColor = 'rgba(255, 0, 0, 0.8)',
  showMeasureInfoOnClickedPoints = false,
  showSegmentLengths = false,
  showHelpTooltip = true,
  decimalPlacesInTooltips = 2,
  multipleDrawing = false,
  continuePolygonMsg = 'Click to draw area',
  continueLineMsg = 'Click to draw line',
  continueAngleMsg = 'Click to draw angle',
  clickToDrawText = 'Click to measure',
  measureTooltipCssClasses = {
    tooltip: `${CSS_PREFIX}measure-tooltip`,
    tooltipDynamic: `${CSS_PREFIX}measure-tooltip-dynamic`,
    tooltipStatic: `${CSS_PREFIX}measure-tooltip-static`
  },
  active = false,
  geodesic = true,
  measureRadius = false
}: UseMeasureProps) => {

  const [feature, setFeature] = useState<OlFeature<OlGeometry>>();

  const measureTooltip = useRef<OlOverlay>();
  const helpTooltip = useRef<OlOverlay>();
  const stepMeasureTooltips = useRef<OlOverlay[]>([]);
  const segmentMeasureTooltips = useRef<OlOverlay[]>([]);
  const segmentDrawingMeasureTooltip = useRef<OlOverlay>();

  const map = useMap();

  const measureLayer = useOlLayer(() => new OlLayerVector({
    properties: {
      name: measureLayerName
    },
    source: new OlSourceVector({
      features: new OlCollection<OlFeature<OlGeometry>>()
    }),
    style: new OlStyleStyle({
      fill: new OlStyleFill({
        color: fillColor
      }),
      stroke: new OlStyleStroke({
        color: strokeColor,
        width: 2
      }),
      image: new OlStyleCircle({
        radius: 7,
        fill: new OlStyleFill({
          color: fillColor
        })
      })
    })
  }), [
    measureLayerName,
    fillColor,
    strokeColor,
    fillColor
  ], active);

  const drawInteraction = useOlInteraction(() => {
    const getDrawType = (input: UseMeasureType): Type => {
      switch (input) {
        case 'line':
        case 'angle':
          return 'MultiLineString';
        case 'polygon':
          return 'MultiPolygon';
        case 'circle':
          return 'Circle';
        default:
          return 'MultiLineString';
      }
    };

    return (
      new OlInteractionDraw({
        source: measureLayer?.getSource() || undefined,
        type: getDrawType(measureType),
        maxPoints: measureType === 'angle' ? 2 : undefined,
        style: new OlStyleStyle({
          fill: new OlStyleFill({
            color: fillColor
          }),
          stroke: new OlStyleStroke({
            color: strokeColor,
            lineDash: [10, 10],
            width: 2
          }),
          image: new OlStyleCircle({
            radius: 5,
            stroke: new OlStyleStroke({
              color: strokeColor
            }),
            fill: new OlStyleFill({
              color: fillColor
            })
          })
        }),
        freehandCondition: () => false
      })
    );
  }, [measureType, measureLayer, fillColor, strokeColor, fillColor], active);

  const removeMeasureTooltip = useCallback(() => {
    if (map && measureTooltip.current) {
      map.removeOverlay(measureTooltip.current);
      measureTooltip.current = undefined;
    }
  }, [map]);

  const removeStepMeasureTooltips = useCallback(() => {
    if (map && stepMeasureTooltips.current.length > 0) {
      for (const overlay of stepMeasureTooltips.current) {
        map.removeOverlay(overlay);
      }

      stepMeasureTooltips.current = [];
    }
  }, [map]);

  const removeLastStepMeasureTooltip = useCallback(() => {
    if (map && stepMeasureTooltips.current.length > 0) {
      const tooltip = stepMeasureTooltips.current.pop()!;
      map.removeOverlay(tooltip);
    }
  }, [map]);

  const removeSegmentMeasureTooltips = useCallback(() => {
    if (map && segmentMeasureTooltips.current.length > 0) {
      for (const overlay of segmentMeasureTooltips.current) {
        map.removeOverlay(overlay);
      }

      segmentMeasureTooltips.current = [];
    }
  }, [map]);

  const removeSegmentDrawingMeasureTooltip = useCallback(() => {
    if (map && segmentDrawingMeasureTooltip.current !== undefined) {
      map.removeOverlay(segmentDrawingMeasureTooltip.current);

      segmentDrawingMeasureTooltip.current = undefined;
    }
  }, [map]);

  const removeHelpTooltip = useCallback(() => {
    if (map && helpTooltip.current) {
      map.removeOverlay(helpTooltip.current);
      helpTooltip.current = undefined;
    }
  }, [map]);

  const cleanup = useCallback(() => {
    removeMeasureTooltip();
    removeStepMeasureTooltips();
    removeSegmentMeasureTooltips();
    removeSegmentDrawingMeasureTooltip();
    removeHelpTooltip();
    measureLayer?.getSource()?.clear();
  }, [measureLayer, removeMeasureTooltip, removeStepMeasureTooltips, removeSegmentMeasureTooltips,
    removeHelpTooltip, removeSegmentDrawingMeasureTooltip
  ]);

  useEffect(() => {
    if (active) {
      return () => {
        cleanup();
      };
    }
    return undefined;
  }, [active, cleanup]);

  const createHelpTooltip = useCallback(() => {
    if (!map || helpTooltip.current) {
      return;
    }

    helpTooltip.current = new OlOverlay({
      element: document.createElement('div'),
      offset: [15, 0],
      positioning: 'center-left',
      className: measureTooltipCssClasses?.tooltip ?? ''
    });

    map.addOverlay(helpTooltip.current);
  }, [map, measureTooltipCssClasses?.tooltip]);

  const createTooltip = useCallback(() => {
    return new OlOverlay({
      element: document.createElement('div'),
      offset: [0, -15],
      positioning: 'bottom-center',
      className: measureTooltipCssClasses
        ? `${measureTooltipCssClasses.tooltip} ${measureTooltipCssClasses.tooltipDynamic}`
        : ''
    });
  }, [measureTooltipCssClasses]);

  const updateMeasureTooltip = useCallback(() => {
    if (!feature || !map) {
      return;
    }

    let value;
    const geom = simplifyFeatureGeom(feature);

    let measureTooltipCoord: OlCoordinate | undefined = undefined;

    if (geom instanceof OlGeomCircle) {
      if (!measureRadius) {
        value = MeasureUtil.formatArea(geom, map, decimalPlacesInTooltips, geodesic);
      } else {
        const area = MeasureUtil.getAreaOfCircle(geom, map);
        const decimalHelper = Math.pow(10, decimalPlacesInTooltips);
        const radius = Math.round(geom.getRadius() * decimalHelper) / decimalHelper;
        value = `${radius.toString()} m`;
        if (area > (Math.PI * 1000000)) {
          value = (Math.round(geom.getRadius() / 1000 * decimalHelper) /
          decimalHelper) + ' km';
        }
      }
      measureTooltipCoord = geom.getCenter();
    } else if (geom instanceof OlGeomPolygon) {
      if (geom.getCoordinates()[0].length > 3) {
        value = MeasureUtil.formatArea(geom, map, decimalPlacesInTooltips, geodesic);
        // attach area at interior point
        measureTooltipCoord = geom.getInteriorPoint().getCoordinates();
      }
    } else if (geom instanceof OlGeomLineString) {
      measureTooltipCoord = geom.getLastCoordinate();
      if (measureType === 'line') {
        value = MeasureUtil.formatLength(geom, map, decimalPlacesInTooltips, geodesic);
      } else if (measureType === 'angle') {
        value = MeasureUtil.formatAngle(geom, 0);
      }
    }

    if (value === undefined || parseInt(value, 10) === 0) {
      removeMeasureTooltip();
      return;
    }

    if (measureTooltip.current === undefined) {
      measureTooltip.current = createTooltip();
      map.addOverlay(measureTooltip.current);
    }

    const tooltip = measureTooltip.current;

    const el = tooltip.getElement();
    if (value && el) {
      el.innerHTML = value;
    }

    tooltip.setPosition(measureTooltipCoord);
  }, [decimalPlacesInTooltips, feature, geodesic, map, measureType, measureRadius, createTooltip, removeMeasureTooltip]);

  const onDrawStart = useCallback((evt: OlDrawEvent) => {
    if (!map) {
      return;
    }

    if (!multipleDrawing) {
      cleanup();
    }

    setFeature(evt.feature);
  }, [cleanup, map, multipleDrawing]);

  const addMeasureStopTooltip = useCallback((coordinate: OlCoordinate) => {
    if (!feature || !map) {
      return;
    }

    const geom = simplifyFeatureGeom(feature);

    const value = measureType === 'line' ?
      MeasureUtil.formatLength(geom as OlGeomLineString, map, decimalPlacesInTooltips, geodesic) :
      MeasureUtil.formatArea(geom as OlGeomPolygon, map, decimalPlacesInTooltips, geodesic);

    if (parseInt(value, 10) > 0) {
      const tooltip= createTooltip();
      const div = tooltip.getElement()!;
      div.innerHTML = value;
      map.addOverlay(tooltip);

      tooltip.setPosition(coordinate);

      stepMeasureTooltips.current.push(tooltip);
    }
  }, [decimalPlacesInTooltips, feature, geodesic, map, createTooltip, measureType]);

  const addSegmentTooltip = useCallback((showLastSegment = false) => {
    if (!feature || !map) {
      return;
    }

    const geom = simplifyFeatureGeom(feature);

    let coordinates: OlCoordinate[] = [];

    if (showLastSegment) {
      if (!(geom instanceof OlGeomPolygon)) {
        return;
      }
      coordinates = geom.getCoordinates()[0].slice(-2);
    } else {
      if (geom instanceof OlGeomPolygon) {
        // the last coordinate is the starting coordinate for a polygon
        coordinates = geom.getCoordinates()[0].slice(0, -1);
      }

      if (geom instanceof OlGeomLineString) {
        coordinates = geom.getCoordinates();
      }

      if (coordinates.length < 3) {
        return;
      }

      // the last coordinate is one where the pointer is, so we take the ones before
      coordinates = coordinates.slice(-3, -1);
    }

    const segment = new OlGeomLineString(coordinates);

    const value = MeasureUtil.formatLength(segment, map, decimalPlacesInTooltips, geodesic);

    if (parseInt(value, 10) > 0) {
      const tooltip= createTooltip();
      const div = tooltip.getElement()!;
      div.innerHTML = value;

      map.addOverlay(tooltip);

      const coordinate = segment.getCoordinateAt(0.5);

      tooltip.setPosition(coordinate);

      segmentMeasureTooltips.current.push(tooltip);
    }
  }, [decimalPlacesInTooltips, feature, geodesic, map, createTooltip]);

  const updateSegmentDrawingTooltip = useCallback(() => {
    if (!feature || !map) {
      return;
    }

    const geom = simplifyFeatureGeom(feature);

    let coordinates: OlCoordinate[] = [];

    if (geom instanceof OlGeomPolygon) {
      // the last coordinate is the starting coordinate for a polygon
      coordinates = geom.getCoordinates()[0].slice(0, -1);
    }

    if (geom instanceof OlGeomLineString) {
      coordinates = geom.getCoordinates();
    }

    if (coordinates.length < 2) {
      return;
    }

    coordinates = coordinates.slice(-2);

    const segment = new OlGeomLineString(coordinates);

    const value = MeasureUtil.formatLength(segment, map, decimalPlacesInTooltips, geodesic);

    if (parseInt(value, 10) > 0) {
      if (segmentDrawingMeasureTooltip.current === undefined) {
        segmentDrawingMeasureTooltip.current = createTooltip();
        map.addOverlay(segmentDrawingMeasureTooltip.current);
      }

      const tooltip = segmentDrawingMeasureTooltip.current;

      const div = tooltip.getElement()!;
      div.innerHTML = value;
      const coordinate = segment.getCoordinateAt(0.5);

      tooltip.setPosition(coordinate);
    }
  }, [decimalPlacesInTooltips, feature, geodesic, map, createTooltip]);

  const onDrawEnd = useCallback((evt: OlDrawEvent) => {
    if (!map) {
      return;
    }

    if (showMeasureInfoOnClickedPoints && measureType === 'line') {
      removeLastStepMeasureTooltip();
    }

    if (multipleDrawing && (measureType === 'line' || measureType === 'polygon')) {
      addMeasureStopTooltip((evt.feature.getGeometry() as OlGeomMultiPolygon | OlGeomMultiLineString)
        .getLastCoordinate());
      removeMeasureTooltip();
    }

    if (!multipleDrawing) {
      updateMeasureTooltip();

      const el = measureTooltip.current?.getElement();
      if (el && measureTooltipCssClasses) {
        el.className = `${measureTooltipCssClasses.tooltip} ${measureTooltipCssClasses.tooltipStatic}`;
      }
      measureTooltip.current?.setOffset([0, -7]);
    }

    // unset sketch
    setFeature(undefined);

    if (showSegmentLengths) {
      removeSegmentDrawingMeasureTooltip();
      if (segmentMeasureTooltips.current.length > 1) {
        // because of the double click at the end one segment is doubled.
        const [tooltip] = segmentMeasureTooltips.current.splice(-2, 1);
        map.removeOverlay(tooltip);
      }
      if (measureType === 'polygon') {
        addSegmentTooltip(true);
      }
    }
  }, [addMeasureStopTooltip, measureTooltipCssClasses, map,
    measureType, multipleDrawing, removeMeasureTooltip, showMeasureInfoOnClickedPoints, updateMeasureTooltip,
    showSegmentLengths, addSegmentTooltip, removeLastStepMeasureTooltip, removeSegmentDrawingMeasureTooltip
  ]);

  const updateHelpTooltip = useCallback((coordinate: OlCoordinate) => {
    if (!helpTooltip.current) {
      return;
    }

    const helpTooltipElement = helpTooltip.current?.getElement();

    if (!helpTooltipElement) {
      return;
    }

    let msg = clickToDrawText;

    if (measureType === 'polygon') {
      msg = continuePolygonMsg;
    } else if (measureType === 'line') {
      msg = continueLineMsg;
    } else if (measureType === 'angle') {
      msg = continueAngleMsg;
    }

    helpTooltipElement.innerHTML = msg ?? '';
    helpTooltip.current.setPosition(coordinate);
  }, [clickToDrawText, continueAngleMsg, continueLineMsg, continuePolygonMsg, helpTooltip, measureType]);

  const onMapPointerMove = useCallback((evt: any) => {
    if (!evt.dragging && active) {
      updateHelpTooltip(evt.coordinate);
      if (showSegmentLengths) {
        updateSegmentDrawingTooltip();
      }
    }
  }, [updateHelpTooltip, active, showSegmentLengths, updateSegmentDrawingTooltip]);

  const onMapClick = useCallback((evt: OlMapBrowserEvent) => {
    if (active && showMeasureInfoOnClickedPoints && measureType === 'line') {
      addMeasureStopTooltip(evt.coordinate);
    }
    if (active && showSegmentLengths && (measureType === 'line' || measureType === 'polygon')) {
      addSegmentTooltip();
    }
  }, [addMeasureStopTooltip, addSegmentTooltip, measureType, showMeasureInfoOnClickedPoints, showSegmentLengths,
    active
  ]);

  useOlListener(
    drawInteraction,
    i => i.on('drawstart', (evt) => {
      onDrawStart?.(evt);
    }),
    [drawInteraction, onDrawStart]
  );

  useOlListener(
    drawInteraction,
    i => i.on('drawend', (evt) => {
      onDrawEnd?.(evt);
    }),
    [drawInteraction, onDrawEnd]
  );

  useOlListener(
    map,
    i => i.on('pointermove', (evt) => {
      onMapPointerMove?.(evt);
    }),
    [map, onMapPointerMove]
  );

  useOlListener(
    map,
    i => i.on('click', (evt: OlMapBrowserEvent) => {
      onMapClick?.(evt);
    }),
    [map, onMapClick]
  );

  useEffect(() => {
    if (showHelpTooltip) {
      createHelpTooltip();
    }
  }, [createHelpTooltip, showHelpTooltip]);

  useOlListener(
    feature,
    i => i.getGeometry()?.on('change', () => {
      updateMeasureTooltip?.();
    }),
    [feature, updateMeasureTooltip]
  );

  return null;

};

export default useMeasure;
