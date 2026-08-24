import type { ComponentType } from 'react'
import MiftahLinkTry from './miftah-link/miftah-link-try'

/**
 * In-app runnable tool interfaces, keyed by catalog slug.
 *
 * A tool appears here only when its processing is fully client-side.
 */
export const TOOL_INTERFACES: Record<string, ComponentType> = {
  'miftah-link': MiftahLinkTry,
}
