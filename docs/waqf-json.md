# waqf.json — Project Manifest Specification

**Version: 1**

`waqf.json` is a simple manifest that lets an open-source project declare its
identity to the [Waqf Platform](https://waqf-platform.vercel.app) and any other
directory or aggregator. The file lives at the repository root and is read as
static metadata — no build-time dependency, no SDK, no coupling.

Waqf Toolkit is the first implementation of this format.

## Placement

```
<repo-root>/
└── waqf.json
```

## Schema (version 1)

```jsonc
{
  "waqf": {
    "specVersion": 1,                    // required, number — manifest spec this file follows
    "name": "Project Name",              // required, string — display name
    "slug": "project-slug",              // required, string — kebab-case unique id
    "type": "open-source",               // required, enum — "open-source" | "community"
    "description": "One or two sentences describing the project.",
                                         // required, string, <= 280 chars
    "website": "https://project.example.org",
                                         // required, string (URL) — live deployment
    "repository": "https://github.com/owner/repo",
                                         // required, string (URL) — public source repo
    "categories": ["Category A"],        // required, string[] — free-form, 1–5 items
    "license": "Apache-2.0",             // required, string — SPDX identifier
    "languages": ["en", "ar"]            // optional, string[] — ISO 639-1 UI languages
  }
}
```

### Validation rules

1. The root object must contain exactly one key, `waqf`.
2. `slug` must match `/^[a-z0-9]+(-[a-z0-9]+)*$/`.
3. All URL fields must be absolute `https://` URLs.
4. `repository` must point at a publicly readable repository.
5. Arrays must be non-empty where marked required; order is significant
   (first category is primary).

## How the platform consumes it

- **Static card:** name, description, categories, license, and badges render
  from the manifest alone.
- **Live section:** issues, good-first-issues, contributors, and releases are
  fetched from the public GitHub API of `repository` — never from project
  builds.
- The platform links out (`Explore`, `Contribute`); it never imports project
  code.

## Adding your project

1. Add a valid `waqf.json` to your repository root.
2. Open an issue on the Waqf Platform repository proposing inclusion.
3. After review, your project appears in the directory with live contribution
   data.

## Versioning

Breaking changes bump `specVersion`. Readers must reject manifests with an
unknown `specVersion` rather than guessing.
