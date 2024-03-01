import { useWfs } from './useWfs';

jest.mock('react');

describe('basic test', () => {
  it('is defined', () => {
    expect(useWfs).toBeDefined();
  });
});
