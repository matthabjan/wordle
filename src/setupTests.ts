import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import * as ResizeObserverModule from 'resize-observer-polyfill'

;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverModule.default

vi.mock('virtual:pwa-register', () => ({
  registerSW: () => () => undefined,
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
