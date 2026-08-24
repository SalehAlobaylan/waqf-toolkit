import { useQuery } from '@tanstack/react-query'
import { fetchRepoStats, fetchGoodFirstIssues, REPO_URL } from '@/lib/github'

// Unauthenticated GitHub API allows 60 requests/hour per client IP; a longer
// stale window keeps each visitor session well under the limit.
const GITHUB_STALE_TIME = 1000 * 60 * 15

export function useRepoStats() {
  return useQuery({
    queryKey: ['github', 'repo-stats'],
    queryFn: fetchRepoStats,
    staleTime: GITHUB_STALE_TIME,
  })
}

export function useGoodFirstIssues() {
  return useQuery({
    queryKey: ['github', 'good-first-issues'],
    queryFn: fetchGoodFirstIssues,
    staleTime: GITHUB_STALE_TIME,
  })
}

export { REPO_URL }
