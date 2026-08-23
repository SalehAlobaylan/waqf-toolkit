export const REPO_OWNER = 'SalehAlobaylan'
export const REPO_NAME = 'waqf-toolkit'
export const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`

export type RepoStats = {
  stars: number
  forks: number
  openIssues: number
  contributors: number
}

export type RepoIssue = {
  title: string
  url: string
  number: number
  labels: string[]
  comments: number
}

const GH_API = 'https://api.github.com'

async function ghFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${GH_API}${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status} for ${path}`)
  }
  return response.json() as Promise<T>
}

type ApiRepo = {
  stargazers_count: number
  forks_count: number
  open_issues_count: number
}

type ApiContributor = { login: string }

type ApiIssue = {
  title: string
  html_url: string
  number: number
  comments: number
  pull_request?: unknown
  labels: Array<{ name: string }>
}

export async function fetchRepoStats(): Promise<RepoStats> {
  const [repo, contributors] = await Promise.all([
    ghFetch<ApiRepo>(`/repos/${REPO_OWNER}/${REPO_NAME}`),
    ghFetch<ApiContributor[]>(
      `/repos/${REPO_OWNER}/${REPO_NAME}/contributors?per_page=100&anon=true`,
    ),
  ])
  return {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    contributors: contributors.length,
  }
}

export async function fetchGoodFirstIssues(): Promise<RepoIssue[]> {
  const issues = await ghFetch<ApiIssue[]>(
    `/repos/${REPO_OWNER}/${REPO_NAME}/issues?labels=${encodeURIComponent(
      'good first issue',
    )}&state=open&per_page=5`,
  )
  return issues
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      title: issue.title,
      url: issue.html_url,
      number: issue.number,
      labels: issue.labels.map((label) => label.name),
      comments: issue.comments,
    }))
}
