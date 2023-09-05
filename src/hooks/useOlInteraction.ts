import {
  DependencyList,
  useEffect,
  useState
} from 'react';

import {
  isNil
} from 'lodash';

import {
  Interaction
} from 'ol/interaction';

import useMap from './useMap';

/**
 * This hook adds an interaction to the map and removes/updates it if the dependency array changes.
 * It accepts an optional active parameter that toggles the active state of the interaction. If it is undefined the
 * active state will not get changed.
 * @param constructor returns an interaction to be added to the map, will be called again, if the interaction needs
 * to be updated
 * @param dependencies
 * @param active
 */
export const useOlInteraction = <InteractionType extends Interaction> (
  constructor: () => InteractionType|undefined,
  dependencies: DependencyList,
  active?: undefined|boolean
): InteractionType|undefined => {
  const map = useMap();
  const [interaction, setInteraction] = useState<InteractionType>();
  useEffect(() => {
    if (!map) {
      return undefined;
    }

    const newInteraction = constructor();
    if (!newInteraction) {
      return undefined;
    }

    setInteraction(newInteraction);
    map.addInteraction(newInteraction);

    return () => {
      map.removeInteraction(newInteraction);
      setInteraction(undefined);
    };
  }, [...dependencies, map]);

  useEffect(() => {
    if (!interaction || isNil(active)) {
      return;
    }
    interaction.setActive(active);
  }, [interaction, active]);

  return interaction;
};
