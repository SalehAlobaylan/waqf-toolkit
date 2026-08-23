import { useQuery } from '@tanstack/react-query'
import { fetchRepoStats, fetchGoodFirstIssues, REPO_URL } from '@/lib/github'

export function useRepoStats() {
  return useQuery({
    queryKey: ['github', 'repo-stats'],
    queryFn: fetchRepoStats,
  })
}

export function useGoodFirstIssues() {
  return useQuery({
    queryKey: ['github', 'good-first-issues'],
    queryFn: fetchGoodFirstIssues,
  })
}

export { REPO_URL }
