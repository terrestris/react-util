import {
  Observable
} from 'ol';
import {
  EventsKey
} from 'ol/events';
import {
  unByKey
} from 'ol/Observable';
import {
  DependencyList,
  useEffect
} from 'react';

/**
 * This hook unregisters listeners if the dependency array changes
 */
export const useOlListener = <ObservableType extends Observable>(
  observable: ObservableType | ObservableType[],
  observe: (o: ObservableType) => EventsKey | EventsKey[] | undefined,
  dependencies: DependencyList,
  active?: boolean
): void => {
  useEffect(() => {
    if (!observable || active === false) {
      return undefined;
    }
    const observables = Array.isArray(observable) ? observable : [observable];
    const keys: EventsKey[] = observables
      .flatMap(o => {
        const k = observe(o);
        return Array.isArray(k) ? k : [k];
      })
      .filter(k => k !== undefined) as EventsKey[];
    return () => {
      for (const key of keys) {
        unByKey(key);
      }
    };
  }, [observable, active, ...dependencies]);
};

export default useOlListener;
