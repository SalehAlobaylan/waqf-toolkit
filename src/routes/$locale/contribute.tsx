import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useI18n, hreflangLinks } from '@/i18n'
import { ButtonLink, Eyebrow } from '@/components/ui'
import { useGoodFirstIssues, REPO_URL } from '@/lib/use-github'
import { GithubIcon } from '@/components/github-icon'
import {
  ArrowRightIcon,
  CircleCheckIcon,
  MailIcon,
} from '@/components/icons'

export const Route = createFileRoute('/$locale/contribute')({
  head: ({ params }) => {
    const locale = params.locale === 'ar' ? 'ar' : 'en'
    return {
      meta: [
        {
          title:
            locale === 'ar'
              ? 'شارك في التطوير — صندوق وقف'
              : 'Contribute — Waqf Toolkit',
        },
      ],
      links: hreflangLinks('/contribute'),
    }
  },
  component: ContributePage,
})

function ContributePage() {
  const { t } = useI18n()

  const ways = [
    { title: t.contribute.way1Title, body: t.contribute.way1Body },
    { title: t.contribute.way2Title, body: t.contribute.way2Body },
    { title: t.contribute.way3Title, body: t.contribute.way3Body },
    { title: t.contribute.way4Title, body: t.contribute.way4Body },
  ]

  return (
    <main>
      {/* Hero */}
      <section className="shell-grid border-b border-line/70">
        <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-14 lg:px-8 lg:pb-20 lg:pt-20">
          <Eyebrow>{t.contribute.guideEyebrow}</Eyebrow>
          <div className="mt-5 grid gap-10 lg:grid-cols-[1fr_390px] lg:items-end">
            <h1 className="max-w-3xl animate-rise font-display text-6xl font-semibold leading-[0.9] tracking-[-0.07em] rtl:leading-[1.1] rtl:tracking-normal sm:text-8xl">
              {t.contribute.line1}
              <br />
              <span className="text-accent">{t.contribute.line2}</span>
            </h1>
            <blockquote className="animate-rise border-s-2 border-clay ps-5" style={{ animationDelay: '120ms' }}>
              <p className="font-display text-2xl font-medium leading-tight tracking-[-0.03em] rtl:tracking-normal">
                {t.contribute.quote}
              </p>
              <footer className="mt-4 text-xs text-muted">{t.contribute.quoteCaption}</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Guide + form */}
      <section className="mx-auto grid max-w-[1240px] gap-14 px-5 py-16 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-20">
        <div>
          <Eyebrow>{t.contribute.fitEyebrow}</Eyebrow>
          <div className="mt-7 divide-y divide-line">
            {ways.map((way, index) => (
              <div
                key={way.title}
                className="grid gap-4 py-6 first:pt-0 sm:grid-cols-[42px_1fr]"
              >
                <span className="font-mono-ui text-xs font-bold text-clay">
                  0{index + 1}
                </span>
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] rtl:tracking-normal">
                    {way.title}
                  </h2>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-muted">{way.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3 rounded-2xl border border-line bg-accent-soft/40 p-5">
            <CircleCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="text-sm font-semibold">{t.contribute.notReadyTitle}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{t.contribute.notReadyBody}</p>
            </div>
          </div>
        </div>

        <SuggestToolForm />
      </section>

      <GoodFirstIssues />
    </main>
  )
}

function GoodFirstIssues() {
  const { t } = useI18n()
  const issues = useGoodFirstIssues()

  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-20 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-10">
        <div>
          <Eyebrow>{t.contribute.goodFirstIssues}</Eyebrow>
          <p className="mt-2 text-xs text-muted">{t.contribute.goodFirstIssuesHint}</p>
        </div>
        <ButtonLink
          href={`${REPO_URL}/issues`}
          external
          variant="outline"
          className="gap-2 px-4 py-2 text-xs"
        >
          <GithubIcon className="h-4 w-4" />
          {t.contribute.viewOnGithub}
        </ButtonLink>
      </div>

      {issues.isError ? (
        <p className="mt-5 rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
          {t.contribute.issuesUnavailable}
        </p>
      ) : issues.isPending ? (
        <div className="mt-5 space-y-2" aria-hidden="true">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-line/70" />
          ))}
        </div>
      ) : (issues.data?.length ?? 0) === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
          {t.contribute.issuesEmpty}
        </p>
      ) : (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {issues.data!.map((issue) => (
            <li key={issue.number}>
              <a
                href={issue.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-5 py-4 text-sm shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40"
              >
                <span className="truncate font-medium transition-colors group-hover:text-accent">
                  <span className="font-mono-ui text-[11px] text-muted">#{issue.number}</span>{' '}
                  {issue.title}
                </span>
                <span className="shrink-0 font-mono-ui text-[11px] text-muted tabular-nums">
                  💬 {issue.comments}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

type SuggestionValues = {
  email: string
  problem: string
}

function SuggestToolForm() {
  const { t } = useI18n()
  const [submitted, setSubmitted] = useState(false)
  const [sentTo, setSentTo] = useState('')

  const form = useForm({
    defaultValues: {
      email: '',
      problem: '',
    } as SuggestionValues,
    onSubmit: async ({ value }) => {
      // Demo behaviour: nothing leaves the browser.
      await new Promise((resolve) => setTimeout(resolve, 400))
      setSentTo(value.email)
      setSubmitted(true)
    },
  })

  if (submitted) {
    return (
      <div className="h-fit rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-7">
        <div
          role="status"
          data-testid="status-contribution-success"
          className="mt-2 rounded-xl bg-accent-soft p-5"
        >
          <CircleCheckIcon className="h-5 w-5 text-accent" />
          <p className="mt-4 text-sm font-semibold">{t.contribute.successTitle}</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            {t.contribute.successBody.replace('{email}', sentTo)}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false)
                form.reset()
              }}
              data-testid="button-submit-another"
              className="cursor-pointer text-xs font-semibold text-accent hover:underline"
            >
              {t.contribute.anotherIdea}
            </button>
            <a
              href={`${REPO_URL}/issues/new`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-muted hover:text-accent hover:underline"
            >
              {t.contribute.successIssueLink}
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-fit rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-2xl font-semibold tracking-[-0.035em] rtl:tracking-normal">
            {t.contribute.formTitle}
          </p>
          <p className="mt-1 text-xs text-muted">{t.contribute.formCaption}</p>
        </div>
        <MailIcon className="h-6 w-6 text-accent" />
      </div>

      <form
        className="mt-8 grid gap-5"
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) =>
              /.+@.+\..+/.test(value.trim()) ? undefined : t.contribute.validationEmail,
          }}
        >
          {(field) => (
            <label className="grid gap-2 text-xs font-semibold">
              {t.contribute.fieldEmail}
              <input
                type="email"
                required
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="you@example.com"
                dir="ltr"
                className={`h-11 rounded-lg border px-3 text-sm font-normal outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10 ${
                  !field.state.meta.isValid ? 'border-danger' : 'border-line'
                }`}
              />
              {!field.state.meta.isValid && (
                <span className="font-normal normal-case text-danger">
                  {field.state.meta.errors.join(', ')}
                </span>
              )}
            </label>
          )}
        </form.Field>

        <form.Field
          name="problem"
          validators={{
            onChange: ({ value }) =>
              value.trim().length > 0 ? undefined : t.contribute.validationProblem,
          }}
        >
          {(field) => (
            <label className="grid gap-2 text-xs font-semibold">
              {t.contribute.fieldProblem}
              <textarea
                required
                minLength={3}
                rows={5}
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder={t.contribute.fieldProblemPlaceholder}
                className="resize-none rounded-lg border border-line px-3 py-3 text-sm font-normal outline-none transition-colors placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/10"
              />
              {!field.state.meta.isValid && (
                <span className="font-normal text-danger">
                  {field.state.meta.errors.join(', ')}
                </span>
              )}
            </label>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              data-testid="button-submit-contribution"
              className="group mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-accent px-5 py-3.5 text-sm font-semibold text-paper shadow-card transition-all hover:bg-accent-strong hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSubmitting ? t.contribute.submitting : t.contribute.submit}
              <ArrowRightIcon className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </button>
          )}
        </form.Subscribe>

        <p className="text-center text-[11px] leading-5 text-muted">
          {t.contribute.suggestBody}
        </p>
      </form>
    </div>
  )
}
