import type { AnyDhikr, Counts, DhikrFilter } from './types'
import { isCustomDhikr } from './types'

/** Pure counting + filtering logic. No Date.now inside — callers pass keys in. */

export function increment(count: number, target: number): number {
  if (!Number.isFinite(count) || count < 0) return 1
  return Math.min(target, Math.floor(count) + 1)
}

export function decrement(count: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0
  return Math.floor(count) - 1
}

export function isDone(count: number, target: number): boolean {
  return count >= target
}

/** Local-day key `YYYY-MM-DD` for an epoch-ms instant. Formatting only. */
export function dayKeyFromMs(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function shouldResetDay(storedDay: string, todayKey: string): boolean {
  return storedDay !== todayKey
}

export function filterDhikr(items: AnyDhikr[], filter: DhikrFilter): AnyDhikr[] {
  switch (filter) {
    case 'morning':
    case 'evening':
      // Custom additions join the set they were assigned to.
      return items.filter((i) => i.sets.includes(filter))
    case 'custom':
      return items.filter((i) => isCustomDhikr(i))
    case 'all':
    default:
      return items.filter((i) => !isCustomDhikr(i))
  }
}

export function searchDhikr(items: AnyDhikr[], query: string): AnyDhikr[] {
  const q = query.trim()
  if (q === '') return items
  return items.filter(
    (i) =>
      i.arabic.includes(q) ||
      i.titleEn.toLowerCase().includes(q.toLowerCase()) ||
      i.titleAr.includes(q),
  )
}

export type DayProgress = {
  done: number
  total: number
  counted: number
  prescribed: number
  percent: number
}

export function todayProgress(items: AnyDhikr[], counts: Counts): DayProgress {
  let done = 0
  let counted = 0
  let prescribed = 0
  for (const item of items) {
    const c = Math.max(0, Math.floor(counts[item.id] ?? 0))
    counted += Math.min(c, item.target)
    prescribed += item.target
    if (c >= item.target) done += 1
  }
  const total = items.length
  const percent = prescribed === 0 ? 0 : Math.round((counted / prescribed) * 100)
  return { done, total, counted, prescribed, percent }
}

/** Next incomplete item after `currentId` (wraps). Null when all done. */
export function nextIncomplete(
  items: AnyDhikr[],
  counts: Counts,
  currentId: string | null,
): string | null {
  if (items.length === 0) return null
  const start = currentId ? items.findIndex((i) => i.id === currentId) : -1
  for (let step = 1; step <= items.length; step++) {
    const item = items[(start + step) % items.length]!
    if ((counts[item.id] ?? 0) < item.target) return item.id
  }
  return null
}

const CUSTOM_ID = /^custom-[a-z0-9-]+$/

export type CustomDraft = {
  arabic: string
  meaningEn: string
  meaningAr: string
  target: number
  set: 'morning' | 'evening' | 'both'
}

export function validateCustomDraft(draft: CustomDraft): string | null {
  if (draft.arabic.trim() === '') return 'empty-arabic'
  if (!Number.isInteger(draft.target) || draft.target < 1 || draft.target > 1000) {
    return 'bad-target'
  }
  return null
}

export function customIdFor(ms: number): string {
  return `custom-${Math.max(0, Math.floor(ms)).toString(36)}`
}

export function isCustomId(id: string): boolean {
  return CUSTOM_ID.test(id)
}
