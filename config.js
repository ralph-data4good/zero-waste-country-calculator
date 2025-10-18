// config.js — Single source of truth for brand, copy, presets, and resources.
// Editors: Update values here. Avoid changing app.js.

export const BRAND = {
  name: "Zero Waste Asia",
  primary: "#2563EB",
  primaryContrast: "#FFFFFF",
  accent: "#22A26A",
  neutral900: "#1F2937",
  neutral700: "#4B5563",
  neutral200: "#E5E7EB",
  success: "#22A26A",
  danger: "#E11D2E"
};

export const COPY = {
  appTitle: "Zero Waste Asia Calculator",
  step0Title: "Map your nearest scenario",
  step1Title: "Choose your scenario",
  step2Title: "Presets & minimal edits",
  out1Title: "Waste Characterization",
  out2Title: "Waste Diversion with Composting",
  out3Title: "Potential Income (Composting & Recycling)",
  phIncomeExplain: "Income calculation uses {participation%} participation rate with {LIB/HIB} weekly rates.",
  idIncomeExplain: "Recycling income based on {LIB/HIB} weekly rates per household.",
  pdfDisclaimer:
    "This tool provides indicative estimates based on scenario presets and limited inputs. Presets are averages and may not reflect specific local conditions. Prices and participation vary. Use for planning and education, not formal reporting or procurement.",
  footerHeader: "Featured best practice resources on Organics Management"
};

// ============ Step 0: User-Friendly Scenario Mapping (Q1-Q7 + Unsure) ============

// User-facing scenario labels (hide internal keys)
export const SCENARIO_LABELS = {
  // PH
  "ph_urban_lgu_or":       "City LGU",
  "ph_rural_lgu_o":        "Rural LGU",
  "ph_island_lgu_or":      "Coastal Island LGU",
  "ph_mountain_lgu_o":     "Mountain LGU",
  
  // ID
  "id_urban_lgu_or":       "Urban LGU",
  "id_rural_lgu_o":        "Rural LGU",
  "id_island_lgu_or":      "Coastal Island LGU",
  "id_mountain_lgu_o":     "Mountain LGU"
};

// Q2: Activity options (with Unsure)
export const ACTIVITY_OPTIONS = [
  "Farming",
  "Fishing",
  "Agriculture (crops)",
  "Manufacturing",
  "Tourism services",
  "Retail/Trade",
  "Services (general)",
  "Construction",
  "Education/Government",
  "Waste & Recycling",
  "Other",
  "Unsure"
];

// Q1: Area types
export const AREA_TYPES = ["Urban", "Peri-urban", "Rural", "Unsure"];

// Q5: Population bands
export const POPULATION_BANDS = [
  { key: "micro", label: "<5k" },
  { key: "small", label: "5–50k" },
  { key: "medium", label: "50–250k" },
  { key: "large", label: "250k–1M" },
  { key: "vlarge", label: ">1M" },
  { key: "unsure", label: "Unsure" }
];

// Q6: Participation levels
export const PARTICIPATION_LEVELS = [
  { key: "none", label: "None (0–10%)" },
  { key: "emerging", label: "Emerging (10–30%)" },
  { key: "moderate", label: "Moderate (30–60%)" },
  { key: "high", label: "High (>60%)" },
  { key: "unsure", label: "Unsure" }
];

// Q7: Collection frequency
export const COLLECTION_FREQ = [
  { key: "none", label: "None" },
  { key: "weekly", label: "Weekly" },
  { key: "2to3", label: "2–3×/week" },
  { key: "daily", label: "Daily" },
  { key: "unsure", label: "Unsure" }
];

// Space bands (optional, for future use)
export const SPACE_BANDS = [
  { key: "none", label: "No dedicated space" },
  { key: "small", label: "Small (≤50 m²)" },
  { key: "medium", label: "Medium (50–200 m²)" },
  { key: "large", label: "Large (>200 m²)" },
  { key: "unsure", label: "Unsure" }
];

// Scenario presets — Standardized across PH and ID (LGU focus only)
export const SCENARIO_PRESETS = [
  /* ——— PHILIPPINES (LGU focus) ——— */
  {
    country: "PH",
    key: "ph_urban_or",
    label: "Urban LGU — Organics + Recycling",
    unit: "LGU",
    waste: {
      pcw: 0.65, // kg/person/day
      composition: { bio: 0.52, recy: 0.28, res: 0.15, haz: 0.03, spec: 0.02 },
      avg_household_size: 4.1
    },
    defaults: { income_model_default: "org+recy", org_div_default: 0.40, yield_default: 0.20, compost_price_default: 3500 },
    recycling: { factor_rate_type: "LIB", factor_rate_value: 35, participation_default: 0.60 },
    editable: { population: true, households: true, hh_size: false, participation: true, org_div: true, yield: true, compost_price: true },
    display: { currency_code:"PHP", currency_symbol:"₱", description:"Metro Manila barangay", version:"1.0", valid_from:"2025-01-01", valid_to:"2025-12-31", source:"NCR waste characterization study 2024" }
  },
  {
    country: "PH",
    key: "ph_island_or",
    label: "Island LGU — Organics + Recycling",
    unit: "LGU",
    waste: {
      pcw: 0.48,
      composition: { bio: 0.58, recy: 0.22, res: 0.16, haz: 0.02, spec: 0.02 },
      avg_household_size: 4.8
    },
    defaults: { income_model_default: "org+recy", org_div_default: 0.50, yield_default: 0.20, compost_price_default: 2800 },
    recycling: { factor_rate_type: "LIB", factor_rate_value: 20, participation_default: 0.35 },
    editable: { population: true, households: true, hh_size: false, participation: true, org_div: true, yield: true, compost_price: true },
    display: { currency_code:"PHP", currency_symbol:"₱", description:"Island municipality", version:"1.0", valid_from:"2025-01-01", valid_to:"2025-12-31", source:"Island waste baseline study 2024" }
  },
  {
    country: "PH",
    key: "ph_mountain_o",
    label: "Mountain LGU — Organics only",
    unit: "LGU",
    waste: {
      pcw: 0.42,
      composition: { bio: 0.62, recy: 0.15, res: 0.19, haz: 0.02, spec: 0.02 },
      avg_household_size: 5.2
    },
    defaults: { income_model_default: "organics", org_div_default: 0.55, yield_default: 0.20, compost_price_default: 2200 },
    recycling: null,
    editable: { population: true, households: true, hh_size: false, participation: false, org_div: true, yield: true, compost_price: true },
    display: { currency_code:"PHP", currency_symbol:"₱", description:"Mountain municipality", version:"1.0", valid_from:"2025-01-01", valid_to:"2025-12-31", source:"Cordillera waste assessment 2024" }
  },
  {
    country: "PH",
    key: "ph_rural_o",
    label: "Rural LGU — Organics only",
    unit: "LGU",
    waste: {
      pcw: 0.38,
      composition: { bio: 0.65, recy: 0.12, res: 0.19, haz: 0.02, spec: 0.02 },
      avg_household_size: 5.0
    },
    defaults: { income_model_default: "organics", org_div_default: 0.60, yield_default: 0.20, compost_price_default: 2000 },
    recycling: null,
    editable: { population: true, households: true, hh_size: false, participation: false, org_div: true, yield: true, compost_price: true },
    display: { currency_code:"PHP", currency_symbol:"₱", description:"Rural municipality", version:"1.0", valid_from:"2025-01-01", valid_to:"2025-12-31", source:"Rural waste baseline 2024" }
  },

  /* ——— INDONESIA (LGU focus) ——— */
  {
    country: "ID",
    key: "id_urban_or",
    label: "Urban LGU — Organics + Recycling",
    unit: "LGU",
    waste: {
      pcw: 0.65,
      composition: { bio: 0.52, recy: 0.28, res: 0.15, haz: 0.03, spec: 0.02 },
      avg_household_size: 4.1
    },
    defaults: { income_model_default: "org+recy", org_div_default: 0.40, yield_default: 0.20, compost_price_default: 3500 },
    recycling: { factor_rate_type: "LIB", factor_rate_value: 35000, participation_default: 0.60 },
    editable: { population: true, households: true, hh_size: false, participation: true, org_div: true, yield: true, compost_price: true },
    display: { currency_code:"IDR", currency_symbol:"Rp", description:"Jakarta municipality", version:"1.0", valid_from:"2025-01-01", valid_to:"2025-12-31", source:"Jakarta waste characterization study 2024" }
  },
  {
    country: "ID",
    key: "id_island_or",
    label: "Island LGU — Organics + Recycling",
    unit: "LGU",
    waste: {
      pcw: 0.48,
      composition: { bio: 0.58, recy: 0.22, res: 0.16, haz: 0.02, spec: 0.02 },
      avg_household_size: 4.8
    },
    defaults: { income_model_default: "org+recy", org_div_default: 0.50, yield_default: 0.20, compost_price_default: 2800 },
    recycling: { factor_rate_type: "LIB", factor_rate_value: 20000, participation_default: 0.35 },
    editable: { population: true, households: true, hh_size: false, participation: true, org_div: true, yield: true, compost_price: true },
    display: { currency_code:"IDR", currency_symbol:"Rp", description:"Island municipality", version:"1.0", valid_from:"2025-01-01", valid_to:"2025-12-31", source:"Island waste baseline study 2024" }
  },
  {
    country: "ID",
    key: "id_mountain_o",
    label: "Mountain LGU — Organics only",
    unit: "LGU",
    waste: {
      pcw: 0.42,
      composition: { bio: 0.62, recy: 0.15, res: 0.19, haz: 0.02, spec: 0.02 },
      avg_household_size: 5.2
    },
    defaults: { income_model_default: "organics", org_div_default: 0.55, yield_default: 0.20, compost_price_default: 2200 },
    recycling: null,
    editable: { population: true, households: true, hh_size: false, participation: false, org_div: true, yield: true, compost_price: true },
    display: { currency_code:"IDR", currency_symbol:"Rp", description:"Mountain municipality", version:"1.0", valid_from:"2025-01-01", valid_to:"2025-12-31", source:"Mountain waste assessment 2024" }
  },
  {
    country: "ID",
    key: "id_rural_o",
    label: "Rural LGU — Organics only",
    unit: "LGU",
    waste: {
      pcw: 0.38,
      composition: { bio: 0.65, recy: 0.12, res: 0.19, haz: 0.02, spec: 0.02 },
      avg_household_size: 5.0
    },
    defaults: { income_model_default: "organics", org_div_default: 0.60, yield_default: 0.20, compost_price_default: 2000 },
    recycling: null,
    editable: { population: true, households: true, hh_size: false, participation: false, org_div: true, yield: true, compost_price: true },
    display: { currency_code:"IDR", currency_symbol:"Rp", description:"Rural municipality", version:"1.0", valid_from:"2025-01-01", valid_to:"2025-12-31", source:"Rural waste baseline 2024" }
  }
];

// Featured resources
// Resource cards with banner images (for card-based UI)
export const RESOURCES = [
  {
    country: "PH",
    audience: "LGU",
    title: "Barangay Composting Starter SOP",
    blurb: "Simple SOPs for segregated collection and compost operations.",
    url: "#",
    img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%' height='100%' fill='%232563EB'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='44' font-family='Schibsted Grotesk'>Zero Waste Asia Resource</text></svg>"
  },
  {
    country: "PH",
    audience: "LGU",
    title: "Model Ordinance: Organics Diversion",
    blurb: "Template ordinance to enable household and clustered organics systems.",
    url: "#",
    img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%' height='100%' fill='%23D4A637'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='%23000' font-size='44' font-family='Schibsted Grotesk'>Zero Waste Asia Resource</text></svg>"
  },
  {
    country: "ID",
    audience: "Household",
    title: "Kompos di Rumah (Panduan Cepat)",
    blurb: "Langkah cepat membuat kompos di rumah untuk pemula.",
    url: "#",
    img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%' height='100%' fill='%2322A26A'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='44' font-family='Schibsted Grotesk'>Zero Waste Asia Resource</text></svg>"
  },
  {
    country: "ID",
    audience: "Household",
    title: "Bank Sampah: Cara Mulai",
    blurb: "Panduan ringkas memulai bank sampah di lingkunganmu.",
    url: "#",
    img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'><rect width='100%' height='100%' fill='%23E9722A'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='44' font-family='Schibsted Grotesk'>Zero Waste Asia Resource</text></svg>"
  }
];

// Legacy format (for backwards compatibility)
export const RESOURCES_LINKS = [
  {
    country:"PH", audience:"LGU",
    items:[
      { title:"Barangay-scale Composting Guide", url:"https://example.com/composting-guide", blurb:"Complete SOPs for segregate–compost systems in barangay settings." },
      { title:"Model Ordinance: Organics Diversion", url:"https://example.com/model-ordinance", blurb:"Template ordinance for mandatory organics diversion at LGU level." },
      { title:"Case Study: Boracay Zero Waste Program", url:"https://example.com/boracay-case", blurb:"Island LGU success story with organics + recycling track." },
      { title:"Financial Planning for Composting", url:"https://example.com/financial-planning", blurb:"Budget templates and revenue projections for composting programs." },
      { title:"Community Engagement Toolkit", url:"https://example.com/engagement-toolkit", blurb:"Strategies for increasing household participation in waste programs." },
      { title:"Monitoring & Evaluation Framework", url:"https://example.com/monitoring-framework", blurb:"Tools for tracking program performance and impact metrics." }
    ]
  },
  {
    country:"ID", audience:"LGU",
    items:[
      { title:"Panduan Kompos Skala Kecamatan", url:"https://example.com/kompos-guide", blurb:"Panduan lengkap sistem pemilahan dan kompos di tingkat kecamatan." },
      { title:"Peraturan Model: Pengalihan Organik", url:"https://example.com/peraturan-model", blurb:"Template peraturan untuk pengalihan organik wajib di tingkat pemerintah daerah." },
      { title:"Studi Kasus: Program Zero Waste Pulau", url:"https://example.com/case-study", blurb:"Kisah sukses pemerintah pulau dengan program organik + daur ulang." },
      { title:"Perencanaan Keuangan untuk Kompos", url:"https://example.com/keuangan", blurb:"Template anggaran dan proyeksi pendapatan untuk program kompos." },
      { title:"Toolkit Keterlibatan Masyarakat", url:"https://example.com/keterlibatan", blurb:"Strategi untuk meningkatkan partisipasi rumah tangga dalam program sampah." },
      { title:"Kerangka Monitoring & Evaluasi", url:"https://example.com/monitoring", blurb:"Alat untuk melacak kinerja dan metrik dampak program." }
    ]
  }
];
