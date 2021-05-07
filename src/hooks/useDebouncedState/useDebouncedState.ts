import { useState } from 'react';

export type UseDebouncedStateArgs<T> = {
  time?: number;
  initialValue: T;
};

/**
 * This hook allows to debounce a setState.
 */
export const useDebouncedState = <T>({ initialValue, time = 100 }: UseDebouncedStateArgs<T>): [T, (v: T) => void] => {
  const [state, setState] = useState<T>(initialValue);

  let timeout;

  const setDelayedState = (value) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      setState(value);
      clearTimeout(timeout);
      timeout = null;
    }, time);
  };

  return [state, setDelayedState];
}
