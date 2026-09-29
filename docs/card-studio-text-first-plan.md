# Card Studio — Text-First Redesign

> **Status:** implemented. Phases 1–5 done. Deviations are in §7.
> **Thesis:** choosing the text is the work; the canvas is the confirmation.
> The old layout gave the smallest surface to the work and the largest to the
> confirmation, and reached Quran only through three dropdowns.

## 1. Diagnosis

| Corpus | Size | How you reached it before |
| --- | --- | --- |
| Duas | 14 | search box + a 224px scroll list |
| Quran | 6,236 ayat | **three `<select>` dropdowns** |
| Quotes | 2 curated + manual form | short list |
| Occasions | 10 | a 4th tab, peer of the content kinds |

To pick an ayah you had to already know the surah number *and* count to the
verse. That is arithmetic, not choosing.

## 2. Layout

```
before                                  after
┌────────┬──────────────┬────────┐      ┌────────┬───────────────┬──────────┐
│ 320px  │   canvas     │ 320px  │      │ 264px  │ choose text   │ preview  │
│ picker │   (centre)   │ output │  ->  │assembly│  (1fr)        │ 320-440  │
│ blocks │              │        │      │ blocks │               │  sticky  │
│ design │              │        │      │template│               │  + expand│
└────────┴──────────────┴────────┘      │  shape │               │          │
                                        └────────┴───────────────┴──────────┘
```

DOM order `panel, stage, inspector` is unchanged, so mobile still stacks
**assembly → choose → preview** and the pane-order test still holds. Grid
mirroring puts the preview on the left in Arabic — correct, because it follows
the picker in reading order in both directions.

## 3. The substance

1. **Two-level verse browser.** `SURAHS[surah - 1]` for the surah list;
   `loadSurah(id)` is already lazy and rejects with `Error('unknown-surah')`.
   Range selection for e.g. `2:285–286`. Must respect `resolve.ts:66-70`: the
   basmala is re-attached only when the range starts at ayah 1 *and* the surah
   is not 1, and the range clamps against `text.ayat.length`, not `ayahCount`.
2. **Search normalisation** (`engine/search.ts`). The old filter matched raw
   `arabic` + `titleEn`/`titleAr`, missed `source` and `hisnRef` even though
   rows displayed them, and did no Arabic folding — so typing unvocalised text
   returned nothing.
3. **Occasions out of the tablist**, into a quick-start strip. Tabs stay
   purely about kind of text; occasions are an entry point.
4. **Whole-row toggle + honest slot state.** `MAX_BLOCKS` is 3
   (`types.ts:12`); `canAddBlock` returns `reason: 'limit' | 'duplicate'`
   (`blocks.ts:37-43`), with `limit` checked first.
5. **Fit hint from data already computed.** `CardLayout.blocks[].legible` and
   `.fits` are per block and the preview already computes them, so the
   assembly rail can mark a tight block for free. Per-row hints are *not*
   implemented: they would need a measure pass per candidate.
6. **Preview expand** via a native `<dialog>`, the same pattern as
   `image-preview-dialog.tsx`. Without it a 1080×1920 story card is unjudgeable
   at 400px wide.

## 4. Plumbing

`ToolLayout` gains `wide?: PaneId` (which pane takes the wider fixed track) and
`defer?: PaneId` (which pane waits for `xl` when there are three). Card Studio
declares `wide: 'inspector', defer: 'panel'`: at 1024px the preview matters more
than the frame picker.

`Workspace.Pane`'s hardcoded `stage` special case (fills, does not scroll,
tighter padding) became an explicit `fill` prop, because the artifact pane is no
longer the stage. Every tool marks its own canvas.

## 5. Risks carried into the build

- **Bundle on browsing.** 114 lazy JSONs, 1.3 MB total, mean 12 KB, max 103 KB
  (Al-Baqarah). Never opening the Quran tab costs nothing; a *browser* makes
  surah loading routine. Hence a per-surah loading state.
- **Async race on fast surah switching** — the preview effect's `cancelled`
  guard is the pattern to copy.
- **A 3-block limit in a large centre** looks sparse at one block, so the empty
  and one-block states are written deliberately.

## 7. Deviations

1. **Four regions, three panes.** The plan implied the canvas was its own pane
   beside the settings rail. That produced two elements with `id="inspector"` —
   duplicate `data-pane` and `aria-label`, and a fourth grid child. The canvas
   was folded into the settings rail instead, which is also the better grouping:
   one column holds *the card and what you do with it*. The rail scrolls and the
   canvas is capped at `max-h-[46vh]`, so it is not `fill` on this tool.
2. **`fill` became a prop, not a registry flag.** The stage special case became
   `<Workspace.Pane fill>`, because the artifact is no longer the stage. Tools
   mark their own canvas; only Card Studio overrides it.
3. **The `slotFull` notice joined the existing status channel.** The picker
   reports a `PickerNotice` key and the parent owns the copy, so there is one
   status map rather than pre-rendered strings crossing the boundary.
4. **A search gap I did not anticipate:** transliterated author names carry
   macrons and typographic apostrophes ("Imam al-Shafi'i"). `normaliseLatin` now
   folds both. A Latin query still cannot match Arabic script — there is no
   transliteration table — and that is stated in the test rather than papered
   over.

## 8. Still open

- **Per-row fit hints are not implemented.** They need a measure pass per
  candidate; the 6,236-ayat sweep in `layout.test.ts` is the reason that is
  slow. The per-*block* hint is free and shipped.
- **Surah prefetch is not implemented.** A browser makes surah loading routine,
  and Al-Baqarah is 103 KB. The picker shows a loading state and requests one
  surah at a time; prefetching the next one in the list would be the next
  improvement.
- **Playwright.** CI still cannot see a rendered pixel. The new guards cover
  grid resolution, pane order, container queries and search folding, but whether
  440px of preview is enough is a visual judgement.
