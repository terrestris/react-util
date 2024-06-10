import {DependencyList, useEffect, useState} from 'react';

export const usePropOrDefault = <T>(
  prop: T|undefined,
  defaultFunc: () => T,
  dependencies: DependencyList
): T|undefined => {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    if (prop) {
      setValue(prop);
    } else {
      setValue(defaultFunc());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prop, ...dependencies]);

  return value;
};

export default usePropOrDefault;
