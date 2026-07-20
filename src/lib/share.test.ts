import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateEmojiGrid, shareStatus } from './share'

describe('generateEmojiGrid', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('builds a light-theme emoji grid', () => {
    const grid = generateEmojiGrid(['ABCDE'], 'ABCDE')
    expect(grid).toBe('🟩🟩🟩🟩🟩')
  })

  it('uses high-contrast emojis when enabled', () => {
    localStorage.setItem('highContrast', '1')
    const grid = generateEmojiGrid(['AXCDE'], 'ABCDE')
    expect(grid).toContain('🟧')
    expect(grid).toContain('⬜')
  })
})

describe('shareStatus', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('falls back to clipboard when share is unavailable', async () => {
    // @ts-expect-error test override
    delete navigator.share

    const result = await shareStatus(['ABCDE'], false, false, 3, 'ABCDE')
    expect(result).toBe('copied')
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })
})
