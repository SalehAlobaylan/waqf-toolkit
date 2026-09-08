import type { Dhikr } from './types'

/**
 * Curated morning/evening dataset, v1.
 *
 * Arabic strings are immutable source material: stored verbatim, never
 * normalized or spell-checked by code (see METHODOLOGY.md §4). English/Arabic
 * `meaning*` lines are plain-language UI hints, NOT scholarly translations —
 * the Arabic is authoritative and every export says so.
 *
 * `source` numbers are candidates copied from Hisn al-Muslim's citations.
 * They ship as `experimental` and must be verified by a domain reviewer
 * before this tool leaves experimental (METHODOLOGY.md §7).
 */
export const DATASET_VERSION = '1.0.0'

export const DHIKR: Dhikr[] = [
  {
    id: 'ayat-al-kursi',
    sets: ['morning', 'evening'],
    titleEn: 'Ayat al-Kursi',
    titleAr: 'آية الكرسي',
    arabic:
      'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    meaningEn: 'The Verse of the Throne — recite once, morning and evening.',
    meaningAr: 'آية الكرسي — تُقرأ مرة في الصباح والمساء.',
    target: 1,
    source: 'Quran 2:255',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'surah-ikhlas',
    sets: ['morning', 'evening'],
    titleEn: 'Surah al-Ikhlas',
    titleAr: 'سورة الإخلاص',
    arabic:
      'قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
    meaningEn: '“Say: He is Allah, the One…” — three times.',
    meaningAr: '«قل هو الله أحد…» — ثلاث مرات.',
    target: 3,
    source: 'Abu Dawud 5082',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'surah-falaq',
    sets: ['morning', 'evening'],
    titleEn: 'Surah al-Falaq',
    titleAr: 'سورة الفلق',
    arabic:
      'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ',
    meaningEn: '“Say: I seek refuge with the Lord of the daybreak…” — three times.',
    meaningAr: '«قل أعوذ برب الفلق…» — ثلاث مرات.',
    target: 3,
    source: 'Abu Dawud 5082',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'surah-nas',
    sets: ['morning', 'evening'],
    titleEn: 'Surah an-Nas',
    titleAr: 'سورة الناس',
    arabic:
      'قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ',
    meaningEn: '“Say: I seek refuge with the Lord of mankind…” — three times.',
    meaningAr: '«قل أعوذ برب الناس…» — ثلاث مرات.',
    target: 3,
    source: 'Abu Dawud 5082',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'sayyid-istighfar',
    sets: ['morning', 'evening'],
    titleEn: 'Sayyid al-Istighfar',
    titleAr: 'سيد الاستغفار',
    arabic:
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    meaningEn: 'The master of seeking forgiveness — once with a present heart.',
    meaningAr: 'سيد الاستغفار — مرة واحدة بحضور قلب.',
    target: 1,
    source: 'Bukhari 6306',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'subhanallah-wa-bihamdihi',
    sets: ['morning', 'evening'],
    titleEn: 'SubhanAllahi wa bihamdihi',
    titleAr: 'سبحان الله وبحمده',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    meaningEn: '“Glory be to Allah and praise Him” — one hundred times.',
    meaningAr: '«سبحان الله وبحمده» — مئة مرة.',
    target: 100,
    source: 'Muslim 2692',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'tahlil-ten',
    sets: ['morning', 'evening'],
    titleEn: 'Tahlil — ten times',
    titleAr: 'التهليل — عشر مرات',
    arabic:
      'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    meaningEn: '“None has the right to be worshipped but Allah alone…” — ten times.',
    meaningAr: '«لا إله إلا الله وحده لا شريك له…» — عشر مرات.',
    target: 10,
    source: 'Abu Dawud 5077',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'hasbiyallahu',
    sets: ['morning', 'evening'],
    titleEn: 'HasbiyAllahu',
    titleAr: 'حسبي الله',
    arabic:
      'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    meaningEn: '“Allah is sufficient for me…” — seven times.',
    meaningAr: '«حسبي الله لا إله إلا هو…» — سبع مرات.',
    target: 7,
    source: 'Abu Dawud 5081',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'bismillahilladhi',
    sets: ['morning', 'evening'],
    titleEn: 'Bismillahilladhi la yadurru',
    titleAr: 'بسم الله الذي لا يضر',
    arabic:
      'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    meaningEn: '“In the name of Allah, with whose name nothing harms…” — three times.',
    meaningAr: '«بسم الله الذي لا يضر مع اسمه شيء…» — ثلاث مرات.',
    target: 3,
    source: 'Tirmidhi 3388',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'raditu-billah',
    sets: ['morning', 'evening'],
    titleEn: 'Raditu billahi rabban',
    titleAr: 'رضيت بالله ربًا',
    arabic:
      'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
    meaningEn: '“I am pleased with Allah as Lord, Islam as religion, Muhammad as Prophet” — three times.',
    meaningAr: '«رضيت بالله ربًا وبالإسلام دينًا وبمحمد نبيًا» — ثلاث مرات.',
    target: 3,
    source: 'Abu Dawud 5072',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'allahumma-a-inni',
    sets: ['morning', 'evening'],
    titleEn: 'Allahumma a’inni',
    titleAr: 'اللهم أعني',
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    meaningEn: '“O Allah, help me remember You, thank You, and worship You well” — once.',
    meaningAr: '«اللهم أعني على ذكرك وشكرك وحسن عبادتك» — مرة واحدة.',
    target: 1,
    source: 'Abu Dawud 1522',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'asbahna',
    sets: ['morning'],
    titleEn: 'Asbahna (morning)',
    titleAr: 'أصبحنا (الصباح)',
    arabic:
      'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    meaningEn: '“We have reached the morning, and dominion belongs to Allah…” — once.',
    meaningAr: '«أصبحنا وأصبح الملك لله…» — مرة واحدة.',
    target: 1,
    source: 'Abu Dawud 5071',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'amsayna',
    sets: ['evening'],
    titleEn: 'Amsayna (evening)',
    titleAr: 'أمسينا (المساء)',
    arabic:
      'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    meaningEn: '“We have reached the evening, and dominion belongs to Allah…” — once.',
    meaningAr: '«أمسينا وأمسى الملك لله…» — مرة واحدة.',
    target: 1,
    source: 'Abu Dawud 5071',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'subhanallah-33',
    sets: ['morning', 'evening'],
    titleEn: 'SubhanAllah ×33',
    titleAr: 'سبحان الله ×33',
    arabic: 'سُبْحَانَ اللَّهِ',
    meaningEn: '“Glory be to Allah” — thirty-three times.',
    meaningAr: '«سبحان الله» — ثلاث وثلاثون مرة.',
    target: 33,
    source: 'Muslim 596',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'alhamdulillah-33',
    sets: ['morning', 'evening'],
    titleEn: 'Alhamdulillah ×33',
    titleAr: 'الحمد لله ×33',
    arabic: 'الْحَمْدُ لِلَّهِ',
    meaningEn: '“Praise be to Allah” — thirty-three times.',
    meaningAr: '«الحمد لله» — ثلاث وثلاثون مرة.',
    target: 33,
    source: 'Muslim 596',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'allahu-akbar-34',
    sets: ['morning', 'evening'],
    titleEn: 'Allahu Akbar ×34',
    titleAr: 'الله أكبر ×34',
    arabic: 'اللَّهُ أَكْبَرُ',
    meaningEn: '“Allah is Greatest” — thirty-four times.',
    meaningAr: '«الله أكبر» — أربع وثلاثون مرة.',
    target: 34,
    source: 'Muslim 596',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'audhu-kalimatillah',
    sets: ['evening'],
    titleEn: 'A’udhu bi kalimatillah',
    titleAr: 'أعوذ بكلمات الله',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    meaningEn: '“I seek refuge in the perfect words of Allah from the evil of what He created” — three times.',
    meaningAr: '«أعوذ بكلمات الله التامات من شر ما خلق» — ثلاث مرات.',
    target: 3,
    source: 'Muslim 2708',
    hisnRef: 'Hisn ch. 27',
  },
  {
    id: 'allahumma-bika-asbahna',
    sets: ['morning'],
    titleEn: 'Allahumma bika asbahna',
    titleAr: 'اللهم بك أصبحنا',
    arabic:
      'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
    meaningEn: '“O Allah, by You we enter the morning and evening…” — once.',
    meaningAr: '«اللهم بك أصبحنا وبك أمسينا…» — مرة واحدة.',
    target: 1,
    source: 'Tirmidhi 3391',
    hisnRef: 'Hisn ch. 27',
  },
]

/** Simple FNV-1a checksum over the immutable Arabic strings. CI regression test pins it. */
export function datasetChecksum(): string {
  let hash = 0x811c9dc5
  const body = DHIKR.map((d) => `${d.id}:${d.target}:${d.arabic}`).join('\n')
  for (let i = 0; i < body.length; i++) {
    hash ^= body.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}
