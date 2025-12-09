import {useCallback} from 'react';

import JstsGeometry from 'jsts/org/locationtech/jts/geom/Geometry';
import JstsMultiPolygon from 'jsts/org/locationtech/jts/geom/MultiPolygon';
import JstsPolygon from 'jsts/org/locationtech/jts/geom/Polygon';
import OL3Parser from 'jsts/org/locationtech/jts/io/OL3Parser';
import BufferOp from 'jsts/org/locationtech/jts/operation/buffer/BufferOp';
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp';
import ValidOp from 'jsts/org/locationtech/jts/operation/valid/IsValidOp';

import * as OlEventConditions from 'ol/events/condition';
import OlFeature from 'ol/Feature';
import OlGeometry from 'ol/geom/Geometry';
import GeometryCollection from 'ol/geom/GeometryCollection';
import LinearRing from 'ol/geom/LinearRing';
import LineString from 'ol/geom/LineString';
import MultiLineString from 'ol/geom/MultiLineString';
import MultiPoint from 'ol/geom/MultiPoint';
import MultiPolygon from 'ol/geom/MultiPolygon';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import OlInteractionDraw, {DrawEvent as OlDrawEvent} from 'ol/interaction/Draw';
import OlVectorLayer from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import {StyleLike as OlStyleLike} from 'ol/style/Style';

import DigitizeUtil from '../../Util/DigitizeUtil';
import useMap from '../useMap/useMap';

import useOlInteraction from '../useOlInteraction/useOlInteraction';
import useOlListener from '../useOlListener/useOlListener';
import usePropOrDefault from '../usePropOrDefault/usePropOrDefault';

export interface UseDrawCutProps {
  /**
   * Active state of interaction
   */
  active: boolean;
  /**
   * Style object / style function for drawn feature.
   */
  drawStyle?: OlStyleLike;
  /**
   * The vector layer which will be used for digitize features.
   * The standard digitizeLayer can be retrieved via `DigitizeUtil.getDigitizeLayer(map)`.
   */
  digitizeLayer?: OlVectorLayer<OlSourceVector>;
  /**
   * A function that is called before the cut is started.
   * @param geom The cut geometry.
   * @returns If the function returns `false` no cut will be performed.
   */
  onCutStart?: (geom: OlGeometry) => boolean|undefined|Promise<boolean|undefined>;
  /**
   * A function that is called after the cut was completed successfully.
   * @param changed A list of changed features. The geometry is undefined if the feature was removed.
   */
  onCutEnd?: (changed: OlFeature[]) => void;
}

// @ts-expect-error we don't seem to need a geometry factory
const jstsParser = new OL3Parser(undefined, undefined);
jstsParser.inject(
  Point,
  LineString,
  LinearRing,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon,
  GeometryCollection
);

/**
 * Tries to make an invalid geometry valid.
 */
const makeValid = (geom: JstsGeometry) => {
  if (ValidOp.isValid(geom) === false) {
    if (geom instanceof JstsPolygon || geom instanceof JstsMultiPolygon) {
      return BufferOp.bufferOp(geom, 0);
    } else {
      throw new Error('Geometry is invalid, but can\'t be fixed');
    }
  }
  return geom;
};

/**
 * Cuts out the given geometry from all feature geometries in the given source. All geometries that become empty by this
 * operation are removed from the source.
 * It returns an array of all changed features. If the feature was removed, the geometry is set to `undefined`.
 */
const cut = (source: OlSourceVector, olGeom: OlGeometry): OlFeature[] => {
  const cutGeom = makeValid(jstsParser.read(olGeom));

  const changed = [];

  for (const feature of source.getFeatures().slice(0)) {
    const featureGeom = makeValid(jstsParser.read(feature.getGeometry()));

    const intersection = OverlayOp.intersection(featureGeom, cutGeom);

    if (!intersection || intersection.isEmpty()) {
      continue;
    }

    const diffGeom = OverlayOp.difference(featureGeom, cutGeom);

    if (diffGeom.isEmpty()) {
      feature.setGeometry(undefined);
      source.removeFeature(feature);
    } else {
      feature.setGeometry(jstsParser.write(diffGeom));
    }
    changed.push(feature);
  }

  return changed;
};

/**
 * A hook that adds an interaction to cut out polygons out of existing geometries. For all geometries in the
 * digitizeLayer the difference with a drawn polygon is calculated.
 */
export const useDrawCut = ({
  active,
  onCutEnd,
  onCutStart,
  digitizeLayer,
  drawStyle
}: UseDrawCutProps) => {
  const map = useMap();

  const layer = usePropOrDefault(
    digitizeLayer,
    () => map ? DigitizeUtil.getDigitizeLayer(map) : undefined,
    [map]
  );

  const onDrawEnd = useCallback(async (e: OlDrawEvent) => {
    const source = layer?.getSource();
    if (!source) {
      return;
    }

    const olGeom = e.feature.getGeometry();
    if (!olGeom) {
      return;
    }

    const performCut = await onCutStart?.(olGeom);

    if (performCut === false) {
      return;
    }

    const changed = cut(source, olGeom);
    onCutEnd?.(changed);
  }, [layer, onCutStart, onCutEnd]);

  const drawInteraction = useOlInteraction(
    () => {
      if (!map) {
        return undefined;
      }

      const newInteraction = new OlInteractionDraw({
        type: 'Polygon',
        style: drawStyle ?? DigitizeUtil.defaultDigitizeStyleFunction,
        freehandCondition: OlEventConditions.never
      });

      newInteraction.set('name', 'react-util-draw-interaction-cutdelete');
      return newInteraction;
    },
    [map, layer, drawStyle],
    active
  );

  useOlListener(
    drawInteraction,
    i => i.on('drawend', onDrawEnd),
    [drawInteraction, onDrawEnd]
  );
};

export default useDrawCut;
