/**
 * Print sheet for Card Studio.
 *
 * The card is exported as an image and placed on a real page so a design can go
 * on a fridge or a mosque noticeboard. Print CSS lives in `src/styles/app.css`
 * and only activates while `body.printing-card-studio` is set, so nothing else
 * on the site is affected.
 */

export type PrintPaper = 'a5' | 'a4'

/** Page size in millimetres. */
const PAPER_MM: Record<PrintPaper, { w: number; h: number }> = {
  a5: { w: 148, h: 210 },
  a4: { w: 210, h: 297 },
}

/** The card occupies this share of the page width. */
const CARD_SCALE = 78

export function printModel(paper: PrintPaper) {
  return { paper, page: PAPER_MM[paper], scale: CARD_SCALE }
}

export function printStyles(model: ReturnType<typeof printModel>): string {
  return `
    .cs-print-sheet { width: ${model.page.w}mm; min-height: ${model.page.h}mm; margin: 0 auto; }
    .cs-print-image { width: ${model.scale}%; display: block; margin: 0 auto; }
    .cs-print-note { font-size: 8pt; line-height: 1.5; opacity: 0.8; break-inside: avoid; }
  `
}
