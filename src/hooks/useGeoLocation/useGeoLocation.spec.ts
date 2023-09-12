// @ts-ignore
import { useGeoLocation } from './useGeoLocation';

jest.mock('react');

describe('basic test', () => {
  it('is defined', () => {
    expect(useGeoLocation).toBeDefined();
  });
});
