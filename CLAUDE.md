# CLAUDE.md

## Project Overview

Dragon Adventures knowledge base for a player who wants to trade for a Veidreki dragon. Contains curated game info and wiki scrapes from the Dragon Adventures Fandom wiki.

## Key Files

- `dragon-adventures-kb.md` — Hand-curated knowledge base (lair costs, dragons, breeding, etc.)
- `*-wiki.md` — Cleaned wiki scrapes from dragon-adventures.fandom.com
- `scrape.mjs` — Automated wiki scraper tool

## Wiki Scraper

To scrape a new Fandom wiki page into clean markdown:

```bash
node scrape.mjs <PageName>              # e.g. node scrape.mjs Stables
node scrape.mjs --batch Page1 Page2     # multiple pages
```

The scraper uses Playwright (headless Chromium with user-agent) to load Fandom pages, extracts `.mw-parser-output` content, strips ads/navigation/comments, and converts HTML to markdown. Output naming convention: `pagename-wiki.md` (lowercase, hyphens).

Dependencies: `playwright`, `@mozilla/readability`, `jsdom` (installed via npm).

## Conventions

- Wiki scrape files are named `<topic>-wiki.md`
- All wiki content is sourced from https://dragon-adventures.fandom.com/wiki/
- The curated KB (`dragon-adventures-kb.md`) is manually maintained and may overlap with wiki scrapes
