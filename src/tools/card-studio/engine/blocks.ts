/**
 * Block model, editing operations, and an undo/redo history reducer.
 *
 * The card document is `{ blocks, style }`. Every mutation goes through the
 * reducer so undo/redo is a property of the model rather than a UI concern.
 */

import {
  MAX_BLOCKS,
  type CardBlock,
  type CardStyle,
  type ManualQuote,
} from '../types'

export type AddFailure = { ok: false; reason: 'limit' | 'duplicate' }
export type AddOutcome = { ok: true } | AddFailure

export function sameBlock(a: CardBlock, b: CardBlock): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'ayah' && b.kind === 'ayah') {
    return a.surah === b.surah && a.ayahStart === b.ayahStart && a.ayahEnd === b.ayahEnd
  }
  if (a.kind === 'dua' && b.kind === 'dua') return a.duaId === b.duaId
  if (a.kind === 'quote' && b.kind === 'quote') {
    if ('quoteId' in a && 'quoteId' in b) return a.quoteId === b.quoteId
    if ('manual' in a && 'manual' in b) {
      return (
        a.manual.text.trim() === b.manual.text.trim() &&
        a.manual.author.trim() === b.manual.author.trim() &&
        a.manual.work.trim() === b.manual.work.trim()
      )
    }
  }
  return false
}

export function canAddBlock(blocks: CardBlock[], next: CardBlock): AddOutcome {
  if (blocks.length >= MAX_BLOCKS) return { ok: false, reason: 'limit' }
  if (blocks.some((block) => sameBlock(block, next))) {
    return { ok: false, reason: 'duplicate' }
  }
  return { ok: true }
}

export function addBlock(blocks: CardBlock[], next: CardBlock): CardBlock[] {
  return canAddBlock(blocks, next).ok ? [...blocks, next] : blocks
}

export function removeBlock(blocks: CardBlock[], id: string): CardBlock[] {
  return blocks.filter((block) => block.id !== id)
}

export function moveBlock(blocks: CardBlock[], id: string, delta: -1 | 1): CardBlock[] {
  const index = blocks.findIndex((block) => block.id === id)
  if (index === -1) return blocks
  const target = index + delta
  if (target < 0 || target >= blocks.length) return blocks
  const copy = [...blocks]
  const [item] = copy.splice(index, 1)
  copy.splice(target, 0, item!)
  return copy
}

export function blockSummary(block: CardBlock): string {
  if (block.kind === 'ayah') {
    return `${block.surah}:${block.ayahStart}${
      block.ayahEnd !== block.ayahStart ? `–${block.ayahEnd}` : ''
    }`
  }
  if (block.kind === 'dua') return block.duaId
  return 'quoteId' in block ? block.quoteId : block.manual.author
}

export type CardDoc = {
  blocks: CardBlock[]
  style: CardStyle
}

export type HistoryState = {
  past: CardDoc[]
  present: CardDoc
  future: CardDoc[]
}

const HISTORY_LIMIT = 60

export function historyFrom(doc: CardDoc): HistoryState {
  return { past: [], present: doc, future: [] }
}

function commit(state: HistoryState, next: CardDoc): HistoryState {
  if (next === state.present) return state
  if (
    next.blocks.length === state.present.blocks.length &&
    next.style === state.present.style
  ) {
    return state
  }
  const past = [...state.past, state.present].slice(-HISTORY_LIMIT)
  return { past, present: next, future: [] }
}

export function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case 'add':
      return commit(state, {
        ...state.present,
        blocks: addBlock(state.present.blocks, action.block),
      })
    case 'remove':
      return commit(state, {
        ...state.present,
        blocks: removeBlock(state.present.blocks, action.id),
      })
    case 'move':
      return commit(state, {
        ...state.present,
        blocks: moveBlock(state.present.blocks, action.id, action.delta),
      })
    case 'style':
      return commit(state, { ...state.present, style: action.style })
    case 'undo': {
      if (state.past.length === 0) return state
      const past = [...state.past]
      const present = past.pop()!
      return { past, present, future: [state.present, ...state.future] }
    }
    case 'redo': {
      if (state.future.length === 0) return state
      const [present, ...future] = state.future
      return { past: [...state.past, state.present], present: present!, future }
    }
    case 'reset':
      return historyFrom(action.doc)
    case 'replace':
      return historyFrom(action.doc)
  }
}

export type Action =
  | { type: 'add'; block: CardBlock }
  | { type: 'remove'; id: string }
  | { type: 'move'; id: string; delta: -1 | 1 }
  | { type: 'style'; style: CardStyle }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; doc: CardDoc }
  | { type: 'replace'; doc: CardDoc }

export function canUndo(state: HistoryState): boolean {
  return state.past.length > 0
}

export function canRedo(state: HistoryState): boolean {
  return state.future.length > 0
}

/** Manual quote factory with a stable, unique id. */
export function manualQuoteBlock(quote: ManualQuote, id: string): CardBlock {
  return {
    id,
    kind: 'quote',
    manual: {
      text: quote.text.trim(),
      author: quote.author.trim(),
      work: quote.work.trim(),
      locator: quote.locator.trim(),
    },
  }
}
