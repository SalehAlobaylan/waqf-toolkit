import { createFileRoute, notFound } from '@tanstack/react-router'

// Catch-all: any unmatched path under a valid locale throws notFound,
// rendered by the localized 404 on the $locale route (with header/footer).
export const Route = createFileRoute('/$locale/$')({
  beforeLoad: () => {
    throw notFound()
  },
})
