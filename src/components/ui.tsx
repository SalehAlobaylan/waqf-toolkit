import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'outline' | 'muted' | 'ghost'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-paper shadow-card hover:bg-accent-strong hover:-translate-y-0.5',
  outline:
    'border border-line bg-surface/70 text-ink hover:border-accent/40 hover:text-accent',
  muted: 'bg-[hsl(42_20%_89%)] text-ink hover:brightness-95',
  ghost: 'bg-transparent text-muted hover:bg-line/40 hover:text-ink',
}

export const buttonShape =
  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-45'

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
    <button className={`${buttonShape} ${buttonStyles[variant]} ${className}`} {...rest}>
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
  ...rest
}: {
  children: ReactNode
  href: string
  variant?: ButtonVariant
  className?: string
  external?: boolean
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const styles = `${buttonShape} ${buttonStyles[variant]} ${className}`
  if (external || href.startsWith('#') || href.startsWith('http')) {
    return (
      <a
        href={href}
        className={styles}
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    )
  }
  return (
    <Link to={href} className={styles} {...rest}>
      {children}
    </Link>
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
    <div className={`rounded-2xl border border-line/90 bg-surface shadow-card ${className}`}>
      {children}
    </div>
  )
}

/** Mono micro-label in the primary green — no decoration. */
export function Eyebrow({
  children,
  tone = 'accent',
  className = '',
}: {
  children: ReactNode
  tone?: 'accent' | 'olive' | 'muted'
  className?: string
}) {
  const tones = {
    accent: 'text-accent',
    olive: 'text-olive',
    muted: 'text-muted',
  }
  return <p className={`eyebrow ${tones[tone]} ${className}`}>{children}</p>
}

/**
 * Small bordered info tile with an icon, a title, and a line of body copy.
 * `dark` renders it on forest-green surfaces.
 */
export function InfoCard({
  icon,
  title,
  body,
  dark = false,
  className = '',
}: {
  icon: ReactNode
  title: ReactNode
  body: ReactNode
  dark?: boolean
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        dark ? 'border-forest-border bg-forest-accent/45' : 'border-line bg-surface'
      } ${className}`}
    >
      <div className={dark ? 'text-olive' : 'text-accent'}>{icon}</div>
      <h3 className="mt-6 text-sm font-semibold">{title}</h3>
      <p
        className={`mt-2 text-xs leading-5 ${
          dark ? 'text-paper/60' : 'text-muted'
        }`}
      >
        {body}
      </p>
    </div>
  )
}

export const inputClasses =
  'w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/10'
