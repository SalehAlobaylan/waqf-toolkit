import type { Locale } from '@/i18n'

export type ToolStatus = 'available' | 'experimental' | 'planned' | 'archived'
export type ToolCategory = 'Media' | 'Privacy' | 'Documents' | 'Everyday'

/**
 * Where a tool's processing happens. Disclosed on every tool page:
 * - `browser`   — everything runs in the user's browser; no uploads.
 * - `server`    — processed by our own server (server functions/proxy).
 * - `cloud-api` — data is sent to a named third-party service.
 */
export type ToolProcessing = 'browser' | 'server' | 'cloud-api'

/**
 * Locale-specific display text for a tool. The English copy lives directly on
 * the tool; every other supported locale is required under `translations`.
 */
export type ToolTranslation = {
  name: string
  shortDescription: string
  description: string
  processingNote: string
}

export type Tool = {
  slug: string
  name: string
  shortDescription: string
  description: string
  category: ToolCategory
  status: ToolStatus
  license: string
  stack: string[]
  /** Where processing happens — surfaced verbatim alongside processingNote. */
  processing: ToolProcessing
  /** Third-party services involved when `processing` is `cloud-api`. */
  providers?: string[]
  /** Plain-language statement of exactly where data goes. */
  processingNote: string
  translations: { ar: ToolTranslation }
  supportedFormats: string[]
  featured: boolean
  /** The tool has a runnable in-app interface at /tools/<slug>/try. */
  tryRoute?: boolean
  /** Roadmap issue tracking this tool's development. */
  trackingIssue?: number
  updatedAt: string
  /** Set once the project repository is public. */
  repoUrl?: string
}

export const CATEGORIES: ToolCategory[] = [
  'Media',
  'Privacy',
  'Documents',
  'Everyday',
]

export const STATUS_ORDER: ToolStatus[] = [
  'available',
  'experimental',
  'planned',
  'archived',
]

/**
 * Tool catalog.
 *
 * Rules for editing this file:
 * - Only set `status: 'available'` when the tool is usable end-to-end here
 *   on the site.
 * - `repoUrl` must point at a real, public repository.
 * - Every tool is a web tool: reachable in the browser, nothing to install.
 * - `processing` + `processingNote` must state exactly where data goes
 *   (the user's browser, our server, or a named third-party API). Never
 *   imply local-only handling unless it is actually true.
 * - Every tool ships with an Arabic translation under `translations.ar`.
 */
export const TOOLS: Tool[] = [
  {
    slug: 'video-music-remover',
    trackingIssue: 1,
    name: 'Video Music Remover',
    shortDescription: 'Remove background music from a video, right in your browser.',
    description:
      'Separates speech and background music in a video so you can keep the voice track and work with a cleaner source.',
    category: 'Media',
    status: 'archived',
    license: 'AGPL-3.0',
    stack: ['Python', 'FFmpeg', 'Demucs'],
    processing: 'browser',
    processingNote:
      'Processing happens inside your browser session — nothing is uploaded. If a future version adds cloud assistance, this note will say exactly what is sent.',
    translations: {
      ar: {
        name: 'إزالة الموسيقى من الفيديو',
        shortDescription: 'إزالة موسيقى الخلفية من الفيديو، مباشرة داخل متصفحك.',
        description:
          'فصل الكلام عن موسيقى الخلفية في مقطع الفيديو، للاحتفاظ بمسار الصوت والعمل على مصدر أنظف.',
        processingNote:
          'تتم المعالجة داخل جلسة متصفحك — لا يُرفع أي شيء. إن أُضيفت معالجة سحابية مستقبلاً، ستوضّح هذه الملاحظة بالضبط ما يُرسَل وإلى أين.',
      },
    },
    supportedFormats: ['MP4', 'MOV', 'WebM'],
    featured: false,
    updatedAt: '2026-08-10',
  },
  {
    slug: 'subtitle-cleaner',
    trackingIssue: 8,
    name: 'Subtitle Cleaner',
    shortDescription:
      'Clean subtitle files without changing their meaning.',
    description:
      'Fix timing gaps, duplicate lines, and formatting noise in subtitle files. Keep the words, lose the clutter.',
    category: 'Media',
    status: 'archived',
    license: 'GPL-3.0',
    stack: ['Rust', 'WebAssembly'],
    processing: 'browser',
    processingNote:
      'Subtitles are parsed in your browser — the file never leaves it.',
    translations: {
      ar: {
        name: 'تنظيف ملفات الترجمة النصية',
        shortDescription: 'تنظيف ملفات الترجمة النصية دون المساس بالمعنى.',
        description:
          'صحّح فجوات التوقيت والأسطر المكررة وشوائب التنسيق في ملفات الترجمة. تبقى الكلمات كما هي، ويذهب العشواء.',
        processingNote:
          'تُقرأ ملفات الترجمة داخل متصفحك — لا يغادر الملف متصفحك أبداً.',
      },
    },
    supportedFormats: ['SRT', 'VTT', 'ASS'],
    featured: false,
    updatedAt: '2026-07-28',
  },
  {
    slug: 'image-metadata-remover',
    trackingIssue: 2,
    name: 'Image Metadata Remover',
    shortDescription:
      'Remove hidden metadata from images before sharing them.',
    description:
      'Inspect and remove EXIF details such as location, device model, and timestamps. A small step worth taking before an image leaves your hands.',
    category: 'Privacy',
    status: 'archived',
    license: 'MIT',
    stack: ['TypeScript', 'Web Workers'],
    processing: 'browser',
    processingNote:
      'Planned to run entirely in your browser: images are read and rewritten locally, with no network request.',
    translations: {
      ar: {
        name: 'إزالة البيانات الوصفية من الصور',
        shortDescription: 'إزالة البيانات الوصفية المخفية من الصور قبل مشاركتها.',
        description:
          'افحص بيانات EXIF واحذفها — كالموقع الجغرافي وطراز الجهاز وأوقات الالتقاط — قبل أن تغادر الصورة يديك. خطوة صغيرة تستحق العناء.',
        processingNote:
          'مخطط لها أن تعمل داخل متصفحك بالكامل: تُقرأ الصور وتُعاد كتابتها محلياً، دون أي طلب شبكة.',
      },
    },
    supportedFormats: ['JPG', 'PNG', 'HEIC'],
    featured: false,
    updatedAt: '2026-07-15',
  },
  {
    slug: 'video-face-blur',
    trackingIssue: 3,
    name: 'Video Face Blur',
    shortDescription: 'Blur faces, screens, and sensitive areas in video.',
    description:
      'A careful video privacy pass for community footage. Mark areas frame by frame, then export a copy with those regions blurred.',
    category: 'Privacy',
    status: 'archived',
    license: 'MIT',
    stack: ['TypeScript', 'WebCodecs', 'OpenCV'],
    processing: 'browser',
    processingNote:
      'Designed to run in your browser during the experiment. Experimental builds may be slower.',
    translations: {
      ar: {
        name: 'تشويش الوجوه في الفيديو',
        shortDescription: 'تشويش الوجوه والشاشات والمواضع الحساسة في الفيديو.',
        description:
          'خطوة خصوصية دقيقة لمقاطع المجتمع. حدّد المواضع إطاراً بإطار، ثم صدّر نسخة تكون تلك المناطق فيها مموّهة.',
        processingNote:
          'صُممت لتعمل داخل متصفحك خلال المرحلة التجريبية. النسخ التجريبية قد تكون أبطأ.',
      },
    },
    supportedFormats: ['MP4', 'MOV'],
    featured: false,
    updatedAt: '2026-07-02',
  },
  {
    slug: 'pdf-merger',
    trackingIssue: 4,
    name: 'PDF Merger',
    shortDescription: 'Merge and reorder PDFs into one document.',
    description:
      'Combine scanned pages and separate PDFs into one ordered document, then rearrange pages until it reads correctly.',
    category: 'Documents',
    status: 'archived',
    license: 'MIT',
    stack: ['TypeScript', 'PDF.js'],
    processing: 'browser',
    processingNote:
      'Merging will happen in your browser — PDFs are not uploaded.',
    translations: {
      ar: {
        name: 'دمج ملفات PDF',
        shortDescription: 'دمج ملفات PDF وإعادة ترتيبها في مستند واحد.',
        description:
          'اجمع الصفحات الممسوحة ضوئياً وملفات PDF المنفصلة في مستند واحد مرتّب، ثم أعد ترتيب الصفحات حتى يستقيم القراءة.',
        processingNote:
          'سيتم الدمج داخل متصفحك — لا تُرفع ملفات PDF.',
      },
    },
    supportedFormats: ['PDF'],
    featured: false,
    updatedAt: '2026-06-20',
  },
  {
    slug: 'pdf-extractor',
    trackingIssue: 5,
    name: 'PDF Page & Text Extractor',
    shortDescription: 'Extract pages and text from a PDF in your browser.',
    description:
      'A focused PDF workbench for splitting pages, extracting text, and preparing documents for a handoff.',
    category: 'Documents',
    status: 'archived',
    license: 'MPL-2.0',
    stack: ['TypeScript', 'PDF.js'],
    processing: 'browser',
    processingNote:
      'Planned as an in-browser workbench: split pages and extract text without uploading anything.',
    translations: {
      ar: {
        name: 'استخراج صفحات PDF ونصوصها',
        shortDescription: 'استخراج الصفحات والنصوص من ملف PDF داخل متصفحك.',
        description:
          'مساحة عمل مركّزة لملفات PDF: تقسيم الصفحات، واستخراج النصوص، وتجهيز المستندات للتسليم.',
        processingNote:
          'مخطط لها كمساحة عمل داخل المتصفح: قسّم الصفحات واستخرج النصوص دون رفع أي شيء.',
      },
    },
    supportedFormats: ['PDF'],
    featured: false,
    updatedAt: '2026-06-05',
  },
  {
    slug: 'audio-trimmer-converter',
    trackingIssue: 6,
    name: 'Audio Trimmer & Converter',
    shortDescription: 'Trim and convert audio right in your browser.',
    description:
      'Cut silence, trim clips, and convert between common audio formats. Built for long lecture recordings that other tools struggle with.',
    category: 'Media',
    status: 'archived',
    license: 'MIT',
    stack: ['TypeScript', 'Web Audio API'],
    processing: 'browser',
    processingNote:
      'Trimming and conversion will run in your browser — the audio never leaves it.',
    translations: {
      ar: {
        name: 'اقتطاب الصوت وتحويل صيغه',
        shortDescription: 'اقتطاب المقاطع الصوتية وتحويل صيغها داخل متصفحك.',
        description:
          'احذف فترات الصمت، واقتطاب المقاطع، وحوّل بين صيغ الصوت الشائعة. صُمّمت للمحاضرات الطويلة التي تعجز عنها أدوات أخرى.',
        processingNote:
          'سيتم الاقتطاب والتحويل داخل متصفحك — لا يغادر الصوت متصفحك أبداً.',
      },
    },
    supportedFormats: ['MP3', 'M4A', 'WAV', 'OGG'],
    featured: false,
    updatedAt: '2026-05-22',
  },
  {
    slug: 'image-redaction',
    trackingIssue: 7,
    name: 'Image Redaction',
    shortDescription: 'Blur or cover sensitive areas in screenshots.',
    description:
      'Obscure names, messages, and private details in images before sharing them publicly. Quick selection tools with sensible defaults.',
    category: 'Privacy',
    status: 'archived',
    license: 'MIT',
    stack: ['TypeScript', 'Canvas API'],
    processing: 'browser',
    processingNote: 'Editing will happen entirely in your browser.',
    translations: {
      ar: {
        name: 'تغطية المواضع الحساسة في الصور',
        shortDescription: 'تشويش أو تغطية المواضع الحساسة في لقطات الشاشة.',
        description:
          'إخفاء الأسماء والرسائل والتفاصيل الخاصة في الصور قبل نشرها علناً، بأدوات تحديد سريعة وخيارات افتراضية معقولة.',
        processingNote:
          'سيتم التحرير داخل متصفحك بالكامل.',
      },
    },
    supportedFormats: ['PNG', 'JPG', 'WebP'],
    featured: false,
    updatedAt: '2026-05-10',
  },
  {
    slug: 'link-cleaner',
    name: 'Link Cleaner',
    shortDescription: 'Clean tracking parameters out of shared links.',
    description:
      'Strip click-tracking and surveillance parameters from URLs before you share them. Paste, clean, copy.',
    category: 'Everyday',
    status: 'available',
    license: 'Apache-2.0',
    stack: ['TypeScript'],
    processing: 'browser',
    processingNote:
      'Links are cleaned entirely in your browser. Nothing is sent anywhere.',
    translations: {
      ar: {
        name: 'تنظيف الروابط من التتبّع',
        shortDescription: 'تنظيف معاملات التتبّع من الروابط المشتركة.',
        description:
          'احذف معاملات تتبّع النقرات والمراقبة من الروابط قبل مشاركتها. الصق، نظّف، انسخ.',
        processingNote:
          'تُنظَّف الروابط داخل متصفحك بالكامل. لا يُرسل شيء إلى أي جهة.',
      },
    },
    supportedFormats: [],
    featured: true,
    tryRoute: true,
    updatedAt: '2026-08-01',
    // First shipped utility lives inside this repository under src/tools/link-cleaner.
    repoUrl: 'https://github.com/SalehAlobaylan/waqf-toolkit',
  },
  {
    slug: 'qibla-finder',
    trackingIssue: 9,
    name: 'Qibla Finder',
    shortDescription: 'Find the direction to the Kaaba — true-north bearing, no compass required.',
    description:
      'Enter any location or use your device, see the initial great-circle bearing to the Kaaba clockwise from true north, and align a static dial with a trusted true-north reference.',
    category: 'Everyday',
    status: 'experimental',
    license: 'Apache-2.0',
    stack: ['TypeScript'],
    processing: 'browser',
    processingNote:
      'Bearing is calculated in your browser — coordinates are not stored or sent anywhere. No map or network request.',
    translations: {
      ar: {
        name: 'اتجاه القبلة',
        shortDescription: 'اعرف اتجاه الكعبة — زاوية من الشمال الحقيقي، دون الحاجة إلى بوصلة.',
        description:
          'أدخل أي موقع أو استخدم جهازك لمعرفة زاوية الدائرة العظمى إلى الكعبة باتجاه عقارب الساعة من الشمال الحقيقي، وطابق قرصاً ثابتاً مع مرجع موثوق للشمال الحقيقي.',
        processingNote:
          'يُحسب الاتجاه داخل متصفحك — لا تُخزّن الإحداثيات ولا تُرسل إلى أي جهة. لا خريطة ولا طلب شبكة.',
      },
    },
    supportedFormats: [],
    featured: true,
    tryRoute: true,
    updatedAt: '2026-08-30',
  },
  {
    slug: 'prayer-times-widget',
    trackingIssue: 10,
    name: 'Prayer Times Calculator',
    shortDescription: 'Prayer times for your location, with every method and convention shown.',
    description:
      'Calculate Fajr, sunrise, Dhuhr, Asr, Maghrib, and Isha for any date, coordinate, and IANA timezone. Choose a named method or custom angles, juristic, high-latitude rule, and minute adjustments — all documented in the methodology.',
    category: 'Everyday',
    status: 'experimental',
    license: 'Apache-2.0',
    stack: ['TypeScript'],
    processing: 'browser',
    processingNote:
      'Times are computed in your browser from coordinates, date, and timezone you provide. Nothing is stored or sent anywhere.',
    translations: {
      ar: {
        name: 'حاسبة مواقيت الصلاة',
        shortDescription: 'مواقيت الصلاة لموقعك، مع عرض كل طريقة واصطلاح.',
        description:
          'احسب الفجر والشروق والظهر والعصر والمغرب والعشاء لأي تاريخ وإحداثيات ومنطقة زمنية. اختر طريقة مسمّاة أو زوايا مخصصة، والمذهب في العصر، وقاعدة خطوط العرض العالية، والتعديلات بالدقائق — كلها موثّقة في المنهجية.',
        processingNote:
          'تُحسب المواقيت داخل متصفحك من الإحداثيات والتاريخ والمنطقة الزمنية التي تقدّمها. لا يُخزَّن شيء ولا يُرسل إلى أي جهة.',
      },
    },
    supportedFormats: [],
    featured: true,
    tryRoute: true,
    updatedAt: '2026-08-30',
    // Calculation-sensitive projects ship only after domain review (see CONTRIBUTING.md).
  },
  {
    slug: 'hijri-converter',
    trackingIssue: 11,
    name: 'Hijri–Gregorian Converter',
    shortDescription: 'Convert dates between Gregorian and Hijri — Umm al-Qura (Saudi) or Tabular (Civil), explicitly.',
    description:
      'Bidirectional Gregorian ↔ Hijri conversion with explicit variant choice. Umm al-Qura uses the official Saudi table (1356–1500 AH); Civil uses the 30-year tabular cycle. Variant, version, and warning travel with every export.',
    category: 'Everyday',
    status: 'experimental',
    license: 'Apache-2.0',
    stack: ['TypeScript'],
    processing: 'browser',
    processingNote:
      'Conversion runs in your browser from a bundled table/algorithm — no date is sent anywhere. No network request.',
    translations: {
      ar: {
        name: 'محول التاريخ الهجري',
        shortDescription: 'حوّل التواريخ بين الميلادي والهجري — أم القرى (السعودي) أو المدني (الجدولي)، بوضوح.',
        description:
          'تحويل ثنائي الاتجاه بين الميلادي والهجري مع اختيار نوع صريح. أم القرى يستخدم الجدول الرسمي السعودي (1356–1500هـ)؛ والمدني يستخدم التقويم الجدولي ذا الدورة 30 سنة. النوع والإصدار والتنبيه ترافق كل تصدير.',
        processingNote: 'التحويل يتم داخل متصفحك من جدول/خوارزمية مضمّنة — لا يُرسل التاريخ إلى أي جهة. لا طلب شبكة.',
      },
    },
    supportedFormats: [],
    featured: true,
    tryRoute: true,
    updatedAt: '2026-09-03',
  },
  {
    slug: 'zakat-calculator',
    trackingIssue: 12,
    name: 'Zakat Calculator',
    shortDescription: 'Organize monetary assets and estimate Zakat — transparent, decimal-precise, scholar-reviewed.',
    description:
      'A worksheet for cash, gold, silver, investments, receivables, and short-term liabilities. Choose gold (85g) or silver (595g) nisab, confirm hawl, and get an itemized 2.5% estimate with full trace. Not a fatwa — verify with qualified authority.',
    category: 'Everyday',
    status: 'experimental',
    license: 'Apache-2.0',
    stack: ['TypeScript', 'decimal.js'],
    processing: 'browser',
    processingNote:
      'Zakat is computed in your browser from numbers you provide — nothing is sent anywhere. Optional local save stays on device.',
    translations: {
      ar: {
        name: 'حاسبة الزكاة',
        shortDescription: 'نظّم الأصول النقدية وقدّر الزكاة — بشفافية ودقة عشرية ومراجعة علمية.',
        description:
          'ورقة عمل للنقد والذهب والفضة والاستثمارات والديون والالتزامات قصيرة الأجل. اختر نصاب الذهب (85غ) أو الفضة (595غ)، وأكد الحول، واحصل على تقدير 2.5% مفصّل مع أثر كامل. ليس فتوى — تأكد مع جهة موثوقة.',
        processingNote: 'تُحسب الزكاة داخل متصفحك من الأرقام التي تُدخلها — لا يُرسل شيء إلى أي جهة. الحفظ المحلي اختياري ويبقى على الجهاز.',
      },
    },
    supportedFormats: [],
    featured: true,
    tryRoute: true,
    updatedAt: '2026-09-03',
  },
]

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((tool) => tool.slug === slug)
}

export type ToolText = Pick<
  Tool,
  'name' | 'shortDescription' | 'description' | 'processingNote'
>

function englishText(tool: Tool): ToolText {
  return {
    name: tool.name,
    shortDescription: tool.shortDescription,
    description: tool.description,
    processingNote: tool.processingNote,
  }
}

/** Display text for a tool in the given locale. */
export function localizedTool(tool: Tool, locale: Locale): ToolText {
  if (locale === 'ar') return tool.translations.ar
  return englishText(tool)
}

export function relatedTools(tool: Tool, limit = 3): Tool[] {
  return TOOLS.filter(
    (candidate) =>
      candidate.slug !== tool.slug && candidate.category === tool.category,
  )
    .concat(TOOLS.filter((c) => c.slug !== tool.slug && c.featured))
    .filter((candidate, index, list) => list.findIndex((c) => c.slug === candidate.slug) === index)
    .slice(0, limit)
}
