import Enzyme from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import 'whatwg-fetch';
import 'jest-canvas-mock';
import '@testing-library/jest-dom';
import 'regenerator-runtime/runtime';

global.URL.createObjectURL = jest.fn();

Enzyme.configure({ adapter: new Adapter() });

jest.mock('use-resize-observer', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

window.ResizeObserver =
    window.ResizeObserver ||
    jest.fn().mockImplementation(() => ({
      disconnect: jest.fn(),
      observe: jest.fn(),
      unobserve: jest.fn(),
    }));
