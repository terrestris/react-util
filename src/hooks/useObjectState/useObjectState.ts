// Code inspired by https://github.com/RehmatFalcon/UseObjectState
import { Logger } from '@terrestris/base-util';
import { isEqual, isObject, isUndefined } from 'lodash';
import { Dispatch, SetStateAction, useState } from 'react';

/**
 * This hook should be used if the state stores and object value.
 * It has two advantages:
 *   1. React itself uses `Object.is` for state comparison which is mostly not what you want
 *      so we use isEqual from lodash.
 *   2. You can add partial updates on the first level.
 *      If you want to update only on value its sufficient to only pass this key-value pair.
 *
 * @param initial Object like value.
 */
export const useObjectState = <S extends object>(
  initial?: S | (() => S),
  allowPartialUpdates: boolean = false
): [S, Dispatch<SetStateAction<Partial<S>>>] => {

  if (!isUndefined(initial) && !isObject(initial)) {
    Logger.error('"useObjectState" can only be used with objects');
  }
  const [state, updateState] = useState(initial);

  const setState = (newStateValue) => {
    if (!isEqual(state, newStateValue)) {
      if (allowPartialUpdates) {
        updateState({
          ...state,
          ...newStateValue
        });
      } else {
        updateState(newStateValue);
      }
    }
  };

  return [
    state,
    setState
  ];
};
