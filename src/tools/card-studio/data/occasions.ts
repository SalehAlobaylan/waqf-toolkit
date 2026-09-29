/**
 * Occasion collections — curated *combinations* of already-verified dataset
 * references (never new text). They are suggestions, not content: every item
 * still resolves through the checksummed datasets at render time.
 */

import type { CardBlockSpec } from '../types'
import { HISN_DUAS } from './duas'

export type Occasion = {
  id: string
  nameEn: string
  nameAr: string
  /** Why this set is offered — shown in the picker. */
  hintEn: string
  hintAr: string
  /** Up to 3 blocks, matching the card limit. */
  blocks: CardBlockSpec[]
}

const exists = (id: string) => HISN_DUAS.some((dua) => dua.id === id)

function dua(id: string): CardBlockSpec | null {
  return exists(id) ? { kind: 'dua', duaId: id } : null
}

function ayah(surah: number, ayahStart: number, ayahEnd = ayahStart): CardBlockSpec {
  return { kind: 'ayah', surah, ayahStart, ayahEnd }
}

function only(parts: (CardBlockSpec | null)[]): CardBlockSpec[] {
  return parts.filter((part): part is CardBlockSpec => part !== null).slice(0, 3)
}

export const OCCASIONS: Occasion[] = [
  {
    id: 'morning',
    nameEn: 'Morning',
    nameAr: 'الصباح',
    hintEn: 'A short set for the start of the day.',
    hintAr: 'مجموعة قصيرة لبداية اليوم.',
    blocks: only([
      dua('hasbiyallahu'),
      dua('allahumma-a-inni'),
      dua('subhanallah-wa-bihamdihi'),
    ]),
  },
  {
    id: 'evening',
    nameEn: 'Evening',
    nameAr: 'المساء',
    hintEn: 'A quiet set for the end of the day.',
    hintAr: 'مجموعة هادئة لنهاية اليوم.',
    blocks: only([dua('audhu-kalimatillah'), dua('amsayna'), dua('raditu-billah')]),
  },
  {
    id: 'forgiveness',
    nameEn: 'Forgiveness',
    nameAr: 'المغفرة',
    hintEn: 'Seeking pardon — the master supplication and refuge.',
    hintAr: 'طلب المغفرة — سيد الاستغفار والاستعاذة.',
    blocks: only([dua('sayyid-istighfar'), dua('audhu-kalimatillah')]),
  },
  {
    id: 'tasbeeh',
    nameEn: 'Tasbeeh',
    nameAr: 'التسبيح',
    hintEn: 'Short phrases that suit a counter or a card.',
    hintAr: 'عبارات قصيرة تصلح للمسبحة أو البطاقة.',
    blocks: only([dua('subhanallah-33'), dua('alhamdulillah-33'), dua('allahu-akbar-34')]),
  },
  {
    id: 'after-salah',
    nameEn: 'After salah',
    nameAr: 'بعد الصلاة',
    hintEn: 'Remembrance recited when the prayer ends.',
    hintAr: 'أذكار تُقال عند السلام من الصلاة.',
    blocks: only([dua('subhanallah-wa-bihamdihi'), dua('raditu-billah')]),
  },
  {
    id: 'travel',
    nameEn: 'Travel',
    nameAr: 'السفر',
    hintEn: 'A supplication for setting out.',
    hintAr: 'دعاء لرحلة.',
    blocks: only([ayah(2, 208), dua('bismillahilladhi')]),
  },
  {
    id: 'protection',
    nameEn: 'Protection',
    nameAr: 'الحفظ',
    hintEn: 'Ayat al-Kursi and the protective words.',
    hintAr: 'آية الكرسي وكلمات الحماية.',
    blocks: only([ayah(2, 255), dua('audhu-kalimatillah')]),
  },
  {
    id: 'gratitude',
    nameEn: 'Gratitude',
    nameAr: 'الشكر',
    hintEn: 'Praise and thanksgiving in one card.',
    hintAr: 'الحمد والشكر في بطاقة واحدة.',
    blocks: only([ayah(14, 7), dua('subhanallah-wa-bihamdihi')]),
  },
  {
    id: 'long-verse',
    nameEn: 'Long verse',
    nameAr: 'آية طويلة',
    hintEn: 'The longest ayah — the typography stress test.',
    hintAr: 'أطول آية — اختبار أصعب للإخراج.',
    blocks: only([ayah(2, 282)]),
  },
  {
    id: 'joy',
    nameEn: 'Joy',
    nameAr: 'الفرح',
    hintEn: 'A reminder that happiness is with Allah.',
    hintAr: 'تذكير بأن الفرح مع الله.',
    blocks: only([dua('hasbiyallahu')]),
  },
]

export function getOccasion(id: string): Occasion | undefined {
  return OCCASIONS.find((occasion) => occasion.id === id)
}
