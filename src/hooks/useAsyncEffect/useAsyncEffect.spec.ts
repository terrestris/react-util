import { useAsyncEffect } from './useAsyncEffect';

// @ts-ignore
import fetch from 'jest-fetch-mock';

jest.mock('react');

import { useEffect } from 'react';

describe('useAsyncEffect', () => {
  beforeEach(() => {
    fetch.resetMocks();
    fetch.doMock();
  });

  it('should call useEffect once', done => {
    // @ts-ignore
    useEffect.mockImplementation(handler => {
      handler();
    });
    useAsyncEffect(async () => {
    });
    setTimeout(() => {
      expect(useEffect).toBeCalledTimes(1);
      done();
    }, 1000);
  });

  it('should pass the dependencies', done => {
    const dependencies: any[] = [];
    // @ts-ignore
    useEffect.mockImplementation((handler, passedDependencies) => {
      handler();
      expect(passedDependencies).toBe(dependencies);
      done();
    });
    useAsyncEffect(async () => {
    }, dependencies);
  });

  it('should call the clean up function', done => {
    const cleanup = jest.fn();
    // @ts-ignore
    useEffect.mockImplementation(handler => {
      const returnedCleanup = handler();
      returnedCleanup();
      expect(cleanup).toBeCalledTimes(1);
      done();
    });
    useAsyncEffect(async ({ onUnmount }) => {
      onUnmount(cleanup);
    });
  });

  it('should execute async functions', done => {
    // @ts-ignore
    useEffect.mockImplementation(handler => {
      handler();
    });
    const asyncFn = () => Promise.resolve();
    useAsyncEffect(async () => {
      await asyncFn();
      done();
    });
  });

  it('isCancelled should return true if execution was cancelled', done => {
    // @ts-ignore
    useEffect.mockImplementation(handler => {
      const cleanup = handler();
      cleanup(); // abort immediately
    });
    const asyncNextLoop = () => new Promise(resolve => {
      setTimeout(resolve, 0);
    });
    useAsyncEffect(async ({ isUnmounted }) => {
      expect(isUnmounted()).toBe(false);
      await asyncNextLoop();
      expect(isUnmounted()).toBe(true);
    });
    setTimeout(() => {
      done();
    }, 1000);
  });

  it('should handle more complex cases', done => {
    let count = 0;
    // @ts-ignore
    useEffect.mockImplementation(handler => {
      const cleanup = handler();
      setTimeout(() => {
        cleanup(); // abort
      }, 500);
    });
    const asyncTimeout = (time: number) => new Promise(resolve => {
      setTimeout(resolve, time);
    });
    useAsyncEffect(async ({ isUnmounted }) => {
      await asyncTimeout(100);
      expect(++count).toBe(1);
      await asyncTimeout(100);
      expect(++count).toBe(2);
      expect(isUnmounted()).toBe(false);
      await asyncTimeout(500);
      expect(isUnmounted()).toBe(true);
    });
    setTimeout(() => {
      expect(count).toBe(2);
      done();
    }, 1000);
  });

  it('should abort fetch', done => {
    // @ts-ignore
    useEffect.mockImplementation(handler => {
      const cleanup = handler();
      setTimeout(() => {
        cleanup(); // abort
      }, 500);
    });
    const asyncTimeout = (time: number) => new Promise(resolve => {
      setTimeout(resolve, time);
    });
    useAsyncEffect(async ({ isUnmounted, signal }) => {
      await asyncTimeout(100);
      fetch.mockResponse(async () => new Promise(resolve => {
        setTimeout(() => resolve(''), 600);
      }));
      await fetch('http://some.url', {
        signal
      });
      expect(isUnmounted()).toBe(true);
    });
    setTimeout(() => {
      expect(fetch.mock.calls.length).toBe(1);
      expect(fetch.mock.results[0].value).rejects.toThrow('The operation was aborted. ');
      done();
    }, 1000);
  });
});
