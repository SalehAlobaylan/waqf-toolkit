# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| latest on `main` | yes |
| older tags/branches | no |

## Reporting a vulnerability

**Do not open a public GitHub issue for security problems.**

Report privately through [GitHub's private vulnerability reporting](https://github.com/SalehAlobaylan/waqf-toolkit/security/advisories/new), or contact [@SalehAlobaylan](https://github.com/SalehAlobaylan) directly.

Include what you found, how to reproduce it, and the impact if possible.

## What to expect

- Acknowledgement within 7 days.
- An assessment and fix plan as soon as practical; sensitive fixes are coordinated before public disclosure.

## Scope notes

- This site is mostly static content plus read-only calls to the public GitHub API. It intentionally has no accounts, uploads, or databases.
- The most security-relevant surface is **client-side file processing tools** (current and planned). If you find a way a tool could exfiltrate user files or misrepresent where processing happens, that is a high-priority report.
- If you believe a calculation error exists in any religious-computation feature (prayer times, Hijri dates, etc.), report it through this same channel — accuracy bugs in these features are treated as serious defects.
