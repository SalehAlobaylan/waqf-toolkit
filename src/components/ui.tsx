import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent/90 border-transparent shadow-sm',
  secondary:
    'bg-surface text-ink hover:bg-line/60 border-line',
  ghost: 'bg-transparent hover:bg-line/40 border-transparent',
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: {
  children: ReactNode
  variant?: ButtonVariant
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function ButtonLink({
  children,
  href,
  variant = 'primary',
  className = '',
  external = false,
}: {
  children: ReactNode
  href: string
  variant?: ButtonVariant
  className?: string
  external?: boolean
}) {
  const styles = `inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${buttonStyles[variant]} ${className}`
  if (external) {
    return (
      <a href={href} className={styles} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link to={href} className={styles}>
      {children}
    </Link>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'warn' | 'muted'
}) {
  const tones = {
    neutral: 'bg-line/70 text-ink',
    accent: 'bg-accent-soft text-accent',
    warn: 'bg-amber-100 text-amber-900',
    muted: 'bg-transparent text-muted border border-line',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface ${className}`}
    >
      {children}
    </div>
  )
}
