/**
 * Centralized niche/category configuration.
 * All category-specific data should be imported from here.
 * Existing weights.js and marketRadarData.js are re-exported for backwards compatibility.
 */

// Re-export existing configs
export { NICHE_WEIGHTS, DEFAULT_WEIGHTS } from "./weights";
export { SEASONALITY, REVENUE_DATA, CTR_BY_POSITION, CITY_DB } from "../analysis/marketRadarData";

// ── Content templates per niche ──
export const NICHE_TEMPLATES = {
  "Home Renovation Contractor": { topics: ["before/after projects", "seasonal home maintenance tips", "customer transformation stories", "materials guide", "permit requirements"], cta: "Get a Free Estimate", seasonal: { spring: "Spring renovation season", summer: "Beat the heat with new siding", fall: "Winterize your home", winter: "Plan your spring remodel" } },
  "Dentist": { topics: ["oral health tips", "new technology/equipment", "patient success stories", "insurance/financing info", "seasonal checkup reminders"], cta: "Book Your Appointment", seasonal: { spring: "Spring cleaning for your smile", summer: "Back-to-school dental checkups", fall: "Halloween candy dental tips", winter: "New year, new smile goals" } },
  "HVAC Contractor": { topics: ["energy saving tips", "maintenance reminders", "system upgrade benefits", "indoor air quality", "emergency preparedness"], cta: "Schedule Service", seasonal: { spring: "AC tune-up before summer", summer: "Beat the heat — emergency AC repair", fall: "Furnace inspection season", winter: "Don't get left in the cold" } },
  "Plumber": { topics: ["DIY prevention tips", "water heater maintenance", "drain care guides", "emergency leak response", "water quality"], cta: "Call Now", seasonal: { spring: "Spring pipe inspection", summer: "Summer irrigation tips", fall: "Prevent frozen pipes", winter: "Emergency burst pipe service" } },
  "Family Law Attorney": { topics: ["legal rights awareness", "custody process explained", "mediation benefits", "financial planning post-divorce", "co-parenting tips"], cta: "Schedule Consultation", seasonal: { spring: "New beginnings — legal fresh start", summer: "Summer custody planning", fall: "Back-to-school custody adjustments", winter: "Post-holiday legal planning" } },
  "Landscaping Company": { topics: ["seasonal lawn care", "design inspiration", "before/after transformations", "native plant recommendations", "maintenance schedules"], cta: "Get a Free Quote", seasonal: { spring: "Spring cleanup & planting", summer: "Irrigation & maintenance", fall: "Fall cleanup & leaf removal", winter: "Snow removal & planning" } },
  "Car Detailing Service": { topics: ["before/after gallery", "paint protection tips", "interior care guides", "seasonal protection", "package comparisons"], cta: "Book Your Detail", seasonal: { spring: "Post-winter salt removal", summer: "UV protection detail", fall: "Pre-winter protection", winter: "Holiday gift certificates" } },
  "IT Services & Computer Repair": { topics: ["security tips", "hardware upgrade guides", "backup strategies", "network optimization", "new technology overview"], cta: "Get Tech Support", seasonal: { spring: "Spring clean your digital life", summer: "Summer storm power protection", fall: "Back-to-school tech setup", winter: "Year-end IT review" } },
  "Digital Marketing Agency": { topics: ["case studies", "industry trends", "SEO tips", "social media strategies", "client success stories"], cta: "Get a Free Audit", seasonal: { spring: "Q2 strategy planning", summer: "Mid-year performance review", fall: "Holiday campaign prep", winter: "New year marketing goals" } },
  "Electrician": { topics: ["safety tips", "energy efficiency", "smart home upgrades", "generator maintenance", "code compliance"], cta: "Schedule Inspection", seasonal: { spring: "Outdoor electrical for spring", summer: "AC electrical checkup", fall: "Generator prep for winter", winter: "Holiday lighting safety" } },
};

// ── Photo requirements per niche ──
export const NICHE_PHOTO_REQS = {
  "Home Renovation Contractor": ["completed projects", "before/after", "team at work", "materials", "work in progress"],
  "Dentist": ["office interior", "dental team", "equipment", "waiting area", "patient smiles"],
  "HVAC Contractor": ["installations", "team", "equipment", "vehicles", "completed jobs"],
  "Plumber": ["completed work", "team", "vehicles", "equipment", "emergency response"],
  "Family Law Attorney": ["office", "team", "meeting rooms", "awards", "community involvement"],
  "Landscaping Company": ["completed landscapes", "before/after", "seasonal work", "team", "equipment"],
  "Car Detailing Service": ["before/after", "process shots", "finished vehicles", "products", "facility"],
  "IT Services & Computer Repair": ["workspace", "team", "repairs in progress", "equipment", "certifications"],
  "Digital Marketing Agency": ["team", "office", "events", "client work examples", "awards"],
  "Electrician": ["completed work", "panel upgrades", "team", "vehicles", "safety equipment"],
};

// ── Description keywords per niche (for scoring/ontology) ──
export const NICHE_KEYWORDS = {
  "Home Renovation Contractor": ["licensed", "insured", "bonded", "remodel", "renovation", "contractor", "build", "install"],
  "Dentist": ["dental", "orthodontics", "implant", "whitening", "emergency", "pediatric", "cosmetic", "family"],
  "HVAC Contractor": ["heating", "cooling", "AC", "furnace", "air conditioning", "duct", "HVAC", "energy efficient"],
  "Plumber": ["plumbing", "drain", "pipe", "water heater", "sewer", "emergency", "licensed", "leak"],
  "Family Law Attorney": ["divorce", "custody", "family law", "mediation", "attorney", "legal representation", "support"],
  "Landscaping Company": ["landscaping", "lawn care", "design", "maintenance", "irrigation", "tree", "hardscape"],
  "Car Detailing Service": ["detailing", "ceramic coating", "paint protection", "interior", "exterior", "wax", "polish"],
  "IT Services & Computer Repair": ["IT support", "computer repair", "network", "cybersecurity", "managed services", "cloud"],
  "Digital Marketing Agency": ["SEO", "PPC", "social media", "web design", "content marketing", "digital strategy"],
  "Electrician": ["electrical", "wiring", "panel", "generator", "lighting", "EV charger", "licensed", "residential"],
};

// Helper: get niche config or fallback
export function getNicheConfig(category) {
  return {
    templates: NICHE_TEMPLATES[category] || NICHE_TEMPLATES["Home Renovation Contractor"],
    photoReqs: NICHE_PHOTO_REQS[category] || ["completed work", "team", "facility", "equipment", "customers"],
    keywords: NICHE_KEYWORDS[category] || [],
  };
}
