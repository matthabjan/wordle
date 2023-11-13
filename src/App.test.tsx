import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { GAME_TITLE } from './constants/strings';
import { vi } from '@jest/globals';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub the global ResizeObserver
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

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
