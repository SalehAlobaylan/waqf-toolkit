#!/usr/bin/env node
/**
 * Bundle budget gate.
 *
 * "Good tools stay small" is only real if a machine enforces it. This script
 * reads the production build and fails when Card Studio grows past the budget
 * agreed in `docs/card-studio-v2-analysis.md` §2.3:
 *
 *   - the tool chunk (registry)  ≤ 140 kB gzip
 *   - Quran data                 = 114 lazy per-surah chunks (never bundled)
 *   - self-hosted card fonts     ≤ 260 kB on disk
 *
 * Run after `pnpm build`:  node scripts/check-bundle-budget.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CLIENT = join(ROOT, 'dist/client/assets')
const FONTS = join(ROOT, 'public/fonts')

const BUDGET_KB = {
  registryGzipKb: 140,
  surahChunks: 114,
  fontDiskKb: 260,
}

function fail(message) {
  console.error(`✗ bundle budget: ${message}`)
  process.exitCode = 1
}

function gzKb(file) {
  return gzipSync(readFileSync(file)).length / 1024
}

let files
try {
  files = readdirSync(CLIENT)
} catch {
  fail('dist/client/assets not found — run `pnpm build` first.')
  process.exit(1)
}

// 1. The editor route chunk (the try route) plus the tools chunk it pulls in.
const editorChunk = files.find((name) => name.startsWith('tools._slug_.try-'))
const toolsChunk = files.find((name) => /^tools-[^.]*\.js$/.test(name))
if (!editorChunk) {
  fail('editor route chunk not found in the build output.')
} else {
  const editorKb = gzKb(join(CLIENT, editorChunk))
  const toolsKb = toolsChunk ? gzKb(join(CLIENT, toolsChunk)) : 0
  const totalKb = editorKb + toolsKb
  const status = totalKb <= BUDGET_KB.registryGzipKb ? '✓' : '✗'
  console.log(
    `${status} editor route: ${totalKb.toFixed(1)} kB gzip (try ${editorKb.toFixed(1)} + tools ${toolsKb.toFixed(1)}) / ${BUDGET_KB.registryGzipKb} kB budget`,
  )
  if (totalKb > BUDGET_KB.registryGzipKb) fail(`editor route is ${totalKb.toFixed(1)} kB gzip`)
}

// 2. Quran data must stay split per surah — one big JSON would defeat the point.
const surahChunks = files.filter((name) => /^\d{3}-.*\.js$/.test(name))
const status2 = surahChunks.length === BUDGET_KB.surahChunks ? '✓' : '✗'
console.log(`${status2} Quran data chunks: ${surahChunks.length} (expected ${BUDGET_KB.surahChunks} lazy surah files)`)
if (surahChunks.length !== BUDGET_KB.surahChunks) {
  fail(`expected ${BUDGET_KB.surahChunks} per-surah chunks, found ${surahChunks.length}`)
}

// 3. Self-hosted card fonts stay small (Amiri is the only addition in V2).
const amiri = readdirSync(FONTS).filter((name) => name.startsWith('amiri') && name.endsWith('.woff2'))
const fontBytes = amiri.reduce((n, name) => n + statSync(join(FONTS, name)).size, 0)
const fontKb = fontBytes / 1024
const status3 = fontKb <= BUDGET_KB.fontDiskKb ? '✓' : '✗'
console.log(`${status3} card fonts: ${amiri.length} files, ${fontKb.toFixed(0)} kB on disk / ${BUDGET_KB.fontDiskKb} kB budget`)
if (fontKb > BUDGET_KB.fontDiskKb) fail(`card fonts are ${fontKb.toFixed(0)} kB`)

if (process.exitCode) {
  console.error('\nBundle budget exceeded. Remove bytes or raise the budget deliberately.')
} else {
  console.log('\nBundle budget OK.')
}
