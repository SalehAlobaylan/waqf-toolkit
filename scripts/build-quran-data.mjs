#!/usr/bin/env node
/**
 * Builds the Card Studio Quran dataset from the Tanzil Uthmani text.
 *
 * The generator is intentionally dependency-free and reproducible:
 *
 *   node scripts/build-quran-data.mjs --download
 *   node scripts/build-quran-data.mjs --source <dir with quran-uthmani.txt + quran-data.xml>
 *
 * Source:
 *   https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2&agree=true
 *   https://tanzil.net/res/text/metadata/quran-data.xml
 *
 * Derivation rules (documented in METHODOLOGY.md):
 *   - Every verse is stored verbatim, trimmed of surrounding whitespace.
 *   - Tanzil stores the basmala as a prefix of the first ayah of most suras.
 *     It is split into a `basmala` field when present (all suras except 1 and 9);
 *     `basmala + " " + ayat[0]` reproduces the source line character-for-character.
 *     Sura 1 keeps the basmala as its first ayah.
 *   - The script refuses to write output if reconstruction does not hash-match
 *     the source lines exactly.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const OUT_DIR = join(ROOT, 'src/tools/card-studio/data/quran')

const TEXT_URL =
  'https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2&agree=true'
const META_URL = 'https://tanzil.net/res/text/metadata/quran-data.xml'

function fnv1a(input) {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function parseArgs(argv) {
  let download = false
  let source = null
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--download') download = true
    else if (argv[i] === '--source') source = argv[++i]
  }
  return { download, source }
}

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch failed ${res.status} for ${url}`)
  return await res.text()
}

function parseMeta(xml) {
  const suras = []
  const re = /<sura index="(\d+)" ayas="(\d+)"[^>]*name="([^"]*)" tname="([^"]*)"/g
  let m
  while ((m = re.exec(xml)) !== null) {
    suras.push({
      id: Number(m[1]),
      ayahCount: Number(m[2]),
      nameAr: m[3],
      nameEn: m[4],
    })
  }
  if (suras.length !== 114) throw new Error(`expected 114 suras, parsed ${suras.length}`)
  for (let i = 0; i < suras.length; i++) {
    if (suras[i].id !== i + 1) throw new Error(`sura order broken at ${suras[i].id}`)
  }
  return suras
}

function parseVerses(text) {
  const bySura = new Map()
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^(\d+)\|(\d+)\|(.*)$/)
    if (!m) continue
    const sura = Number(m[1])
    const aya = Number(m[2])
    const body = m[3].trim()
    let ayat = bySura.get(sura)
    if (!ayat) {
      ayat = []
      bySura.set(sura, ayat)
    }
    if (ayat.length !== aya - 1) {
      throw new Error(`sura ${sura}: expected aya ${ayat.length + 1}, got ${aya}`)
    }
    ayat.push(body)
  }
  return bySura
}

function md5(input) {
  return createHash('md5').update(input, 'utf8').digest('hex')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  let rawText
  let rawMeta

  if (args.download) {
    console.log('Downloading Tanzil text + metadata…')
    rawText = await fetchText(TEXT_URL)
    rawMeta = await fetchText(META_URL)
  } else {
    if (!args.source) {
      console.error('Usage: node scripts/build-quran-data.mjs --download | --source <dir>')
      process.exit(1)
    }
    rawText = readFileSync(join(args.source, 'quran-uthmani.txt'), 'utf8')
    rawMeta = readFileSync(join(args.source, 'quran-data.xml'), 'utf8')
  }

  const suras = parseMeta(rawMeta)
  const verses = parseVerses(rawText)
  if (verses.size !== 114) throw new Error(`expected 114 suras in text, found ${verses.size}`)

  // Canonical basmala body (shared by every basmala, whatever its prefix form).
  // Derived from the source itself — never typed by hand.
  const firstSura = verses.get(1)
  if (!firstSura || firstSura.length === 0) throw new Error('sura 1 not found')
  const basmalaFirstSpace = firstSura[0].indexOf(' ')
  if (basmalaFirstSpace <= 0) throw new Error('sura 1 ayah 1 is not a basmala')
  const BASMALA_BODY = firstSura[0].slice(basmalaFirstSpace + 1)

  const output = []
  const reconstruction = []

  for (const sura of suras) {
    const ayat = verses.get(sura.id)
    if (!ayat || ayat.length !== sura.ayahCount) {
      throw new Error(
        `sura ${sura.id}: expected ${sura.ayahCount} ayat, found ${ayat ? ayat.length : 0}`,
      )
    }
    let basmala = null
    if (sura.id !== 1 && sura.id !== 9) {
      const idx = ayat[0].indexOf(BASMALA_BODY)
      if (idx <= 0 || idx > 40) {
        throw new Error(`sura ${sura.id}: basmala prefix not found where expected`)
      }
      basmala = ayat[0].slice(0, idx + BASMALA_BODY.length).trim()
      ayat[0] = ayat[0].slice(idx + BASMALA_BODY.length).trim()
      if (ayat[0] === '') throw new Error(`sura ${sura.id}: empty first ayah after basmala split`)
    }
    for (let i = 0; i < ayat.length; i++) {
      const reconstructed = i === 0 && basmala ? `${basmala} ${ayat[i]}` : ayat[i]
      reconstruction.push(`${sura.id}|${i + 1}|${reconstructed}`)
    }
    output.push({ surah: sura.id, basmala, ayat })
  }

  const sourceLines = []
  for (const line of rawText.split(/\r?\n/)) {
    if (/^\d+\|\d+\|/.test(line)) sourceLines.push(line.trimEnd())
  }
  if (reconstruction.length !== sourceLines.length) {
    throw new Error('reconstruction line count does not match source')
  }
  for (let i = 0; i < sourceLines.length; i++) {
    if (reconstruction[i] !== sourceLines[i]) {
      throw new Error(`reconstruction mismatch at line ${i + 1}`)
    }
  }

  const datasetChecksum = fnv1a(reconstruction.join('\n'))
  const sourceMd5 = md5(rawText)

  mkdirSync(OUT_DIR, { recursive: true })
  for (const sura of output) {
    const file = join(OUT_DIR, `${String(sura.surah).padStart(3, '0')}.json`)
    writeFileSync(file, `${JSON.stringify(sura)}\n`, 'utf8')
  }

  const notice = rawText
    .split(/\r?\n/)
    .filter((line) => line.startsWith('#'))
    .join('\n')

  const license = [
    'Quran text — Tanzil Project (https://tanzil.net)',
    `Source: ${TEXT_URL}`,
    `Metadata: ${META_URL}`,
    'Retrieved: 2026-09-13',
    `Source file MD5: ${sourceMd5}`,
    `Derived dataset checksum: ${datasetChecksum}`,
    '',
    'The source text is used verbatim. The only derivation is splitting the',
    'basmala prefix out of the first ayah of suras other than 1 and 9, as',
    'described in scripts/build-quran-data.mjs and METHODOLOGY.md.',
    '',
    notice,
    '',
  ].join('\n')
  writeFileSync(join(OUT_DIR, 'LICENSE.txt'), license, 'utf8')

  const indexLines = [
    '// GENERATED by scripts/build-quran-data.mjs — do not edit by hand.',
    '// Source: Tanzil Quran Text (Uthmani) — https://tanzil.net (see LICENSE.txt).',
    '',
    'export type SurahMeta = {',
    '  id: number',
    '  nameAr: string',
    '  nameEn: string',
    '  ayahCount: number',
    '}',
    '',
    'export type SurahText = {',
    '  surah: number',
    '  basmala: string | null',
    '  ayat: string[]',
    '}',
    '',
    `export const QURAN_SOURCE_MD5 = '${sourceMd5}'`,
    `export const QURAN_DATASET_CHECKSUM = '${datasetChecksum}'`,
    '',
    'export const SURAHS: SurahMeta[] = [',
    ...suras.map(
      (s) =>
        `  { id: ${s.id}, nameAr: ${JSON.stringify(s.nameAr)}, nameEn: ${JSON.stringify(
          s.nameEn,
        )}, ayahCount: ${s.ayahCount} },`,
    ),
    ']',
    '',
    'const modules = import.meta.glob<SurahText>(\'./*.json\', {',
    "  import: 'default',",
    '})',
    '',
    'export function loadSurah(id: number): Promise<SurahText> {',
    '  const key = `./${String(id).padStart(3, \'0\')}.json`',
    '  const load = modules[key]',
    '  if (!load) return Promise.reject(new Error(\'unknown-surah\'))',
    '  return load()',
    '}',
    '',
  ]
  writeFileSync(join(OUT_DIR, 'index.ts'), indexLines.join('\n'), 'utf8')

  console.log(`Wrote ${output.length} sura files to ${OUT_DIR}`)
  console.log(`Total ayat: ${reconstruction.length}`)
  console.log(`Source MD5: ${sourceMd5}`)
  console.log(`Dataset checksum: ${datasetChecksum}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
