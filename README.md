# Starbucks Data Hub

An independent, deeply-researched data hub about Starbucks — history, culture, an interactive pan/zoom map of every market (drillable from country down to state/city), coffee sourcing, supply chain, sales performance, and a full menu-build hierarchy. Built as a static site (Astro + Tailwind CSS + Leaflet + Chart.js) so it can be hosted for free on GitHub Pages.

**Not affiliated with, endorsed by, or sponsored by Starbucks Corporation.** All data is sourced from Starbucks' own SEC filings (10-K/10-Q/8-K), annual/Global Impact Reports, investor materials, and third-party retail analytics (Statista, ScrapeHero, World Population Review), current through mid-2026. Every figure on the site is labeled **Reported** (directly sourced) or **Estimated** (best available approximation) — see the Methodology note in the footer of every page.

## Pages

1. **Home** — overview & key stats
2. **History** — founding through 2026, full timeline + what made it successful
3. **Challenges** — crises solved (2008 crash, Philadelphia incident, Australia's failed launch...) and problems still being fought (unionization, China competition, the cost of the turnaround)
4. **Culture** — mission, "Third Place," five core values, partner benefits, sustainability
5. **Global Presence** — interactive map (71 markets, Google-Maps-style pan/zoom with clustering), click-to-drill into U.S. states or notable cities, full country + state data tables
6. **Coffee & Sourcing** — origin regions/countries, C.A.F.E. Practices ethics program
7. **Supply Chain** — Farmer Support Centers, roasting plants, workforce breakdown, labor relations
8. **Sales & Performance** — revenue by segment/category, comparable-sales trend through the turnaround, top markets
9. **Menu Explorer** — every drink category + the 8-step bean-to-cup build hierarchy

## Tech stack

- [Astro](https://astro.build) — static site generator, file-based routing, ships zero JS by default
- [Tailwind CSS v4](https://tailwindcss.com) — CSS-first theme config in `src/styles/global.css`
- [Leaflet](https://leafletjs.com) + [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) — the interactive map, CARTO Voyager basemap tiles
- [Chart.js](https://www.chartjs.org) — bar/line/doughnut charts
- All data lives in plain JSON files under `src/data/` — easy to update without touching any markup

## Local development

Requires [Node.js](https://nodejs.org) 20+.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs to ./dist
npm run preview   # preview the production build locally
```

## Deploying to GitHub Pages

This repo already includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys automatically on every push to `main`, and `astro.config.mjs` is already configured for **https://github.com/Wai-999/History-Explore**:
```js
site: 'https://Wai-999.github.io',
base: '/History-Explore',
```

The local repo is already committed, on branch `main`, with `origin` already pointing at `https://github.com/Wai-999/History-Explore.git`. To go live:

1. **Push it** (from a terminal authenticated to your own GitHub account — Claude can't authenticate as you):
   ```bash
   cd starbucks-data-hub
   git push -u origin main
   ```
   If it asks for credentials and you haven't set up a credential helper, either use [GitHub Desktop](https://desktop.github.com) to add/push this existing repo, or authenticate the CLI with `gh auth login` first (requires the [GitHub CLI](https://cli.github.com)).
2. **Enable Pages.** In the repo on GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions.**
3. **Done.** The workflow in `.github/workflows/deploy.yml` runs automatically, builds the site, and deploys it. The site will be live at `https://Wai-999.github.io/History-Explore/` a minute or two after the workflow finishes (check the **Actions** tab for progress).

If you ever rename the repo or move it under a different account, update the two lines above in `astro.config.mjs` to match.

Any future push to `main` re-deploys automatically — no manual steps needed after the first setup.

## Updating the data

Every number on the site comes from a JSON file in `src/data/`:

| File | Powers |
|---|---|
| `countries.json` | The map + full country table |
| `usStates.json` | U.S. state drill-down |
| `cities.json` | Notable cities + Reserve Roastery flagships |
| `coffeeOrigins.json` | Coffee sourcing regions & C.A.F.E. Practices |
| `supplyChain.json` | Farmer Support Centers, roasting plants, workforce, labor relations |
| `sales.json` | Revenue, comparable sales, restructuring costs |
| `menu.json` | Menu categories + the build-hierarchy diagram |
| `history.json` | Timeline events |
| `challenges.json` | Problems solved / problems ongoing |
| `culture.json` | Mission, values, sustainability |

Edit the JSON, run `npm run build` (or just push — the Action rebuilds automatically), and the relevant page updates. No component code needs to change for a data-only update.
