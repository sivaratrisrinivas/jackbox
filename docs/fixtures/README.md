# Fixture Guide

Fixtures keep Jackbox deterministic in local development and tests before live
Firecrawl crawling is enabled.

## Conventions

- Store one JSON file per prospect in this directory.
- Keep the filename aligned with the `fixtureId` inside the JSON payload.
- Include only public-site content that Jackbox is allowed to use in V1.

## Shape

Each fixture is validated by `ProspectFixtureSchema` in
`lib/firecrawl/fixtures.ts`.

```json
{
  "fixtureId": "acme-docs",
  "company": {
    "name": "Acme Cloud",
    "website": "https://acme.example.com"
  },
  "pages": [
    {
      "url": "https://acme.example.com/docs",
      "title": "Docs",
      "markdown": "# Welcome",
      "pageType": "docs"
    }
  ],
  "notes": ["Optional extra context"]
}
```

## Loading

Use `createFixtureLoader()` for adapter-style access or
`loadFixtureProspectData("acme-docs")` when a direct helper is enough.
