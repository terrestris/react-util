import {
  DependencyList, useEffect
} from 'react';

interface AsyncEffectOptions {
  isUnmounted: () => boolean;
  onUnmount: (handler: () => void) => void;
  signal: AbortSignal;
}

type AsyncEffect = (options: AsyncEffectOptions) => Promise<void>;

/**
 * This hook allows to use async functions as an effect.
 */
export const useAsyncEffect = (effect: AsyncEffect, dependencies?: DependencyList): Promise<void> => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      let mounted = true;
      const cancelHandlers: (() => void)[] = [];
      const abortController = new AbortController();

      const onCancel = (handler: () => void) => {
        cancelHandlers.push(handler);
      };

      const cleanup = () => {
        mounted = false;
        abortController.abort();
        for (const cancelHandler of cancelHandlers) {
          cancelHandler();
        }
      };

      effect({
        isUnmounted: () => !mounted,
        onUnmount: onCancel,
        signal: abortController.signal
      })
        .then(resolve)
        .catch((e) => {
          cleanup();
          reject(e);
        });

      return cleanup;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
  });
};

export default useAsyncEffect;
