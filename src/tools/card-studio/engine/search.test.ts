import { describe, expect, it } from 'vitest'
import { matches, matchesText, normalise, normaliseLatin } from './search'

/**
 * The picker is the primary surface of the tool, and search is how people use
 * it. The corpus is vocalised Uthmani Arabic, so folding is not a nicety — it
 * is the difference between finding a dhikr and finding nothing.
 */
describe('normalise', () => {
  it('strips tashkeel so an unvocalised query matches', () => {
    expect(normalise('ٱلسَّتِغْفَارَ')).toBe('الستغفار')
    expect(normalise('الاستغفار')).toBe('الاستغفار')
  })

  it('unifies the alef family, including the Uthmani superscript alef', () => {
    for (const form of ['أستغفار', 'إستغفار', 'آستغفار', 'ٱستغفار', 'استغفار']) {
      expect(normalise(form), form).toBe('استغفار')
    }
  })

  it('unifies ya, ta marbuta and kaf variants', () => {
    expect(normalise('على')).toBe(normalise('علي'))
    // Ta marbuta (ة) folds to ha (ه); teh (ت) is a different letter and stays.
    expect(normalise('رحمة')).toBe(normalise('رحمه'))
    expect(normalise('رحمت')).not.toBe(normalise('رحمه'))
    expect(normalise('كبير')).toBe(normalise('کبیر'))
  })

  it('drops tatweel and superscript marks', () => {
    expect(normalise('الــلـه')).toBe('الله')
  })

  it('folds case and collapses whitespace', () => {
    expect(normalise('  Sayyid   AL-Istighfar ')).toBe('sayyid al-istighfar')
  })

  it('is idempotent', () => {
    const once = normalise('ٱلسَّبْحَانَ ٱللَّٰهُ')
    expect(normalise(once)).toBe(once)
  })

  it('leaves non-Arabic text intact', () => {
    expect(normalise('Bukhari 6306')).toBe('bukhari 6306')
  })
})

describe('normaliseLatin', () => {
  it('drops Latin diacritics and the typographic apostrophe', () => {
    expect(normaliseLatin('Kaddū')).toBe('kaddu')
    expect(normaliseLatin('Shāfi\u2018i')).toBe('shafii')
  })
})

describe('matches', () => {
  const haystacks = [
    'سيد الاستغفار',
    'Sayyid al-Istighfar',
    'Bukhari 6306',
    'Hisn ch. 27',
  ]

  it('matches unvocalised Arabic against vocalised corpus text', () => {
    expect(matches('الاستغفار', haystacks)).toBe(true)
    expect(matches('استغفار', haystacks)).toBe(true)
  })

  it('matches on the source, which the old filter omitted', () => {
    expect(matches('Bukhari 6306', haystacks)).toBe(true)
    expect(matches('hisn 27', haystacks)).toBe(true)
  })

  it('requires every term to match (AND, not OR)', () => {
    expect(matches('sayyid bukhari', haystacks)).toBe(true)
    expect(matches('sayyid sara', haystacks)).toBe(false)
  })

  it('treats an empty query as match-everything', () => {
    expect(matches('', haystacks)).toBe(true)
    expect(matches('   ', haystacks)).toBe(true)
  })

  it('does not match unrelated text', () => {
    expect(matches('subhanallah', haystacks)).toBe(false)
  })
})

describe('matchesText', () => {
  it('folds Latin accents so `Kaddu` finds `Kaddū`', () => {
    expect(matchesText('kaddu', ['Kaddū'])).toBe(true)
  })

  it('folds the typographic apostrophe in transliterated author names', () => {
    expect(matchesText('shafii', ['Imam al-Shafi\u2018i'])).toBe(true)
  })

  it('reaches Arabic quote text by typing Arabic, not transliteration', () => {
    // There is no transliteration table, so a Latin query cannot match Arabic
    // script. Folding is what makes the Arabic query work.
    expect(matchesText('الكد', ['\u0628\u0642\u062f\u0631 \u0627\u0644\u0643\u062f\u0651 \u062a\u064f\u0643\u062a\u0633\u0628'])).toBe(true)
  })

  it('folds Arabic at the same time, per term', () => {
    expect(matchesText('sayyid istighfar', ['سيد الاستغفار', 'Sayyid al-Istighfar'])).toBe(
      true,
    )
  })
})
