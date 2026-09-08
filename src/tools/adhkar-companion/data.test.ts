import { describe, expect, it } from 'vitest'
import { DATASET_VERSION, DHIKR, datasetChecksum } from './adhkar-data'

const EXPECTED: Array<{ id: string; target: number; opens: string; source: string }> = [
  { id: 'ayat-al-kursi', target: 1, opens: 'اللَّهُ لَا إِلَهَ', source: 'Quran 2:255' },
  { id: 'surah-ikhlas', target: 3, opens: 'قُلْ هُوَ اللَّهُ', source: 'Abu Dawud 5082' },
  { id: 'surah-falaq', target: 3, opens: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', source: 'Abu Dawud 5082' },
  { id: 'surah-nas', target: 3, opens: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', source: 'Abu Dawud 5082' },
  { id: 'sayyid-istighfar', target: 1, opens: 'اللَّهُمَّ أَنْتَ رَبِّي', source: 'Bukhari 6306' },
  { id: 'subhanallah-wa-bihamdihi', target: 100, opens: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', source: 'Muslim 2692' },
  { id: 'tahlil-ten', target: 10, opens: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ', source: 'Abu Dawud 5077' },
  { id: 'hasbiyallahu', target: 7, opens: 'حَسْبِيَ اللَّهُ', source: 'Abu Dawud 5081' },
  { id: 'bismillahilladhi', target: 3, opens: 'بِسْمِ اللَّهِ الَّذِي', source: 'Tirmidhi 3388' },
  { id: 'raditu-billah', target: 3, opens: 'رَضِيتُ بِاللَّهِ', source: 'Abu Dawud 5072' },
  { id: 'allahumma-a-inni', target: 1, opens: 'اللَّهُمَّ أَعِنِّي', source: 'Abu Dawud 1522' },
  { id: 'asbahna', target: 1, opens: 'أَصْبَحْنَا وَأَصْبَحَ', source: 'Abu Dawud 5071' },
  { id: 'amsayna', target: 1, opens: 'أَمْسَيْنَا وَأَمْسَى', source: 'Abu Dawud 5071' },
  { id: 'subhanallah-33', target: 33, opens: 'سُبْحَانَ اللَّهِ', source: 'Muslim 596' },
  { id: 'alhamdulillah-33', target: 33, opens: 'الْحَمْدُ لِلَّهِ', source: 'Muslim 596' },
  { id: 'allahu-akbar-34', target: 34, opens: 'اللَّهُ أَكْبَرُ', source: 'Muslim 596' },
  { id: 'audhu-kalimatillah', target: 3, opens: 'أَعُوذُ بِكَلِمَاتِ', source: 'Muslim 2708' },
  { id: 'allahumma-bika-asbahna', target: 1, opens: 'اللَّهُمَّ بِكَ أَصْبَحْنَا', source: 'Tirmidhi 3391' },
]

describe('adhkar dataset integrity', () => {
  it('pins version and item count', () => {
    expect(DATASET_VERSION).toBe('1.0.0')
    expect(DHIKR).toHaveLength(18)
  })

  it('ids are unique kebab-case with valid sets and targets', () => {
    const ids = DHIKR.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const d of DHIKR) {
      expect(d.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(d.sets.length).toBeGreaterThan(0)
      for (const s of d.sets) expect(['morning', 'evening']).toContain(s)
      expect(Number.isInteger(d.target) && d.target >= 1).toBe(true)
      expect(d.arabic.trim()).not.toBe('')
      expect(d.meaningEn.trim()).not.toBe('')
      expect(d.meaningAr.trim()).not.toBe('')
      expect(d.titleEn.trim()).not.toBe('')
      expect(d.titleAr.trim()).not.toBe('')
      expect(d.source.trim()).not.toBe('')
      expect(d.hisnRef.trim()).not.toBe('')
    }
  })

  it('exact spot-checks: id, target, source, opening words', () => {
    for (const e of EXPECTED) {
      const found = DHIKR.find((d) => d.id === e.id)
      expect(found, `missing ${e.id}`).toBeDefined()
      expect(found!.target).toBe(e.target)
      expect(found!.source).toBe(e.source)
      expect(found!.arabic.startsWith(e.opens), `${e.id} opening changed`).toBe(true)
    }
  })

  it('checksum is deterministic and well-formed (tamper-evident)', () => {
    const a = datasetChecksum()
    const b = datasetChecksum()
    expect(a).toBe(b)
    expect(a).toMatch(/^fnv1a-[0-9a-f]{8}$/)
  })
})
