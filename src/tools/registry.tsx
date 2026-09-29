import type { ComponentType } from 'react'
import QiblaTry from './qibla-finder/qibla-try'
import AdhkarTry from './adhkar-companion/adhkar-try'
import PrayerTimesTry from './prayer-times/prayer-times-try'
import HijriConverterTry from './hijri-converter/hijri-converter-try'
import ZakatCalculatorTry from './zakat-calculator/zakat-calculator-try'
import CardStudioTry from './card-studio/card-studio-try'

/**
 * Runnable tool components, keyed by catalog slug.
 *
 * Components only. *Shape* — template, panes, source directory — lives in
 * `@/lib/panes` (`TOOL_LAYOUTS`), which each tool also reads, so a tool can
 * render its own `Workspace` and action bar without importing this module and
 * creating a cycle.
 *
 * A slug appears here only when its interface is usable end-to-end on this
 * site. Tools absent from this map render the document template instead.
 * `data/tools.test.ts` keeps the two maps in step.
 */
export const TOOL_COMPONENTS: Record<string, ComponentType> = {
  'adhkar-companion': AdhkarTry,
  'qibla-finder': QiblaTry,
  'prayer-times-widget': PrayerTimesTry,
  'hijri-converter': HijriConverterTry,
  'zakat-calculator': ZakatCalculatorTry,
  'card-studio': CardStudioTry,
}
