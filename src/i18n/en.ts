export const en = {
  site: {
    name: 'Waqf Toolkit',
    tagline:
      'Free, open-source digital tools for everyday needs. Local-first, privacy-respecting, honestly labelled.',
    navTools: 'Tools',
    navContribute: 'Contribute',
    navGithub: 'GitHub',
    languageSwitch: 'العربية',
    languageSwitchLabel: 'Switch to Arabic',
    footerNote:
      'Waqf Toolkit is an independent open-source project. It lives inside the Waqf ecosystem as a showcased project, but is developed and deployed on its own.',
    footerLicense: 'Released under the Apache-2.0 license.',
  },
  home: {
    heroTitle: 'Open tools with a clear job',
    heroSubtitle:
      'A collection of small, focused utilities that respect your files and your privacy. Everything runs on your device whenever possible, every project states what it does and what it does not do yet.',
    browseTools: 'Browse tools',
    readPrinciples: 'How we work',
    statsTitle: 'The repository right now',
    statsStars: 'Stars',
    statsForks: 'Forks',
    statsIssues: 'Open issues',
    statsContributors: 'Contributors',
    statsUnavailable: 'Live GitHub stats are unavailable right now.',
    featuredTitle: 'Featured projects',
    featuredSubtitle:
      'A few of the utilities currently in the toolkit. Some are usable today, others are being built in the open.',
    viewAllTools: 'View all tools',
    principlesTitle: 'How we work',
    principlesSubtitle:
      'Short rules that keep the toolkit useful and trustworthy. No slogans, just how things are run.',
    principle1Title: 'Local first',
    principle1Body:
      'Tools process your files on your own device. If a tool ever needs a network call, the interface says so plainly before you use it.',
    principle2Title: 'Honest status',
    principle2Body:
      'Every project is labelled Available, Experimental, or Planned. We do not present unfinished work as finished.',
    principle3Title: 'Limits are visible',
    principle3Body:
      'Each tool documents its calculation methodology and data sources. For anything sensitive, review requirements are stricter than usual.',
    principle4Title: 'Open stack',
    principle4Body:
      'Everything here is open source under permissive licenses. Inspect the code, fork it, or open an issue.',
    suggestTitle: 'Missing something?',
    suggestBody:
      'If there is a small, repetitive task that deserves a good tool, tell us about it. Suggestions shape the roadmap.',
    suggestCta: 'Suggest a tool',
  },
  directory: {
    title: 'Toolkit directory',
    subtitle:
      'Every tool in one place. Search by task or format, filter by category and status, and check the privacy note before you commit to anything.',
    searchPlaceholder: 'Search by task, format, or name',
    allCategories: 'All categories',
    allStatuses: 'Any status',
    clearFilters: 'Clear filters',
    resultsCount: '{count} of {total} tools',
    noResults: 'Nothing matches those filters.',
    noResultsHint: 'Try another search term or clear the filters.',
    emptySavedTitle: 'No saved tools yet',
    emptySavedBody: 'Save tools from their pages and they will show up here.',
    showSavedOnly: 'Saved only',
    backToDirectory: 'Back to directory',
  },
  tool: {
    privacyNote: 'Privacy note',
    formats: 'Works with',
    stack: 'Stack',
    license: 'License',
    status: 'Status',
    updated: 'Updated',
    repository: 'Source code',
    openTool: 'Open the tool',
    roadmap: 'Roadmap discussion',
    repoUnavailable:
      'This project has not been published yet. The repository link will go live when the first version ships.',
    relatedTools: 'Related tools',
    saveTool: 'Save for later',
    savedTool: 'Saved',
    notFoundTitle: 'Tool not found',
    notFoundBody: 'There is no tool at this address. It may have been renamed.',
  },
  contribute: {
    title: 'Contribute',
    subtitle:
      'Waqf Toolkit is built by people who notice small, awkward tasks and fix them properly. You do not need to be an expert; you need to care about doing things cleanly.',
    waysTitle: 'Ways to help',
    way1Title: 'Build a tool',
    way1Body:
      'Pick something from the roadmap or propose your own. Small scope and a clear job beat big promises.',
    way2Title: 'Review sensitive logic',
    way2Body:
      'Calculation-heavy features get extra scrutiny. If you know the domain, your review is worth a lot.',
    way3Title: 'Improve the docs',
    way3Body:
      'Clear documentation is part of the product, not an afterthought. Translations count too.',
    way4Title: 'Report what breaks',
    way4Body:
      'A precise bug report saves hours. Screenshots and steps to reproduce are gold.',
    goodFirstIssues: 'Good first issues',
    goodFirstIssuesHint: 'Pulled live from the GitHub repository.',
    issuesUnavailable:
      'Could not load issues from GitHub right now. Check the repository directly.',
    viewOnGithub: 'View on GitHub',
    suggestTitle: 'Suggest a tool',
    suggestBody:
      'Tell us about the task you wish had a better tool. This form runs locally in this demo and does not send data anywhere yet.',
    fieldName: 'Tool name or task',
    fieldNamePlaceholder: 'e.g. Batch-renaming scanned lecture notes',
    fieldProblem: 'What problem does it solve?',
    fieldProblemPlaceholder:
      'Describe the repetitive task and who runs into it.',
    fieldEmail: 'Your email (optional)',
    submit: 'Submit suggestion',
    submitting: 'Submitting…',
    successTitle: 'Noted. Thank you.',
    successBody:
      'This demo does not store submissions yet. In the meantime, opening a GitHub issue is the fastest way to get something on the roadmap.',
    successIssueLink: 'Open a GitHub issue instead',
    anotherIdea: 'Submit another idea',
    validationName: 'Please describe the tool or task.',
    validationProblem: 'A sentence about the problem helps us prioritize.',
  },
  tryTool: {
    title: 'Try it',
    inputLabel: 'Paste a link',
    inputPlaceholder: 'https://example.com/article?utm_source=news&id=42',
    cleanLabel: 'Cleaned link',
    copy: 'Copy',
    copied: 'Copied',
    removedTitle: 'Removed parameters',
    noneRemoved: 'Nothing to remove — this link is already clean.',
    invalidUrl: 'That does not look like a valid link.',
    disclaimer: 'Runs entirely in your browser. The link is never sent anywhere.',
  },
  status: {
    available: 'Available',
    experimental: 'Experimental',
    planned: 'Planned',
  },
  category: {
    Media: 'Media',
    Privacy: 'Privacy',
    Documents: 'Documents',
    Everyday: 'Everyday',
  },
  common: {
    home: 'Home',
    notFoundTitle: 'Page not found',
    notFoundBody:
      'The page may have moved, or the link may be incomplete. The toolkit directory is a good place to restart.',
    goHome: 'Go home',
    skipToContent: 'Skip to content',
  },
}

export type Dictionary = typeof en
