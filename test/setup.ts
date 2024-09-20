import '@testing-library/jest-dom';
import '@testing-library/jest-dom/jest-globals';

import {
  TextDecoder,
  TextEncoder
} from 'util';

global.URL.createObjectURL = jest.fn();

window.ResizeObserver = window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn()
  }));

Object.assign(global, { TextDecoder, TextEncoder });
