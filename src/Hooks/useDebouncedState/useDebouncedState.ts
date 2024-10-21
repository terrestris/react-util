import { useState } from 'react';

export interface UseDebouncedStateArgs<T> {
  time?: number;
  initialValue: T;
}

/**
 * This hook allows to debounce a setState.
 */
export const useDebouncedState = <T>({
  initialValue, time = 100
}: UseDebouncedStateArgs<T>): [T, (v: T) => void] => {
  const [state, setState] = useState<T>(initialValue);

  let timeout: NodeJS.Timeout | null;

  const setDelayedState = (value: any) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      setState(value);
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = null;
    }, time);
  };

  return [state, setDelayedState];
};

export default useDebouncedState;
