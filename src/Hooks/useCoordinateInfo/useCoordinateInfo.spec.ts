import { useCoordinateInfo } from './useCoordinateInfo';

jest.mock('react');

describe('useCoordinateInfo', () => {

  it('is defined', () => {
    expect(useCoordinateInfo).toBeDefined();
  });

});
