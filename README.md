## Country-Focused Community Waste Management Program Calculator

A zero-build, single-page web app for the Zero Waste Asia platform. It models country-focused scenarios for the Philippines (PH) and Indonesia (ID) and outputs waste characterization, diversion with composting, and potential income.

### Quick start
- Open `index.html` in any modern browser. No server or build tools required.
- Share state: click "Copy share link" to copy a URL that restores the full UI state.
- Print/PDF: click "Print / Save PDF" to generate a single-page report with a disclaimer and featured resources.

### Project structure
- `index.html` — semantic layout (header, 5 steps, resources footer, print disclaimer)
- `styles.css` — brand tokens, light/dark, components, responsive + print styles
- `app.js` — state, URL share/restore, validation, calculators, renderers, lazy Chart.js
- `config.js` — single source of truth for brand colors, copy, scenario presets, resources
- `presets.sample.json` — placeholder export container for future server storage
- `assets/*` — logo and small icons

### Editing the app (non-coders)
Most customization happens in `config.js` and the top of `styles.css`.

1) Colors (brand tokens)
- In `styles.css`, edit CSS variables under `:root` (e.g., `--zw-primary`, `--zw-accent`).
- Optionally, adjust `BRAND` in `config.js`; these values are also applied at runtime.

2) Copy strings
- Edit `COPY` in `config.js` (app title, step titles, explanations, PDF disclaimer, footer header).

3) Scenario presets (PH and ID)
- Edit the `SCENARIO_PRESETS` array in `config.js`.
- Required fields per entry:
  - `country`: `"PH" | "ID"`
  - `key`: unique ID string
  - `label`: scenario name (shown in cards)
  - `unit`: `"LGU" | "household" | "individual"`
  - `waste`: `{ pcw, composition: { bio, recy, res, haz, spec }, avg_household_size }`
    - PH pcw = kg/person/day
    - ID household pcw = kg/household/day
  - `defaults`: `{ income_model_default, org_div_default, yield_default, compost_price_default }`
  - `recycling` (optional): `{ factor_rate_type: 'LIB'|'HIB', factor_rate_value, participation_default? }`
  - `editable`: booleans controlling which inputs appear in Step 2
  - `display`: `{ currency_code, currency_symbol, description, version, valid_from, valid_to, source }`

4) Featured resources
- Edit `RESOURCES_LINKS` in `config.js` with country + audience items. These render in the footer and print/PDF.

### Using the app
1. Step 0 (Pre-scenario): Choose country, enter locality, and answer a few quick questions. Click "Suggest scenario" to preselect a scenario for Step 1.
2. Step 1: Confirm country, locality, and pick a scenario card.
3. Step 2: Review the read-only Presets + provenance; edit only the fields allowed for that scenario/country. Inline validation prevents invalid values.
4. Step 3: Waste Characterization — Pie chart + compact table. Units differ by country:
   - PH: t/day
   - ID: kg per chosen period (Day/Week/Month/Year tabs)
5. Step 4: Diversion with Composting — Adjust OrgDiv, Yield, and Compost price. KPIs update live.
6. Step 5: Income — PH shows default track (Organics or Org+Recy). ID can include recycling income via a toggle.

### Calculations (summary)
- PH (LGU)
  - `WG_t_day = (pcw × P) / 1000`
  - `BIO_t_day = WG_t_day × bio`
  - `ORG_div_t_day = BIO_t_day × OrgDiv`
  - `Compost_t_year = ORG_div_t_day × 365 × Yield`
  - `CompostRevenue_year = Compost_t_year × compost_price`
  - `H = user_HH || round(P/HHsize)`; `H_part = H × participation`
  - `Income_week = H_part × factor_rate_value`; `Income_month = ×4`
- ID (Household/Individual)
  - `WG_kg_period = pcw × (HHsize or 1) × periodFactor`
  - `BIO_period = WG_kg_period × bio`
  - `ORG_div_period = BIO_period × OrgDiv`
  - `Compost_period = ORG_div_period × Yield` (also annualized: `× 365/periodFactor`)
  - `Income_week = factor_rate_value`; `Income_month = ×4`

### Performance & a11y
- No frameworks; initial JS kept lean and Chart.js is lazy-loaded when outputs are shown.
- Keyboard navigable controls, labels, visible focus, and simple inline errors.
- Respects `prefers-color-scheme` and `prefers-reduced-motion`.

### Sharing & persistence
- App state is serialized into the URL hash; copy the link to share and restore state.
- Last-used state is also saved to `localStorage` as a fallback.

### Print / PDF
- Click the print button to open the browser print dialog.
- The PDF includes the top disclaimer (from `COPY.pdfDisclaimer`), scenario titles, charts, tables, and resource links.

### Editing tips
- Keep composition shares summing to 1.
- Validate placeholder rates with your team before publishing the tool.
- Currency formatting follows `display.currency_code`.

### Troubleshooting
- If charts do not load, check network access to the CDN: `https://cdn.jsdelivr.net/npm/chart.js@4`.
- If the share URL is long, ensure you copied the entire address including the `#` hash.

### License / attribution
This MVP is designed for demonstration and planning. Data presets are placeholders unless replaced by your team. © Zero Waste Asia.


