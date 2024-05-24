import '@testing-library/jest-dom';
import '@testing-library/jest-dom/jest-globals';

global.URL.createObjectURL = jest.fn();

window.ResizeObserver = window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn()
  }));
