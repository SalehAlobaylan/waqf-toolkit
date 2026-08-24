// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  useSavedTools,
  __resetSavedToolsForTests,
} from './saved-tools'

beforeEach(() => {
  __resetSavedToolsForTests()
})

describe('useSavedTools', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useSavedTools())
    expect(result.current.savedSlugs).toEqual([])
    expect(result.current.isSaved('miftah-link')).toBe(false)
  })

  it('toggles a tool and persists across hook instances', () => {
    const first = renderHook(() => useSavedTools())
    act(() => first.result.current.toggle('miftah-link'))
    expect(first.result.current.isSaved('miftah-link')).toBe(true)

    const second = renderHook(() => useSavedTools())
    expect(second.result.current.savedSlugs).toEqual(['miftah-link'])
  })

  it('untoggling removes the entry', () => {
    const { result } = renderHook(() => useSavedTools())
    act(() => result.current.toggle('saut'))
    act(() => result.current.toggle('saut'))
    expect(result.current.savedSlugs).toEqual([])
  })

  it('picks up changes signaled like another tab', () => {
    const { result } = renderHook(() => useSavedTools())
    act(() => {
      localStorage.setItem(
        'waqf-toolkit:saved-tools',
        JSON.stringify(['x', 'y']),
      )
      window.dispatchEvent(new Event('waqf-saved-tools-change'))
    })
    expect(result.current.savedSlugs).toEqual(['x', 'y'])
  })
})
