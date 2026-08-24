export type ToolStatus = 'available' | 'experimental' | 'planned'
export type ToolCategory = 'Media' | 'Privacy' | 'Documents' | 'Everyday'

export type Tool = {
  slug: string
  name: string
  shortDescription: string
  description: string
  category: ToolCategory
  status: ToolStatus
  license: string
  stack: string[]
  privacyNote: string
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
]

/**
 * Tool catalog.
 *
 * Rules for editing this file:
 * - Only set `status: 'available'` when the repository is public and usable.
 * - `repoUrl` must point at a real, public repository.
 * - Keep privacy notes accurate: state exactly where processing happens.
 */
export const TOOLS: Tool[] = [
  {
    slug: 'saut',
    trackingIssue: 1,
    name: 'Saut',
    shortDescription: 'Remove background music from a video, locally.',
    description:
      'Saut separates speech and background music in a video so you can keep the voice track and work with a cleaner source.',
    category: 'Media',
    status: 'experimental',
    license: 'AGPL-3.0',
    stack: ['Python', 'FFmpeg', 'Demucs'],
    privacyNote:
      'Files stay in your browser session. Nothing is uploaded.',
    supportedFormats: ['MP4', 'MOV', 'WebM'],
    featured: true,
    updatedAt: '2026-08-10',
  },
  {
    slug: 'mizan-captions',
    name: 'Mizan Captions',
    shortDescription:
      'Clean subtitle files without changing their meaning.',
    description:
      'Fix timing gaps, duplicate lines, and formatting noise in subtitle files. Keep the words, lose the clutter.',
    category: 'Media',
    status: 'experimental',
    license: 'GPL-3.0',
    stack: ['Rust', 'WebAssembly'],
    privacyNote:
      'Subtitle files are parsed in your browser and never leave your device.',
    supportedFormats: ['SRT', 'VTT', 'ASS'],
    featured: true,
    updatedAt: '2026-07-28',
  },
  {
    slug: 'athar-scrub',
    trackingIssue: 2,
    name: 'Athar Scrub',
    shortDescription:
      'Remove hidden metadata from images before sharing them.',
    description:
      'Inspect and remove EXIF details such as location, device model, and timestamps. A small step worth taking before an image leaves your hands.',
    category: 'Privacy',
    status: 'planned',
    license: 'MIT',
    stack: ['TypeScript', 'Web Workers'],
    privacyNote:
      'Images are read and rewritten on your device. No network request is needed.',
    supportedFormats: ['JPG', 'PNG', 'HEIC'],
    featured: true,
    updatedAt: '2026-07-15',
  },
  {
    slug: 'amanah-blur',
    trackingIssue: 3,
    name: 'Amanah Blur',
    shortDescription: 'Blur faces, screens, and sensitive areas in video.',
    description:
      'A careful video privacy pass for community footage. Mark areas frame by frame, then export a copy with those regions blurred.',
    category: 'Privacy',
    status: 'experimental',
    license: 'MIT',
    stack: ['TypeScript', 'WebCodecs', 'OpenCV'],
    privacyNote:
      'Processing is designed to run locally. Experimental builds may be slower.',
    supportedFormats: ['MP4', 'MOV'],
    featured: true,
    updatedAt: '2026-07-02',
  },
  {
    slug: 'safha-pdf',
    trackingIssue: 4,
    name: 'Safha PDF',
    shortDescription: 'Merge and reorder PDFs into one document.',
    description:
      'Combine scanned pages and separate PDFs into one ordered document, then rearrange pages until it reads correctly.',
    category: 'Documents',
    status: 'planned',
    license: 'MIT',
    stack: ['TypeScript', 'PDF.js'],
    privacyNote: 'PDFs stay on your device. Merging happens in the browser.',
    supportedFormats: ['PDF'],
    featured: false,
    updatedAt: '2026-06-20',
  },
  {
    slug: 'qalam-pdf',
    trackingIssue: 5,
    name: 'Qalam PDF',
    shortDescription: 'Extract pages and text from a PDF, offline.',
    description:
      'A focused PDF workbench for splitting pages, extracting text, and preparing documents for a handoff.',
    category: 'Documents',
    status: 'planned',
    license: 'MPL-2.0',
    stack: ['Rust', 'PDFium'],
    privacyNote:
      'The proposed desktop build will keep documents on-device.',
    supportedFormats: ['PDF'],
    featured: false,
    updatedAt: '2026-06-05',
  },
  {
    slug: 'wasl-audio',
    trackingIssue: 6,
    name: 'Wasl Audio',
    shortDescription: 'Trim and convert audio without uploading it.',
    description:
      'Cut silence, trim clips, and convert between common audio formats. Built for long lecture recordings that other tools struggle with.',
    category: 'Media',
    status: 'planned',
    license: 'MIT',
    stack: ['TypeScript', 'Web Audio API'],
    privacyNote: 'Audio never leaves your device. Trimming runs in-browser.',
    supportedFormats: ['MP3', 'M4A', 'WAV', 'OGG'],
    featured: false,
    updatedAt: '2026-05-22',
  },
  {
    slug: 'sitr-redact',
    trackingIssue: 7,
    name: 'Sitr Redact',
    shortDescription: 'Blur or cover sensitive areas in screenshots.',
    description:
      'Obscure names, messages, and private details in images before sharing them publicly. Quick selection tools with sensible defaults.',
    category: 'Privacy',
    status: 'planned',
    license: 'MIT',
    stack: ['TypeScript', 'Canvas API'],
    privacyNote: 'Images are edited entirely in your browser.',
    supportedFormats: ['PNG', 'JPG', 'WebP'],
    featured: false,
    updatedAt: '2026-05-10',
  },
  {
    slug: 'miftah-link',
    name: 'Miftah Link',
    shortDescription: 'Clean tracking parameters out of shared links.',
    description:
      'Strip click-tracking and surveillance parameters from URLs before you share them. Paste, clean, copy.',
    category: 'Everyday',
    status: 'available',
    license: 'Apache-2.0',
    stack: ['TypeScript'],
    privacyNote:
      'Links are cleaned in your browser. The list of known trackers ships with the app.',
    supportedFormats: [],
    featured: true,
    tryRoute: true,
    updatedAt: '2026-08-01',
    // First shipped utility lives inside this repository under src/tools/miftah-link.
    repoUrl: 'https://github.com/SalehAlobaylan/waqf-toolkit',
  },
  {
    slug: 'salah-clock',
    trackingIssue: 8,
    name: 'Salah Clock',
    shortDescription: 'A small prayer time widget for your desktop.',
    description:
      'A quiet, configurable prayer time widget using a location you choose. Built for glancing, not nudging.',
    category: 'Everyday',
    status: 'planned',
    license: 'Apache-2.0',
    stack: ['Tauri', 'TypeScript'],
    privacyNote:
      'Location stays on your device. Times are computed locally from your coordinates.',
    supportedFormats: [],
    featured: false,
    updatedAt: '2026-04-18',
    // Calculation-sensitive projects ship only after domain review (see CONTRIBUTING.md).
  },
]

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((tool) => tool.slug === slug)
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
