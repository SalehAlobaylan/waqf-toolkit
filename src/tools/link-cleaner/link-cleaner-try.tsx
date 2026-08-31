import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { Button, Card } from '@/components/ui'
import { cleanUrl } from './clean-url'

const inputClasses =
  'w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10'

export default function LinkCleanerTry() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(copyTimer.current), [])

  const result = useMemo(() => {
    if (!input.trim()) return null
    return cleanUrl(input)
  }, [input])

  const cleaned = result?.ok ? result : null
  const error = result && !result.ok ? result.error : null

  async function copy() {
    if (!cleaned) return
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(cleaned.url)
      setCopyFailed(false)
      setCopied(true)
    } catch {
      setCopied(false)
      setCopyFailed(true)
      return
    }
    copyTimer.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">{t.tryTool.inputLabel}</span>
        <input
          type="text"
          dir="ltr"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t.tryTool.inputPlaceholder}
          className={`${inputClasses} font-mono`}
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      <p className="text-xs text-muted"></p>

      {error === 'invalid-url' && (
        <Card className="border-danger/30 bg-clay-soft! p-4 text-sm text-danger">
          {t.tryTool.invalidUrl}
        </Card>
      )}

      {cleaned && (
        <div className="space-y-3">
          <div>
            <span className="mb-1.5 block text-sm font-medium">
              {t.tryTool.cleanLabel}
            </span>
            <div className="flex items-center gap-2" dir="ltr">
              <code className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-accent/30 bg-accent-soft/40 px-3 py-2 font-mono text-sm whitespace-nowrap">
                {cleaned.url}
              </code>
              <Button variant="outline" onClick={copy} className="shrink-0 px-4! py-2! text-xs">
                {copied ? `✓ ${t.tryTool.copied}` : t.tryTool.copy}
              </Button>
            </div>
            {copyFailed && (
              <p className="mt-1.5 text-xs font-medium text-danger">{t.tryTool.copyFailed}</p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">
              {t.tryTool.removedTitle}
            </span>
            {cleaned.removed.length === 0 ? (
              <p className="text-sm text-muted">{t.tryTool.noneRemoved}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {cleaned.removed.map((name) => (
                  <li
                    key={name}
                    dir="ltr"
                    className="rounded-full bg-clay-soft px-2.5 py-1 font-mono text-xs text-danger line-through"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
