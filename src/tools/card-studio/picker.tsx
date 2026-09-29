import { useMemo, useState } from 'react'
import { useI18n, type Locale } from '@/i18n'
import { Button, inputClasses } from '@/components/ui'
import { matchesText } from './engine/search'
import { canAddBlock, manualQuoteBlock } from './engine/blocks'
import { localizeDigits, validateManualQuote } from './engine/resolve'
import { HISN_DUAS, type DuaEntry } from './data/duas'
import { CURATED_QUOTES, type CuratedQuote } from './data/quotes'
import { OCCASIONS } from './data/occasions'
import { SURAHS, type SurahText } from './data/quran'
import {
  MAX_BLOCKS,
  type Digits,
  type BlockKind,
  type CardBlock,
  type CardBlockSpec,
  type ManualQuote,
} from './types'

/**
 * The text picker — the primary surface of the tool.
 *
 * Choosing the text is the work; the canvas is the confirmation. So this owns
 * the widest column in the workspace, and it replaces the old design where the
 * same surface was a 320px rail and Quran was reachable only through three
 * `<select>` dropdowns — which meant you had to already know the surah number
 * *and* count to the verse.
 *
 * Extracted from `card-studio-try.tsx` so the try component stays about the
 * tool, and so the pieces can be reasoned about (and changed) on their own.
 *
 * The Quran cache stays with the parent, which needs it to resolve blocks for
 * the canvas. This component only asks for what it needs via `ensureSurah`.
 */

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

type Kind = 'dua' | 'ayah' | 'quote'

const EMPTY_MANUAL: ManualQuote = { text: '', author: '', work: '', locator: '' }

/** Mirrors the parent's `StatusKey`; the parent owns the copy. */
export type PickerNotice = 'limit' | 'duplicate' | 'slotFull'

export type TextPickerProps = {
  blocks: CardBlock[]
  /** Digit preference, so a citation reads the same here as on the card. */
  digits: Digits
  quran: Readonly<Record<number, SurahText>>
  quranErrors: Readonly<Record<number, boolean>>
  /** Ask the parent to warm a surah into the shared cache. */
  ensureSurah: (id: number) => void
  onOffer: (block: CardBlock) => void
  /** Toggle: removes a block that is already on the card. */
  onRemove: (blockId: string) => void
  onStatus: (notice: PickerNotice) => void
  newBlockId: (kind: BlockKind) => string
}

export function TextPicker(props: TextPickerProps) {
  const { t, locale } = useI18n()
  const c = t.cardStudio
  const [tab, setTab] = useState<Kind>('dua')
  const [query, setQuery] = useState('')

  const chosenKeys = useMemo(() => new Set(props.blocks.map(blockKey)), [props.blocks])
  const slotsLeft = MAX_BLOCKS - props.blocks.length

  return (
    <section aria-labelledby="card-studio-add" className="flex h-full flex-col">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="card-studio-add" className="text-sm font-semibold text-ink">
          {c.chooseTitle}
        </h2>
        <p
          className={`font-mono-ui text-[11px] ${
            slotsLeft === 0 ? 'font-bold text-clay-deep' : 'text-muted'
          }`}
          role="status"
        >
          {c.slotCounter
            .replace('{used}', String(props.blocks.length))
            .replace('{max}', String(MAX_BLOCKS))}
        </p>
      </div>

      {/* Occasions are an entry point, not a fourth kind of text, so they sit
          above the tabs as quick starts rather than competing with them. */}
      <OccasionStrip
        onPick={(specs) => {
          let added = 0
          for (const spec of specs.slice(0, MAX_BLOCKS - props.blocks.length)) {
            const block: CardBlock = { ...spec, id: props.newBlockId(spec.kind) } as CardBlock
            if (canAddBlock(props.blocks, block).ok) {
              props.onOffer(block)
              added += 1
            }
          }
          if (added === 0) props.onStatus('slotFull')
        }}
      />

      <div
        role="tablist"
        aria-label={c.chooseTitle}
        className="mt-4 flex flex-wrap gap-1 rounded-full border border-line/80 p-1"
      >
        {(['dua', 'ayah', 'quote'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key)
              setQuery('')
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-bold ${FOCUS_RING} ${
              tab === key
                ? 'bg-accent text-paper'
                : 'text-muted hover:text-accent'
            }`}
          >
            {key === 'dua' ? c.tabDua : key === 'ayah' ? c.tabAyah : c.tabQuote}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-[11px] font-semibold text-muted">
        {c.searchLabel}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            tab === 'dua'
              ? c.duaSearchPlaceholder
              : tab === 'ayah'
                ? c.ayahSearchPlaceholder
                : c.quoteSearchPlaceholder
          }
          dir="auto"
          className={`${inputClasses} mt-1`}
        />
      </label>

      <div className="mt-4 min-h-0 flex-1 lg:overflow-y-auto lg:overscroll-contain">
        {tab === 'dua' && (
          <DuaResults {...props} query={query} chosenKeys={chosenKeys} locale={locale} />
        )}
        {tab === 'ayah' && (
          <VerseBrowser {...props} query={query} slotsLeft={slotsLeft} />
        )}
        {tab === 'quote' && <QuoteResults {...props} query={query} chosenKeys={chosenKeys} locale={locale} />}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ rows */

/**
 * One selectable result. The whole row is the control: a 65px button in a
 * 900px column wastes the space, and hunting for a small target is exactly
 * what the old rail forced on people.
 */
function ResultRow({
  chosen,
  disabled,
  title,
  meta,
  arabic,
  onToggle,
  endAdornment,
}: {
  chosen: boolean
  disabled?: boolean
  title: string
  meta?: string
  arabic: string
  onToggle: () => void
  endAdornment?: React.ReactNode
}) {
  const { t } = useI18n()
  const c = t.cardStudio
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={chosen}
      disabled={disabled}
      data-testid="picker-row"
      className={`flex w-full items-start gap-3 border-b border-line/50 px-4 py-3 text-start transition-colors last:border-b-0 ${FOCUS_RING} ${
        chosen
          ? 'bg-accent-soft/40'
          : disabled
            ? 'cursor-not-allowed opacity-55'
            : 'hover:bg-accent-soft/25'
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-ink">{title}</span>
          {endAdornment}
        </span>
        <span
          dir="rtl"
          lang="ar"
          translate="no"
          spellCheck={false}
          className="mt-1 block font-display text-sm leading-7 text-muted"
        >
          {arabic}
        </span>
        {meta && (
          <span dir="ltr" className="mt-1 block font-mono-ui text-[11px] text-muted">
            {meta}
          </span>
        )}
        {chosen && (
          <span className="mt-1.5 block text-[11px] font-bold text-accent">
            {c.alreadyAdded}
          </span>
        )}
      </span>
    </button>
  )
}

/* --------------------------------------------------------------- occasions */

function blockKey(block: CardBlock): string {
  if (block.kind === 'ayah') return `ayah:${block.surah}:${block.ayahStart}:${block.ayahEnd}`
  if (block.kind === 'dua') return `dua:${block.duaId}`
  return 'quoteId' in block ? `quote:${block.quoteId}` : `manual:${block.manual.text}`
}

function OccasionStrip({ onPick }: { onPick: (specs: CardBlockSpec[]) => void }) {
  const { locale, t } = useI18n()
  const c = t.cardStudio
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold text-muted">{c.occasionStartTitle}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {OCCASIONS.map((occasion) => (
          <li key={occasion.id}>
            <button
              type="button"
              onClick={() => onPick(occasion.blocks)}
              title={locale === 'ar' ? occasion.hintAr : occasion.hintEn}
              className={`cursor-pointer rounded-full border border-line/80 bg-surface/70 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent/40 hover:text-accent ${FOCUS_RING}`}
            >
              {locale === 'ar' ? occasion.nameAr : occasion.nameEn}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------- duas */

function DuaResults({
  blocks,
  digits,
  query,
  chosenKeys,
  locale,
  onOffer,
  onRemove,
  onStatus,
  newBlockId,
}: TextPickerProps & { query: string; chosenKeys: Set<string>; locale: Locale }) {
  const { t } = useI18n()
  const c = t.cardStudio
  const rows = useMemo(
    () =>
      HISN_DUAS.filter((dua) =>
        matchesText(query, [dua.arabic, dua.titleEn, dua.titleAr, dua.source, dua.hisnRef]),
      ),
    [query],
  )
  return (
    <ResultList empty={c.duaEmpty}>
      {rows.map((dua: DuaEntry) => (
        <ResultRow
          key={dua.id}
          chosen={chosenKeys.has(`dua:${dua.id}`)}
          title={locale === 'ar' ? dua.titleAr : dua.titleEn}
          arabic={dua.arabic}
          meta={`${localizeDigits(dua.source, digits)} · ${locale === 'ar' ? dua.hisnRefAr : dua.hisnRef}`}
          onToggle={() => toggle(
            `dua:${dua.id}`,
            blocks,
            onOffer,
            onRemove,
            onStatus,
            { id: newBlockId('dua'), kind: 'dua', duaId: dua.id },
          )}
        />
      ))}
    </ResultList>
  )
}

/* ------------------------------------------------------------------ quotes */

function QuoteResults({
  blocks,
  query,
  chosenKeys,
  locale,
  onOffer,
  onRemove,
  onStatus,
  newBlockId,
}: TextPickerProps & { query: string; chosenKeys: Set<string>; locale: Locale }) {
  const { t } = useI18n()
  const c = t.cardStudio
  const [manual, setManual] = useState<ManualQuote>(EMPTY_MANUAL)
  const [manualError, setManualError] = useState(false)

  const rows = useMemo(
    () =>
      CURATED_QUOTES.filter((quote) =>
        matchesText(query, [
          quote.arabic,
          quote.authorEn,
          quote.authorAr,
          quote.workEn,
          quote.workAr,
        ]),
      ),
    [query],
  )

  return (
    <div className="space-y-5">
      <ResultList empty={c.duaEmpty}>
        {rows.map((quote: CuratedQuote) => (
          <ResultRow
            key={quote.id}
            chosen={chosenKeys.has(`quote:${quote.id}`)}
            title={locale === 'ar' ? quote.authorAr : quote.authorEn}
            arabic={quote.arabic}
            meta={locale === 'ar' ? quote.workAr : quote.workEn}
            endAdornment={
              !quote.verified ? (
                <span className="rounded-full bg-clay-soft px-2 py-0.5 text-[10px] font-bold text-clay-deep">
                  {c.quoteReviewBadge}
                </span>
              ) : undefined
            }
            onToggle={() => toggle(
              `quote:${quote.id}`,
              blocks,
              onOffer,
              onRemove,
              onStatus,
              { id: newBlockId('quote'), kind: 'quote', quoteId: quote.id },
            )}
          />
        ))}
      </ResultList>

      {/* Manual entry is the real path for quotes: the curated set is two. */}
      <div className="rounded-2xl border border-line/70 p-4">
        <h3 className="text-xs font-semibold text-ink">{c.quoteCustomTitle}</h3>
        <p className="mt-1 text-[11px] leading-5 text-muted">{c.quoteCustomNote}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 @lg:grid-cols-2">
          <label className="text-[11px] font-semibold text-muted @lg:col-span-2">
            {c.quoteCustomArabic}
            <textarea
              value={manual.text}
              onChange={(event) => setManual({ ...manual, text: event.target.value })}
              placeholder={c.quoteCustomArabicPlaceholder}
              dir="rtl"
              lang="ar"
              spellCheck={false}
              rows={3}
              className={`${inputClasses} mt-1 resize-y font-display`}
            />
          </label>
          {(
            [
              ['author', c.quoteCustomAuthor, c.quoteCustomAuthorPlaceholder],
              ['work', c.quoteCustomWork, c.quoteCustomWorkPlaceholder],
              ['locator', c.quoteCustomLocator, c.quoteCustomLocatorPlaceholder],
            ] as const
          ).map(([field, label, placeholder]) => (
            <label key={field} className="text-[11px] font-semibold text-muted">
              {label}
              <input
                value={manual[field]}
                onChange={(event) => setManual({ ...manual, [field]: event.target.value })}
                placeholder={placeholder}
                dir="auto"
                className={`${inputClasses} mt-1`}
              />
            </label>
          ))}
        </div>
        {manualError && (
          <p className="mt-2 text-xs font-semibold text-danger" role="alert">
            {c.quoteInvalid}
          </p>
        )}
        <Button
          variant="outline"
          onClick={() => {
            if (!validateManualQuote(manual)) {
              setManualError(true)
              return
            }
            setManualError(false)
            onOffer(manualQuoteBlock(manual, newBlockId('quote')))
            setManual(EMPTY_MANUAL)
          }}
          className="mt-3 px-4 py-2 text-xs"
        >
          {c.quoteCustomAdd}
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- ayah browser */

/**
 * Two-level: a searchable surah list, then that surah's verses as toggle rows.
 *
 * This replaces three `<select>` dropdowns, which required the user to know the
 * surah number and count to the verse before they could even start looking.
 * Single verses are the common case and are a row tap; ranges are the exception
 * and get an explicit from/to control, because a two-dropdown range over 286
 * options is the thing we are removing.
 */
function VerseBrowser({
  quran,
  quranErrors,
  ensureSurah,
  blocks,
  query,
  slotsLeft,
  onOffer,
  onRemove,
  onStatus,
  newBlockId,
}: TextPickerProps & { query: string; slotsLeft: number }) {
  const { locale, t } = useI18n()
  const c = t.cardStudio
  const [surahId, setSurahId] = useState<number | null>(null)
  const [from, setFrom] = useState(1)
  const [to, setTo] = useState(1)
  const chosenKeys = useMemo(() => new Set(blocks.map(blockKey)), [blocks])

  const surahs = useMemo(
    () =>
      SURAHS.filter((surah) =>
        matchesText(query, [surah.nameEn, surah.nameAr, String(surah.id)]),
      ),
    [query],
  )

  if (surahId === null) {
    return (
      <ResultList empty={c.duaEmpty}>
        {surahs.map((surah) => (
          <button
            key={surah.id}
            type="button"
            onClick={() => {
              setSurahId(surah.id)
              setFrom(1)
              setTo(1)
              ensureSurah(surah.id)
            }}
            className={`flex w-full items-center justify-between gap-3 border-b border-line/50 px-4 py-3 text-start transition-colors last:border-b-0 hover:bg-accent-soft/25 ${FOCUS_RING}`}
          >
            <span className="min-w-0">
              <span className="text-sm font-semibold text-ink">
                {locale === 'ar' ? surah.nameAr : surah.nameEn}
              </span>
              <span dir="ltr" className="ms-2 font-mono-ui text-[11px] text-muted">
                {surah.id}
              </span>
            </span>
            <span className="shrink-0 text-[11px] text-muted">
              {locale === 'ar'
                ? `${surah.ayahCount} آية`
                : `${surah.ayahCount} ${surah.ayahCount === 1 ? c.ayahUnit : c.ayahUnitPlural}`}
            </span>
          </button>
        ))}
      </ResultList>
    )
  }

  const meta = SURAHS[surahId - 1]
  const text = quran[surahId]
  const error = quranErrors[surahId] === true
  // The range clamps against the loaded text, not `ayahCount` — the same rule
  // `resolveBlocks` uses, so the browser cannot offer a verse that will not
  // resolve.
  const maxVerse = text ? text.ayat.length : meta.ayahCount
  const start = Math.max(1, Math.min(from, to))
  const end = Math.min(maxVerse, Math.max(from, to))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSurahId(null)}
          className={`rounded-full border border-line/80 px-3 py-1.5 text-xs font-medium text-ink hover:border-accent/40 hover:text-accent ${FOCUS_RING}`}
        >
          ← {c.browseSurahs}
        </button>
        <span className="text-sm font-semibold text-ink">
          {locale === 'ar' ? meta.nameAr : `${meta.id}. ${meta.nameEn}`}
        </span>
      </div>

      {/* Range control. Two number inputs, not two dropdowns: 286 options in a
          select is unusable on a phone and hostile on a desktop. */}
      <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-line/70 bg-surface/40 p-3">
        <label className="text-[11px] font-semibold text-muted">
          {c.fromAyahLabel}
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={maxVerse}
            value={from}
            onChange={(event) =>
              setFrom(Math.max(1, Math.min(maxVerse, Number(event.target.value) || 1)))
            }
            dir="ltr"
            className={`${inputClasses} mt-1 w-20 px-3 py-2`}
          />
        </label>
        <label className="text-[11px] font-semibold text-muted">
          {c.toAyahLabel}
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={maxVerse}
            value={to}
            onChange={(event) =>
              setTo(Math.max(1, Math.min(maxVerse, Number(event.target.value) || 1)))
            }
            dir="ltr"
            className={`${inputClasses} mt-1 w-20 px-3 py-2`}
          />
        </label>
        <Button
          variant="outline"
          disabled={slotsLeft <= 0}
          onClick={() =>
            onOffer({
              id: newBlockId('ayah'),
              kind: 'ayah',
              surah: surahId,
              ayahStart: start,
              ayahEnd: end,
            })
          }
          className="px-3 py-2 text-xs"
        >
          {c.addRange}
        </Button>
        <span dir="ltr" className="ms-auto font-mono-ui text-[11px] text-muted">
          {surahId}:{start}
          {end > start ? `-${end}` : ''}
        </span>
      </div>

      {!text && !error && (
        <p className="mt-3 text-xs text-muted" role="status">
          {c.ayahLoading}
        </p>
      )}
      {error && (
        <p className="mt-3 text-xs font-semibold text-danger" role="alert">
          {c.ayahLoadFailed}
        </p>
      )}

      {text && (
        <ul className="mt-3 overflow-hidden rounded-xl border border-line/70">
          {text.ayat.map((ayah, index) => {
            const number = index + 1
            const key = `ayah:${surahId}:${number}:${number}`
            return (
              <ResultRow
                key={number}
                chosen={chosenKeys.has(key)}
                title={`${surahId}:${number}`}
                arabic={ayah}
                onToggle={() => toggle(
                  key,
                  blocks,
                  onOffer,
                  onRemove,
                  onStatus,
                  { id: newBlockId('ayah'), kind: 'ayah', surah: surahId, ayahStart: number, ayahEnd: number },
                )}
              />
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ shared */

function ResultList({
  children,
  empty,
}: {
  children: React.ReactNode
  empty: string
}) {
  const isEmpty = Array.isArray(children) ? children.length === 0 : !children
  return (
    <ul className="overflow-hidden rounded-xl border border-line/70">
      {isEmpty ? (
        <li className="px-4 py-6 text-center text-xs text-muted">{empty}</li>
      ) : (
        children
      )}
    </ul>
  )
}

/**
 * Whole-row toggle. Adding and removing share one control so the row always
 * means the same thing; `canAddBlock` is still the authority, and its reason is
 * surfaced rather than swallowed.
 */
function toggle(
  key: string,
  blocks: CardBlock[],
  onOffer: (block: CardBlock) => void,
  onRemove: (blockId: string) => void,
  onStatus: (notice: PickerNotice) => void,
  block: CardBlock,
) {
  const existing = blocks.find((candidate) => blockKey(candidate) === key)
  if (existing) {
    onRemove(existing.id)
    return
  }
  const outcome = canAddBlock(blocks, block)
  if (!outcome.ok) {
    onStatus(outcome.reason)
    return
  }
  onOffer(block)
}
