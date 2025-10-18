// step0-weights.js
// Weighting system for Step 0 scenario matching (Q1-Q7 + Unsure)
// "Unsure" options contribute NO delta (neutral)

// Q2: Activity Weights — per country, per activity, per scenario key
// Range: 0.1–0.9 (added to base score of 1.0)
export const ACTIVITY_WEIGHTS = {
  /* ========== PHILIPPINES ========== */
  PH: {
    "Farming": {
      ph_rural_lgu_o: 0.6,
      ph_mountain_lgu_o: 0.3
    },
    "Agriculture (crops)": {
      ph_rural_lgu_o: 0.6,
      ph_mountain_lgu_o: 0.2
    },
    "Fishing": {
      ph_island_lgu_or: 0.8,
      ph_rural_lgu_o: 0.2
    },
    "Manufacturing": {
      ph_urban_lgu_or: 0.7
    },
    "Tourism services": {
      ph_island_lgu_or: 0.6,
      ph_urban_lgu_or: 0.3
    },
    "Retail/Trade": {
      ph_urban_lgu_or: 0.5
    },
    "Services (general)": {
      ph_urban_lgu_or: 0.4
    },
    "Construction": {
      ph_urban_lgu_or: 0.3,
      ph_rural_lgu_o: 0.2
    },
    "Education/Government": {
      ph_urban_lgu_or: 0.2
    },
    "Waste & Recycling": {
      ph_urban_lgu_or: 0.4
    },
    "Other": {
      ph_rural_lgu_o: 0.2
    },
    "Unsure": {} // neutral
  },
  
  /* ========== INDONESIA ========== */
  ID: {
    "Farming": {
      id_rural_lgu_o: 0.7
    },
    "Agriculture (crops)": {
      id_rural_lgu_o: 0.7
    },
    "Fishing": {
      id_island_lgu_or: 0.8,
      id_rural_lgu_o: 0.3
    },
    "Manufacturing": {
      id_urban_lgu_or: 0.6
    },
    "Tourism services": {
      id_urban_lgu_or: 0.4,
      id_island_lgu_or: 0.5
    },
    "Retail/Trade": {
      id_urban_lgu_or: 0.4
    },
    "Services (general)": {
      id_urban_lgu_or: 0.4
    },
    "Construction": {
      id_urban_lgu_or: 0.3,
      id_rural_lgu_o: 0.2
    },
    "Education/Government": {
      id_urban_lgu_or: 0.2
    },
    "Waste & Recycling": {
      id_urban_lgu_or: 0.4
    },
    "Other": {
      id_rural_lgu_o: 0.2
    },
    "Unsure": {} // neutral
  }
};

// Q1, Q3, Q4: Geography Weights (Area / Relief / Island)
// "Unsure" contributes no delta
export const GEO_WEIGHTS = {
  /* ========== PHILIPPINES ========== */
  PH: {
    area: {
      Urban: {
        ph_urban_lgu_or: 0.6
      },
      "Peri-urban": {
        ph_urban_lgu_or: 0.3,
        ph_rural_lgu_o: 0.3
      },
      Rural: {
        ph_rural_lgu_o: 0.6
      },
      Unsure: {} // neutral
    },
    relief: {
      Flat: {
        ph_urban_lgu_or: 0.2,
        ph_rural_lgu_o: 0.2
      },
      Mountainous: {
        ph_mountain_lgu_o: 0.8
      },
      Unsure: {} // neutral
    },
    island: {
      true: {
        ph_island_lgu_or: 1.0
      },
      false: {},
      unsure: {} // neutral
    }
  },
  
  /* ========== INDONESIA ========== */
  ID: {
    area: {
      Urban: {
        id_urban_lgu_or: 0.6
      },
      "Peri-urban": {
        id_urban_lgu_or: 0.3,
        id_rural_lgu_o: 0.3
      },
      Rural: {
        id_rural_lgu_o: 0.6
      },
      Unsure: {} // neutral
    },
    relief: {
      Flat: {
        id_urban_lgu_or: 0.2,
        id_rural_lgu_o: 0.2
      },
      Mountainous: {
        id_mountain_lgu_o: 0.8
      },
      Unsure: {} // neutral
    },
    island: {
      true: {
        id_island_lgu_or: 1.0
      },
      false: {},
      unsure: {} // neutral
    }
  }
};

// Q5–Q7: Service/Participation/Frequency nudges
// These are generic "biases" that map to scenarios via applyNudges()
export const STEP0_NUDGES = {
  // Q5: Population band
  population: {
    micro: {
      // Small communities → barangay cluster or individual
      ph_rural_lgu_o: 0.3,
      id_rural_lgu_o: 0.2
    },
    small: {
      ph_rural_lgu_o: 0.2,
      id_rural_lgu_o: 0.2
    },
    medium: {
      ph_urban_lgu_or: 0.2
    },
    large: {
      ph_urban_lgu_or: 0.3
    },
    vlarge: {
      ph_urban_lgu_or: 0.4
    },
    unsure: {} // neutral
  },
  
  // Q6: Segregation / participation
  participation: {
    none: {
      // Low segregation → organics-only bias
      org_only_bias: 0.3
    },
    emerging: {},
    moderate: {
      // Moderate segregation → slight bias toward org+recy
      org_recy_bias: 0.2
    },
    high: {
      // High segregation → strong bias toward org+recy
      org_recy_bias: 0.4
    },
    unsure: {} // neutral
  },
  
  // Q7: Collection frequency
  collection: {
    none: {
      // No collection → household-level bias
      hh_bias: 0.2
    },
    weekly: {
      hh_bias: 0.1
    },
    "2to3": {
      // Regular collection → central facility bias
      central_bias: 0.2
    },
    daily: {
      central_bias: 0.3
    },
    unsure: {} // neutral
  },
  
  // Space for organics processing (optional, for future expansion)
  space: {
    none: {
      hh_bias: 0.3
    },
    small: {
      cluster_bias: 0.2
    },
    medium: {
      barangay_bias: 0.3
    },
    large: {
      central_bias: 0.4
    },
    unsure: {} // neutral
  }
};
