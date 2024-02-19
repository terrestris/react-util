import { useProjFromEpsgIO } from './useProjFromEpsgIO';

jest.mock('react');

describe('basic test', () => {
  it('is defined', () => {
    expect(useProjFromEpsgIO).toBeDefined();
  });
});
