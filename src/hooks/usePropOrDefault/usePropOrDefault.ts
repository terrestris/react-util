import {DependencyList, useEffect, useState} from 'react';

export const usePropOrDefault = <T>(
  prop: T|undefined,
  defaultFunc: () => T,
  dependencies: DependencyList
): T|undefined => {
  const [value, setValue] = useState<T>(undefined);
  useEffect(() => {
    if (prop) {
      setValue(prop);
    } else {
      setValue(defaultFunc());
    }
  }, [prop, ...dependencies]);

  return value;
};

export default usePropOrDefault;
