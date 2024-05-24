import OlCollection from 'ol/Collection';
import { singleClick } from 'ol/events/condition';
import OlFeature from 'ol/Feature';
import Modify, { ModifyEvent, Options as ModifyOptions } from 'ol/interaction/Modify';
import Translate, { Options as TranslateOptions, TranslateEvent } from 'ol/interaction/Translate';
import OlVectorLayer from 'ol/layer/Vector';
import {useEffect, useMemo, useRef} from 'react';

import { DigitizeUtil } from '../../Util/DigitizeUtil';
import useMap from '../useMap/useMap';
import {useOlInteraction} from '../useOlInteraction/useOlInteraction';
import {useOlListener} from '../useOlListener/useOlListener';
import {usePropOrDefault} from '../usePropOrDefault/usePropOrDefault';
import {useSelectFeatures, UseSelectFeaturesProps} from '../useSelectFeatures/useSelectFeatures';

interface OwnProps {
  /**
   * Active state of interactions
   */
  active: boolean;
  /**
   * Additional configuration object to apply to the ol.interaction.Modify.
   * See https://openlayers.org/en/latest/apidoc/module-ol_interaction_Modify-Modify.html
   * for more information
   *
   * Note: The keys features, deleteCondition and style are handled internally
   *       and shouldn't be overwritten without any specific cause.
   */
  modifyInteractionConfig?: Omit<ModifyOptions, 'features'|'source'|'deleteCondition'|'style'>;
  /**
   * Additional configuration object to apply to the ol.interaction.Translate.
   * See https://openlayers.org/en/latest/apidoc/module-ol_interaction_Translate-Translate.html
   * for more information
   *
   * Note: The key feature is handled internally and shouldn't be overwritten
   *       without any specific cause.
   */
  translateInteractionConfig?: Omit<TranslateOptions, 'features'|'layers'>;
  /**
   * The vector layer which will be used for digitize features.
   * The standard digitizeLayer can be retrieved via `DigitizeUtil.getDigitizeLayer(map)`.
   */
  digitizeLayer?: OlVectorLayer<OlFeature>;
  /**
   * Listener function for the 'modifystart' event of an ol.interaction.Modify.
   * See https://openlayers.org/en/latest/apidoc/module-ol_interaction_Modify-ModifyEvent.html
   * for more information.
   */
  onModifyStart?: (event: ModifyEvent) => void;
  /**
   * Listener function for the 'modifyend' event of an ol.interaction.Modify.
   * See https://openlayers.org/en/latest/apidoc/module-ol_interaction_Modify-ModifyEvent.html
   * for more information.
   */
  onModifyEnd?: (event: ModifyEvent) => void;
  /**
   * Listener function for the 'translatestart' event of an ol.interaction.Translate.
   * See https://openlayers.org/en/latest/apidoc/module-ol_interaction_Translate-TranslateEvent.html
   * for more information.
   */
  onTranslateStart?: (event: TranslateEvent) => void;
  /**
   * Listener function for the 'translateend' event of an ol.interaction.Translate.
   * See https://openlayers.org/en/latest/apidoc/module-ol_interaction_Translate-TranslateEvent.html
   * for more information.
   */
  onTranslateEnd?: (event: TranslateEvent) => void;
  /**
   * Listener function for the 'translating' event of an ol.interaction.Translate.
   * See https://openlayers.org/en/latest/apidoc/module-ol_interaction_Translate-TranslateEvent.html
   * for more information.
   */
  onTranslating?: (event: TranslateEvent) => void;
}

export type UseModifyProps = OwnProps & Omit<UseSelectFeaturesProps,
  'layers' | 'featuresCollection' | 'clearAfterSelect'>;

export const useModify = ({
  active,
  onFeatureSelect,
  onModifyStart,
  onModifyEnd,
  onTranslateStart,
  onTranslateEnd,
  onTranslating,
  digitizeLayer,
  selectStyle,
  selectInteractionConfig,
  hitTolerance,
  modifyInteractionConfig,
  translateInteractionConfig
}: UseModifyProps) => {
  const map = useMap();

  const layer = map ? usePropOrDefault(
    digitizeLayer,
    () => DigitizeUtil.getDigitizeLayer(map),
    [map]
  ) : null;

  const featuresRef = useRef(new OlCollection<OlFeature>());

  const layers = useMemo(() => layer ? [layer] : [], [layer]);

  useEffect(() => {
    if (!active) {
      featuresRef.current.clear();
    }
  }, [active]);

  useSelectFeatures({
    clearAfterSelect: false,
    onFeatureSelect,
    active,
    layers,
    selectStyle,
    selectInteractionConfig,
    hitTolerance,
    featuresCollection: featuresRef.current
  });

  const translateInteraction = useOlInteraction(
    () => {
      const newTranslateInteraction = new Translate({
        features: featuresRef.current,
        ...translateInteractionConfig
      });
      newTranslateInteraction.set('name', 'react-util-translate-interaction');
      return newTranslateInteraction;
    },
    [translateInteractionConfig],
    active
  );

  const modifyInteraction = useOlInteraction(
    () => {
      const newModifyInteraction = new Modify({
        features: featuresRef.current,
        deleteCondition: singleClick,
        style: selectStyle ?? DigitizeUtil.DEFAULT_SELECT_STYLE,
        ...modifyInteractionConfig
      });
      newModifyInteraction.set('name', 'react-util-modify-interaction');
      return newModifyInteraction;
    },
    [modifyInteractionConfig],
    active
  );

  if (modifyInteraction) {
    useOlListener(
      modifyInteraction,
      i => i.on('modifystart', e => onModifyStart?.(e)),
      [onModifyStart]
    );

    useOlListener(
      modifyInteraction,
      i => i.on('modifyend', e => onModifyEnd?.(e)),
      [onModifyEnd]
    );
  }

  if (translateInteraction) {
    useOlListener(
      translateInteraction,
      i => i.on('translatestart', e => onTranslateStart?.(e)),
      [onTranslateStart]
    );

    useOlListener(
      translateInteraction,
      i => i.on('translateend', e => onTranslateEnd?.(e)),
      [onTranslateEnd]
    );

    useOlListener(
      translateInteraction,
      i => i.on('translating', e => onTranslating?.(e)),
      [onTranslating]
    );
  }
};

export default useModify;
