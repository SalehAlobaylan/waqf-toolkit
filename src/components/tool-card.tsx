import { Link } from '@tanstack/react-router'
import { Badge, Card } from './ui'
import { useI18n, lhref } from '@/i18n'
import type { Tool, ToolStatus } from '@/data/tools'

export function StatusBadge({ status }: { status: ToolStatus }) {
  const { t } = useI18n()
  if (status === 'available') return <Badge tone="accent">{t.status.available}</Badge>
  if (status === 'experimental') return <Badge tone="warn">{t.status.experimental}</Badge>
  return <Badge tone="muted">{t.status.planned}</Badge>
}

export function ToolCard({ tool }: { tool: Tool }) {
  const { locale, t } = useI18n()
  return (
    <Link to={lhref(`/tools/${tool.slug}`, locale)} className="group block">
      <Card className="h-full p-5 transition-shadow group-hover:shadow-md">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="font-semibold tracking-tight">{tool.name}</h3>
          <StatusBadge status={tool.status} />
        </div>
        <p className="text-sm text-muted">{tool.shortDescription}</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted">
          <Badge>{t.category[tool.category]}</Badge>
          <span aria-hidden="true">·</span>
          <span>{tool.license}</span>
        </div>
      </Card>
    </Link>
  )
}
