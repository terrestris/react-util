import { DependencyList, useEffect } from 'react';

type AsyncEffectOptions = {
  isUnmounted: () => boolean;
  onUnmount: (handler: () => void) => void;
  signal: AbortSignal;
};

type AsyncEffect = (options: AsyncEffectOptions) => Promise<void>;

/**
 * This hook allows to use async functions as an effect.
 */
export const useAsyncEffect = (effect: AsyncEffect, dependencies?: DependencyList) => {
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
    }).catch(() => {
      cleanup();
    });

    return cleanup;
  }, dependencies);
}
