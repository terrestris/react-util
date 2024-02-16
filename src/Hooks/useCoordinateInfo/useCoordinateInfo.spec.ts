import { useCoordinateInfo } from './useCoordinateInfo';

jest.mock('react');

describe('basic test', () => {
  it('is defined', () => {
    expect(useCoordinateInfo).toBeDefined();
  });
});
