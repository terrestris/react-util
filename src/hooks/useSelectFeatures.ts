import OlCollection from 'ol/Collection';
import * as OlEventConditions from 'ol/events/condition';
import OlFeature from 'ol/Feature';
import OlGeometry from 'ol/geom/Geometry';
import OlInteractionSelect, {Options as OlSelectOptions, SelectEvent as OlSelectEvent} from 'ol/interaction/Select';
import OlVectorLayer from 'ol/layer/Vector';
import OlVectorSource from 'ol/source/Vector';
import {StyleLike as OlStyleLike} from 'ol/style/Style';
import {useEffect} from 'react';

import {DigitizeUtil} from '../Util/DigitizeUtil';
import {useOlInteraction} from './useOlInteraction';
import {useOlListener} from './useOlListener';
import {usePropOrDefault} from './usePropOrDefault';

export interface UseSelectFeaturesProps {
    /**
     * Active state of interaction
     */
    active: boolean;
    /**
     * Select style of the selected features.
     */
    selectStyle?: OlStyleLike;
    /**
     * Additional configuration object to apply to the ol.interaction.Select.
     * See https://openlayers.org/en/latest/apidoc/module-ol_interaction_Select-Select.html
     * for more information
     *
     * Note: The keys condition, hitTolerance and style are handled internally
     *       and shouldn't be overwritten without any specific cause.
     */
    selectInteractionConfig?: Omit<OlSelectOptions, 'condition' | 'features' | 'hitTolerance' | 'style' | 'layers'>;
    /**
     * Listener function for the 'select' event of the ol.interaction.Select
     * See https://openlayers.org/en/latest/apidoc/module-ol_interaction_Select.html
     * for more information.
     */
    onFeatureSelect?: (event: OlSelectEvent) => void;
    /**
     * Array of layers the SelectFeaturesButton should operate on.
     */
    layers: OlVectorLayer<OlVectorSource<OlGeometry>>[];
    /**
     * Hit tolerance of the select action. Default: 5
     */
    hitTolerance?: number;
    /**
     * Clear the feature collection of the interaction after select. Default: false
     */
    clearAfterSelect?: boolean;
    /**
     * A feature collection to use.
     */
    featuresCollection?: OlCollection<OlFeature<OlGeometry>>;
}

export const useSelectFeatures = ({
  active,
  selectStyle,
  selectInteractionConfig,
  onFeatureSelect,
  hitTolerance = 5,
  layers,
  clearAfterSelect = false,
  featuresCollection,
}: UseSelectFeaturesProps) => {
  const features = usePropOrDefault(
    featuresCollection,
    () => new OlCollection(),
    []
  );

  const selectInteraction = useOlInteraction(
    () => {
      if (!features) {
        return undefined;
      }

      const newInteraction = new OlInteractionSelect({
        condition: OlEventConditions.singleClick,
        features,
        hitTolerance: hitTolerance,
        style: selectStyle ?? DigitizeUtil.DEFAULT_SELECT_STYLE,
        layers: layers,
        ...(selectInteractionConfig ?? {})
      });

      newInteraction.set('name', 'react-geo-select-interaction');

      return newInteraction;
    },
    [features, hitTolerance, selectStyle, layers, selectInteractionConfig],
    active
  );

  useOlListener(
    selectInteraction,
    i => i.on('select', e => {
      if (features && clearAfterSelect) {
        features.clear();
      }
      onFeatureSelect?.(e);
    }),
    [features, clearAfterSelect, onFeatureSelect]
  );

  useEffect(() => {
    if (!active && features) {
      features.clear();
    }
  }, []);
};
