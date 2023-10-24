// @ts-ignore
import fetch from 'jest-fetch-mock';

import { useAsyncEffect } from './useAsyncEffect';

jest.mock('react');

import { useEffect } from 'react';

const asyncTimeout = (time: number) => new Promise(resolve => {
  setTimeout(resolve, time);
});

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

  it('should reject if an error happens', () => {
    // @ts-ignore
    useEffect.mockImplementation(handler => {
      handler();
    });

    expect(
      useAsyncEffect(async () => {
        await asyncTimeout(100);
        throw new Error('Expect the unexpected.');
      })
    ).rejects.toThrow('Expect the unexpected.');
  });

  it('should abort fetch', () => {
    // @ts-ignore
    useEffect.mockImplementation(handler => {
      const cleanup = handler();
      setTimeout(() => {
        cleanup(); // abort
      }, 500);
    });

    expect(
      useAsyncEffect(async ({ isUnmounted, signal }) => {
        await asyncTimeout(100);
        fetch.mockResponse(async () => new Promise(resolve => {
          setTimeout(() => resolve(''), 600);
        }));
        await fetch('http://some.url', {
          signal
        });
        expect(isUnmounted()).toBe(true);
      })
    ).rejects.toThrow('The operation was aborted. ');
  });
});
