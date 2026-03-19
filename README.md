# Dragon Adventures Knowledge Base

A collection of game knowledge and reference materials for [Dragon Adventures](https://www.roblox.com/games/3475397644/Dragon-Adventures) on Roblox. Focused on helping trade for a Veidreki.

## Veidreki Plan

- **[veidreki-plan.md](veidreki-plan.md)** — Step-by-step plan to get a Veidreki (F2P). 4/6 Legacy Tokens collected, Veidreki Token still needed (event ends April 3). ETA: ~June 2026.

## Curated Knowledge Base

- **[dragon-adventures-kb.md](dragon-adventures-kb.md)** — Comprehensive knowledge base covering lair slots, upgrade costs, dragons, elements, breeding, worlds, and game mechanics.

## Wiki Scrapes (Raw Reference Data)

### Veidreki & Trading
- **[veidreki-wiki.md](veidreki-wiki.md)** — Veidreki dragon stats, rarity, and details
- **[veidreki-event-wiki.md](veidreki-event-wiki.md)** — Veidreki Live Event (returned March 13, 2026)
- **[trading-wiki.md](trading-wiki.md)** — Trading mechanics, tradable vs untradable items
- **[mutations-wiki.md](mutations-wiki.md)** — Mutations (key for increasing dragon trade value)
- **[potions-wiki.md](potions-wiki.md)** — Potions (major trade currency)

### Game Mechanics
- **[breeding-wiki.md](breeding-wiki.md)** — Breeding mechanics and mutation chances
- **[alchemy-wiki.md](alchemy-wiki.md)** — Alchemy/crafting system for potions
- **[lair-wiki.md](lair-wiki.md)** — Lair storage and upgrade costs

### Dragons & Worlds
- **[official-dragons-wiki.md](official-dragons-wiki.md)** — Complete list of all dragons
- **[dragon-seasons-wiki.md](dragon-seasons-wiki.md)** — Dragon Seasons rewards and timelines
- **[worlds-wiki.md](worlds-wiki.md)** — All worlds and their resources

## Scraper Tool

**[scrape.mjs](scrape.mjs)** — Automated wiki scraper that fetches Dragon Adventures Fandom pages and outputs clean markdown.

```bash
# Install dependencies (first time only)
npm install && npx playwright install chromium

# Scrape a single page
node scrape.mjs Stables                    # -> stables-wiki.md
node scrape.mjs Veidreki_Live_Event        # -> veidreki-live-event-wiki.md
node scrape.mjs Potions potions-wiki.md    # custom output name

# Scrape multiple pages at once
node scrape.mjs --batch Stables Bank Eggs Elements VIP_Servers
```

Uses Playwright + Readability to bypass Fandom's bot blocking, extract article content, strip navigation/ads/chrome, and convert to clean markdown with proper tables and links.
