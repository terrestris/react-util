import '@testing-library/jest-dom';

global.URL.createObjectURL = jest.fn();

window.ResizeObserver = window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn()
  }));
