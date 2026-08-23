import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useI18n } from '@/i18n'
import { Button, ButtonLink, Card } from '@/components/ui'
import {
  useGoodFirstIssues,
  REPO_URL,
} from '@/lib/use-github'
import { GithubIcon } from '@/components/github-icon'

export const Route = createFileRoute('/$locale/contribute')({
  head: ({ params }) => ({
    meta: [
      {
        title:
          params.locale === 'ar'
            ? 'شارك في التطوير — صندوق وقف'
            : 'Contribute — Waqf Toolkit',
      },
    ],
  }),
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
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t.contribute.title}</h1>
      <p className="mt-2 max-w-xl text-muted">{t.contribute.subtitle}</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">{t.contribute.waysTitle}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {ways.map((way) => (
            <Card key={way.title} className="p-5">
              <h3 className="font-semibold">{way.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{way.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <GoodFirstIssues />

      <SuggestToolForm />
    </div>
  )
}

function GoodFirstIssues() {
  const { t } = useI18n()
  const issues = useGoodFirstIssues()

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t.contribute.goodFirstIssues}
          </h2>
          <p className="text-xs text-muted">{t.contribute.goodFirstIssuesHint}</p>
        </div>
        <ButtonLink href={`${REPO_URL}/issues`} external variant="secondary">
          <GithubIcon className="h-4 w-4" />
          {t.contribute.viewOnGithub}
        </ButtonLink>
      </div>

      {issues.isError ? (
        <Card className="mt-5 p-5 text-sm text-muted">
          {t.contribute.issuesUnavailable}
        </Card>
      ) : issues.isPending ? (
        <div className="mt-5 space-y-2" aria-hidden="true">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-line/70" />
          ))}
        </div>
      ) : (issues.data?.length ?? 0) === 0 ? (
        <Card className="mt-5 p-5 text-sm text-muted">
          Nothing labelled yet — check the repository for open work.
        </Card>
      ) : (
        <ul className="mt-5 space-y-2">
          {issues.data!.map((issue) => (
            <li key={issue.number}>
              <a
                href={issue.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm transition-colors hover:border-accent/40 hover:bg-accent-soft/30"
              >
                <span className="truncate font-medium">
                  <span className="text-muted tabular-nums">#{issue.number}</span>{' '}
                  {issue.title}
                </span>
                <span className="shrink-0 text-xs text-muted tabular-nums">
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
  name: string
  problem: string
  email: string
}

function SuggestToolForm() {
  const { t } = useI18n()
  const [submitted, setSubmitted] = useState(false)

  const form = useForm({
    defaultValues: {
      name: '',
      problem: '',
      email: '',
    } as SuggestionValues,
    onSubmit: async () => {
      // Demo behaviour: nothing leaves the browser.
      await new Promise((resolve) => setTimeout(resolve, 400))
      setSubmitted(true)
    },
  })

  if (submitted) {
    return (
      <section className="mt-14">
        <Card className="border-accent/30 bg-accent-soft/40 p-8 text-center">
          <h2 className="text-lg font-semibold">{t.contribute.successTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {t.contribute.successBody}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <ButtonLink href={`${REPO_URL}/issues/new`} external variant="secondary">
              {t.contribute.successIssueLink}
            </ButtonLink>
            <Button variant="ghost" onClick={() => setSubmitted(false)}>
              {t.contribute.anotherIdea}
            </Button>
          </div>
        </Card>
      </section>
    )
  }

  const inputClasses =
    'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent'

  return (
    <form
      className="mt-14"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        form.handleSubmit()
      }}
    >
      <h2 className="text-xl font-semibold tracking-tight">{t.contribute.suggestTitle}</h2>
      <p className="mt-1 max-w-lg text-sm text-muted">{t.contribute.suggestBody}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              value.trim().length > 0 ? undefined : t.contribute.validationName,
          }}
        >
          {(field) => (
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium">{t.contribute.fieldName}</span>
              <input
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder={t.contribute.fieldNamePlaceholder}
                className={inputClasses}
              />
              {!field.state.meta.isValid && (
                <span className="mt-1 block text-xs text-red-700">
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
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium">{t.contribute.fieldProblem}</span>
              <textarea
                name={field.name}
                rows={4}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder={t.contribute.fieldProblemPlaceholder}
                className={inputClasses}
              />
              {!field.state.meta.isValid && (
                <span className="mt-1 block text-xs text-red-700">
                  {field.state.meta.errors.join(', ')}
                </span>
              )}
            </label>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <label className="block text-sm sm:col-span-2 sm:max-w-xs">
              <span className="mb-1.5 block font-medium">{t.contribute.fieldEmail}</span>
              <input
                type="email"
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                className={inputClasses}
              />
            </label>
          )}
        </form.Field>
      </div>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting} className="mt-6">
            {isSubmitting ? t.contribute.submitting : t.contribute.submit}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
