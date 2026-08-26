import type { ComponentType } from 'react'
import LinkCleanerTry from './link-cleaner/link-cleaner-try'

/**
 * In-app runnable tool interfaces, keyed by catalog slug.
 *
 * A tool appears here only when it is usable end-to-end on this site;
 * its catalog entry must set `tryRoute: true`.
 */
export const TOOL_INTERFACES: Record<string, ComponentType> = {
  'link-cleaner': LinkCleanerTry,
}
