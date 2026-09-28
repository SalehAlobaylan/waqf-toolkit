/**
 * Curated Dua starter set, v1.
 *
 * A starter selection from Hisn al-Muslim, chapter 27 (morning & evening),
 * carried over verbatim from the same in-repo curation as the Adhkar
 * Companion. Quranic passages are deliberately excluded: Quran blocks come
 * from the Tanzil dataset only, so sacred text has exactly one source of
 * record (METHODOLOGY.md).
 *
 * Arabic strings are immutable source material: never normalized,
 * spell-checked, or edited by code. Source citations are candidates —
 * a domain reviewer verifies each before this tool leaves experimental.
 */

export type DuaEntry = {
  id: string
  titleEn: string
  titleAr: string
  arabic: string
  source: string
  hisnRef: string
}

export const DUA_DATASET_VERSION = '1.0.0'

export const HISN_DUAS: DuaEntry[] = [
  {
    "id": "sayyid-istighfar",
    "titleEn": "Sayyid al-Istighfar",
    "titleAr": "سيد الاستغفار",
    "arabic": "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    "source": "Bukhari 6306",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "subhanallah-wa-bihamdihi",
    "titleEn": "SubhanAllahi wa bihamdihi",
    "titleAr": "سبحان الله وبحمده",
    "arabic": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    "source": "Muslim 2692",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "tahlil-ten",
    "titleEn": "Tahlil — ten times",
    "titleAr": "التهليل — عشر مرات",
    "arabic": "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    "source": "Abu Dawud 5077",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "hasbiyallahu",
    "titleEn": "HasbiyAllahu",
    "titleAr": "حسبي الله",
    "arabic": "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    "source": "Abu Dawud 5081",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "bismillahilladhi",
    "titleEn": "Bismillahilladhi la yadurru",
    "titleAr": "بسم الله الذي لا يضر",
    "arabic": "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    "source": "Tirmidhi 3388",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "raditu-billah",
    "titleEn": "Raditu billahi rabban",
    "titleAr": "رضيت بالله ربًا",
    "arabic": "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
    "source": "Abu Dawud 5072",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "allahumma-a-inni",
    "titleEn": "Allahumma a’inni",
    "titleAr": "اللهم أعني",
    "arabic": "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
    "source": "Abu Dawud 1522",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "asbahna",
    "titleEn": "Asbahna (morning)",
    "titleAr": "أصبحنا (الصباح)",
    "arabic": "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    "source": "Abu Dawud 5071",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "amsayna",
    "titleEn": "Amsayna (evening)",
    "titleAr": "أمسينا (المساء)",
    "arabic": "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    "source": "Abu Dawud 5071",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "subhanallah-33",
    "titleEn": "SubhanAllah ×33",
    "titleAr": "سبحان الله ×33",
    "arabic": "سُبْحَانَ اللَّهِ",
    "source": "Muslim 596",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "alhamdulillah-33",
    "titleEn": "Alhamdulillah ×33",
    "titleAr": "الحمد لله ×33",
    "arabic": "الْحَمْدُ لِلَّهِ",
    "source": "Muslim 596",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "allahu-akbar-34",
    "titleEn": "Allahu Akbar ×34",
    "titleAr": "الله أكبر ×34",
    "arabic": "اللَّهُ أَكْبَرُ",
    "source": "Muslim 596",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "audhu-kalimatillah",
    "titleEn": "A’udhu bi kalimatillah",
    "titleAr": "أعوذ بكلمات الله",
    "arabic": "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    "source": "Muslim 2708",
    "hisnRef": "Hisn ch. 27"
  },
  {
    "id": "allahumma-bika-asbahna",
    "titleEn": "Allahumma bika asbahna",
    "titleAr": "اللهم بك أصبحنا",
    "arabic": "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
    "source": "Tirmidhi 3391",
    "hisnRef": "Hisn ch. 27"
  }
]

/** FNV-1a over the immutable Arabic strings; CI pins the value (data.test.ts). */
export function duaChecksum(): string {
  let hash = 0x811c9dc5
  const body = HISN_DUAS.map((d) => `${d.id}:${d.source}:${d.arabic}`).join('\n')
  for (let i = 0; i < body.length; i++) {
    hash ^= body.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}
