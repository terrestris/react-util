import MeasureUtil from '@terrestris/ol-util/dist/MeasureUtil/MeasureUtil';
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
import { useCallback, useEffect, useRef, useState } from 'react';

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

export const useMeasure = ({
  measureType,
  measureLayerName = 'react-util-measure',
  fillColor = 'rgba(255, 0, 0, 0.5)',
  strokeColor = 'rgba(255, 0, 0, 0.8)',
  showMeasureInfoOnClickedPoints = false,
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

  const removeHelpTooltip = useCallback(() => {
    if (map && helpTooltip.current) {
      map.removeOverlay(helpTooltip.current);
      helpTooltip.current = undefined;
    }
  }, [map]);

  const cleanup = useCallback(() => {
    removeMeasureTooltip();
    removeStepMeasureTooltips();
    removeHelpTooltip();
    measureLayer?.getSource()?.clear();
  }, [measureLayer, removeMeasureTooltip, removeStepMeasureTooltips, removeHelpTooltip]);

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

  const createMeasureTooltip = useCallback(() => {
    if (!map || measureTooltip.current) {
      return;
    }

    measureTooltip.current = new OlOverlay({
      element: document.createElement('div'),
      offset: [0, -15],
      positioning: 'bottom-center',
      className: measureTooltipCssClasses
        ? `${measureTooltipCssClasses.tooltip} ${measureTooltipCssClasses.tooltipDynamic}`
        : ''
    });

    map.addOverlay(measureTooltip.current);
  }, [map, measureTooltip, measureTooltipCssClasses]);

  const updateMeasureTooltip = useCallback(() => {
    if (!measureTooltip.current || !feature || !map) {
      return;
    }

    let output;
    let geom = feature.getGeometry();

    if (geom instanceof OlGeomMultiPolygon) {
      geom = geom.getPolygons()[0];
    } else if (geom instanceof OlGeomMultiLineString) {
      geom = geom.getLineStrings()[0];
    }

    let measureTooltipCoord: OlCoordinate;

    if (geom instanceof OlGeomCircle) {
      if (!measureRadius) {
        output = MeasureUtil.formatArea(geom, map, decimalPlacesInTooltips, geodesic);
      } else {
        const area = MeasureUtil.getAreaOfCircle(geom, map);
        const decimalHelper = Math.pow(10, decimalPlacesInTooltips);
        const radius = Math.round(geom.getRadius() * decimalHelper) / decimalHelper;
        output = `${radius.toString()} m`;
        if (area > (Math.PI * 1000000)) {
          output = (Math.round(geom.getRadius() / 1000 * decimalHelper) /
          decimalHelper) + ' km';
        }
      }
      measureTooltipCoord = geom.getCenter();
    } else if (geom instanceof OlGeomPolygon) {
      output = MeasureUtil.formatArea(geom, map, decimalPlacesInTooltips, geodesic);
      // attach area at interior point
      measureTooltipCoord = geom.getInteriorPoint().getCoordinates();
    } else if (geom instanceof OlGeomLineString) {
      measureTooltipCoord = geom.getLastCoordinate();
      if (measureType === 'line') {
        output = MeasureUtil.formatLength(geom, map, decimalPlacesInTooltips, geodesic);
      } else if (measureType === 'angle') {
        output = MeasureUtil.formatAngle(geom, 0);
      }
    } else {
      return;
    }

    const el = measureTooltip.current.getElement();
    if (output && el) {
      el.innerHTML = output;
    }

    measureTooltip.current.setPosition(measureTooltipCoord);
  }, [decimalPlacesInTooltips, feature, geodesic, map, measureType, measureRadius]);

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

    let geom = feature.getGeometry();

    if (geom instanceof OlGeomMultiPolygon) {
      geom = geom.getPolygons()[0];
    }

    if (geom instanceof OlGeomMultiLineString) {
      geom = geom.getLineStrings()[0];
    }

    const value = measureType === 'line' ?
      MeasureUtil.formatLength(geom as OlGeomLineString, map, decimalPlacesInTooltips, geodesic) :
      MeasureUtil.formatArea(geom as OlGeomPolygon, map, decimalPlacesInTooltips, geodesic);

    if (parseInt(value, 10) > 0) {
      const div = document.createElement('div');
      if (measureTooltipCssClasses) {
        div.className = `${measureTooltipCssClasses.tooltip} ${measureTooltipCssClasses.tooltipStatic}`;
      }
      div.innerHTML = value;
      const tooltip = new OlOverlay({
        element: div,
        offset: [0, -15],
        positioning: 'bottom-center'
      });
      map.addOverlay(tooltip);

      tooltip.setPosition(coordinate);

      stepMeasureTooltips.current.push(tooltip);
    }
  }, [decimalPlacesInTooltips, feature, geodesic, map, measureTooltipCssClasses, measureType]);

  const onDrawEnd = useCallback((evt: OlDrawEvent) => {
    if (multipleDrawing) {
      addMeasureStopTooltip((evt.feature.getGeometry() as OlGeomMultiPolygon | OlGeomMultiLineString)
        .getLastCoordinate());
    }

    // TODO Recheck this
    // Fix doubled label for lastPoint of line
    if (
      (multipleDrawing || showMeasureInfoOnClickedPoints) &&
      (measureType === 'line' || measureType === 'polygon')
    ) {
      removeMeasureTooltip();
    } else {
      const el = measureTooltip.current?.getElement();
      if (el && measureTooltipCssClasses) {
        el.className = `${measureTooltipCssClasses.tooltip} ${measureTooltipCssClasses.tooltipStatic}`;
      }
      measureTooltip.current?.setOffset([0, -7]);
    }

    updateMeasureTooltip();

    // unset sketch
    setFeature(undefined);

    // fix doubled label for last point of line
    if (
      (multipleDrawing || showMeasureInfoOnClickedPoints) &&
      (measureType === 'line' || measureType === 'polygon')
    ) {
      measureTooltip.current = undefined;
      createMeasureTooltip();
    }
  }, [addMeasureStopTooltip, createMeasureTooltip, measureTooltipCssClasses,
    measureType, multipleDrawing, removeMeasureTooltip, showMeasureInfoOnClickedPoints, updateMeasureTooltip]);

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
    }
  }, [updateHelpTooltip, active]);

  const onMapClick = useCallback((evt: OlMapBrowserEvent<MouseEvent>) => {
    if (showMeasureInfoOnClickedPoints && measureType === 'line') {
      addMeasureStopTooltip(evt.coordinate);
    }
  }, [addMeasureStopTooltip, measureType, showMeasureInfoOnClickedPoints]);

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
    i => i.on('click', (evt) => {
      onMapClick?.(evt);
    }),
    [map, onMapClick]
  );

  useEffect(() => {
    createMeasureTooltip();

    if (showHelpTooltip) {
      createHelpTooltip();
    }
  }, [createHelpTooltip, createMeasureTooltip, showHelpTooltip]);

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
