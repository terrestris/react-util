import {
  DependencyList,
  useEffect
} from 'react';

import {
  Observable
} from 'ol';
import {
  EventsKey
} from 'ol/events';
import {
  unByKey
} from 'ol/Observable';

/**
 * This hook unregisters listeners if the dependency array changes
 */
export const useOlListener = <ObservableType extends Observable>(
  observable: ObservableType|ObservableType[]|undefined,
  observe: (o: ObservableType) => EventsKey|EventsKey[],
  dependencies: DependencyList,
  active?: boolean
): void => {
  useEffect(() => {
    if (!observable || active === false) {
      return undefined;
    }
    const observables = Array.isArray(observable) ? observable : [observable];
    const keys: EventsKey[] = observables.flatMap(o => {
      const k = observe(o);
      return Array.isArray(k) ? k : [k];
    });
    return () => {
      for (const key of keys) {
        unByKey(key);
      }
    };
  }, [observable, active, ...dependencies]);
};
