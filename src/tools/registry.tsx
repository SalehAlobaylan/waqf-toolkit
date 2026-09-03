import type { ComponentType } from 'react'
import LinkCleanerTry from './link-cleaner/link-cleaner-try'
import QiblaTry from './qibla-finder/qibla-try'
import PrayerTimesTry from './prayer-times/prayer-times-try'
import HijriConverterTry from './hijri-converter/hijri-converter-try'
import ZakatCalculatorTry from './zakat-calculator/zakat-calculator-try'

/**
 * In-app runnable tool interfaces, keyed by catalog slug.
 *
 * A tool appears here only when it is usable end-to-end on this site;
 * its catalog entry must set `tryRoute: true`.
 */
export const TOOL_INTERFACES: Record<string, ComponentType> = {
  'link-cleaner': LinkCleanerTry,
  'qibla-finder': QiblaTry,
  'prayer-times-widget': PrayerTimesTry,
  'hijri-converter': HijriConverterTry,
  'zakat-calculator': ZakatCalculatorTry,
}
