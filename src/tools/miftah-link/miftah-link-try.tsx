import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { Button, Card } from '@/components/ui'
import { cleanUrl } from './clean-url'

export default function MiftahLinkTry() {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (!input.trim()) return null
    return cleanUrl(input)
  }, [input])

  const cleaned = result?.ok ? result : null
  const error = result && !result.ok ? result.error : null

  async function copy() {
    if (!cleaned) return
    await navigator.clipboard.writeText(cleaned.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const inputClasses =
    'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent'

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

      <p className="text-xs text-muted">{t.tryTool.disclaimer}</p>

      {error === 'invalid-url' && (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-800">
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
              <Button variant="secondary" onClick={copy} className="shrink-0">
                {copied ? `✓ ${t.tryTool.copied}` : t.tryTool.copy}
              </Button>
            </div>
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
                    className="rounded-full bg-red-100 px-2.5 py-0.5 font-mono text-xs text-red-900 line-through"
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
