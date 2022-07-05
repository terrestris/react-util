import { useObjectState } from './useObjectState';
import { renderHook, act } from '@testing-library/react';

import { Logger } from '@terrestris/base-util';

type User = {
  name: string;
  age: number;
};

describe('useObjectState', () => {
  const errorLogSpy = jest.spyOn(Logger, 'error');
  const initialUser = {
    name: 'Peter',
    age: 12
  };

  it('… logs an error if supplied with other then `object`', () => {
    renderHook(() => useObjectState<String>('Peter'));
    expect(errorLogSpy).toHaveBeenCalledWith('"useObjectState" can only be used with objects');
  });
  it('… returns the correct initial value as first argument', () => {
    const { result } = renderHook(() => useObjectState<User>(initialUser));
    const user = result.current[0];
    expect(result.current).toBeInstanceOf(Array);
    expect(user).toBe(initialUser);
  });
  it('… returns the setter as second argument', () => {
    const { result } = renderHook(() => useObjectState<User>(initialUser));
    const setter = result.current[1];
    expect(result.current).toBeInstanceOf(Array);
    expect(setter).toBeInstanceOf(Function);
  });

  describe('… configured with allowPartialUpdates = false (default)', () => {
    it('… calls updateState if called with a new State', () => {
      const newUser = {
        name: 'Doris',
        age: 14
      };
      const { result } = renderHook(() => useObjectState<User>(initialUser));
      const setUser = result.current[1];
      act(() => {
        setUser(newUser);
      });
      const user = result.current[0];
      expect(user).toEqual(newUser);
    });

    it('… calls updateState if called with a partially new State', () => {
      const newUser = {
        name: 'Peter',
        age: 13
      };
      const { result } = renderHook(() => useObjectState<User>(initialUser));
      const setUser = result.current[1];
      act(() => {
        setUser(newUser);
      });
      const user = result.current[0];
      expect(user).toEqual(newUser);
    });

    it('… overrides the old object if called with only one new key', () => {
      const newAge = { age: 13 };
      const { result } = renderHook(() => useObjectState<User>(initialUser));
      const setUser = result.current[1];
      act(() => {
        setUser(newAge);
      });
      const user = result.current[0];
      expect(user).toEqual(newAge);
    });

    it('… does nothing if called with an equal State', () => {
      const newUser = {
        name: 'Peter',
        age: 12
      };
      const { result } = renderHook(() => useObjectState<User>(initialUser));
      const setUser = result.current[1];
      act(() => {
        setUser(newUser);
      });
      const user = result.current[0];
      expect(user).toBe(initialUser);
    });
  });

  describe('… configured with allowPartialUpdates = true', () => {
    it('… calls updateState if called with a new State', () => {
      const newUser = {
        name: 'Doris',
        age: 14
      };
      const { result } = renderHook(() => useObjectState<User>(initialUser, true));
      const setUser = result.current[1];
      act(() => {
        setUser(newUser);
      });
      const user = result.current[0];
      expect(user).toEqual(newUser);
    });

    it('… calls updateState if called with a partially new State', () => {
      const newUser = {
        name: 'Peter',
        age: 13
      };
      const { result } = renderHook(() => useObjectState<User>(initialUser, true));
      const setUser = result.current[1];
      act(() => {
        setUser(newUser);
      });
      const user = result.current[0];
      expect(user).toEqual(newUser);
    });

    it('… calls updateState if called with only one new key', () => {
      const newUser = {
        name: 'Peter',
        age: 13
      };
      const newAge = { age: 13 };
      const { result } = renderHook(() => useObjectState<User>(initialUser, true));
      const setUser = result.current[1];
      act(() => {
        setUser(newAge);
      });
      const user = result.current[0];
      expect(user).toEqual(newUser);
    });

    it('… does nothing if called with an equal State', () => {
      const newUser = {
        name: 'Peter',
        age: 12
      };
      const { result } = renderHook(() => useObjectState<User>(initialUser, true));
      const setUser = result.current[1];
      act(() => {
        setUser(newUser);
      });
      const user = result.current[0];
      expect(user).toBe(initialUser);
    });
  });

});
