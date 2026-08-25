import type { ComponentType } from 'react'
import LinkCleanerTry from './link-cleaner/link-cleaner-try'

/**
 * In-app runnable tool interfaces, keyed by catalog slug.
 *
 * A tool appears here only when its processing is fully client-side.
 */
export const TOOL_INTERFACES: Record<string, ComponentType> = {
  'link-cleaner': LinkCleanerTry,
}
