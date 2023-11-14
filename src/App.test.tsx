import React from 'react';
import { render, screen, act } from '@testing-library/react';
import App from './App';
import { GAME_TITLE } from './constants/strings';
import * as ResizeObserverModule from 'resize-observer-polyfill';

(global as any).ResizeObserver = ResizeObserverModule.default;

beforeEach(() => {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

test('renders App component', () => {
  render(<App />);
  const linkElement = screen.getByText(GAME_TITLE);
  expect(linkElement).toBeInTheDocument();
});
