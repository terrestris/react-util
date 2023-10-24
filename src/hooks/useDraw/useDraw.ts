import * as OlEventConditions from 'ol/events/condition';
import OlGeometry from 'ol/geom/Geometry';
import OlInteractionDraw, { createBox, DrawEvent as OlDrawEvent, Options as OlDrawOptions } from 'ol/interaction/Draw';
import OlVectorLayer from 'ol/layer/Vector';
import OlVectorSource from 'ol/source/Vector';
import { StyleLike as OlStyleLike } from 'ol/style/Style';

import { DigitizeUtil } from '../../Util/DigitizeUtil';
import useMap from '../useMap/useMap';
import {useOlInteraction} from '../useOlInteraction/useOlInteraction';
import {useOlListener} from '../useOlListener/useOlListener';
import {usePropOrDefault} from '../usePropOrDefault/usePropOrDefault';

export type UseDrawType = 'Point' | 'LineString' | 'Polygon' | 'Circle' | 'Rectangle';

export interface UseDrawProps {
  /**
   * Active state of interaction
   */
  active: boolean;
  /**
   * Whether the line, point, polygon, circle, rectangle or text shape should
   * be drawn.
   */
  drawType: UseDrawType;
  /**
   * Style object / style function for drawn feature.
   */
  drawStyle?: OlStyleLike;
  /**
   * Listener function for the 'drawend' event of an ol.interaction.Draw.
   * See https://openlayers.org/en/latest/apidoc/module-ol_interaction_Draw-DrawEvent.html
   * for more information.
   */
  onDrawEnd?: (event: OlDrawEvent) => void;
  /**
   * Listener function for the 'drawstart' event of an ol.interaction.Draw.
   * See https://openlayers.org/en/latest/apidoc/module-ol_interaction_Draw-DrawEvent.html
   * for more information.
   */
  onDrawStart?: (event: OlDrawEvent) => void;
  /**
   * The vector layer which will be used for digitize features.
   * The standard digitizeLayer can be retrieved via `DigitizeUtil.getDigitizeLayer(map)`.
   */
  digitizeLayer?: OlVectorLayer<OlVectorSource<OlGeometry>>;
  /**
   * Additional configuration object to apply to the ol.interaction.Draw.
   * See https://openlayers.org/en/latest/apidoc/module-ol_interaction_Draw-Draw.html
   * for more information
   *
   * Note: The keys source, type, geometryFunction, style and freehandCondition
   *       are handled internally and shouldn't be overwritten without any
   *       specific cause.
   */
  drawInteractionConfig?: Omit<OlDrawOptions, 'source'|'type'|'geometryFunction'|'style'|'freehandCondition'>;
}

export const useDraw = ({
  active,
  digitizeLayer,
  drawInteractionConfig,
  drawStyle,
  drawType,
  onDrawEnd,
  onDrawStart
}: UseDrawProps) => {
  const map = useMap();

  const layer = usePropOrDefault(
    digitizeLayer,
    () => map ? DigitizeUtil.getDigitizeLayer(map) : undefined,
    [map]
  );

  const drawInteraction = useOlInteraction(
    () => {
      if (!map || !layer) {
        return undefined;
      }

      let geometryFunction;
      let type: 'Point' | 'Circle' | 'LineString' | 'Polygon';

      if (drawType === 'Rectangle') {
        geometryFunction = createBox();
        type = 'Circle';
      } else {
        type = drawType;
      }

      const newInteraction = new OlInteractionDraw({
        source: layer.getSource() || undefined,
        type: type,
        geometryFunction: geometryFunction,
        style: drawStyle ?? DigitizeUtil.defaultDigitizeStyleFunction,
        freehandCondition: OlEventConditions.never,
        ...(drawInteractionConfig ?? {})
      });

      newInteraction.set('name', `react-geo-draw-interaction-${drawType}`);
      return newInteraction;
    },
    [map, layer, drawType, drawStyle, drawInteractionConfig],
    active
  );

  useOlListener(
    drawInteraction,
    i => i.on('drawend', (evt) => {
      onDrawEnd?.(evt);
    }),
    [drawInteraction, onDrawEnd]
  );

  useOlListener(
    drawInteraction,
    i => i.on('drawstart', (evt) => {
      onDrawStart?.(evt);
    }),
    [drawInteraction, onDrawStart]
  );
};

export default useDraw;
