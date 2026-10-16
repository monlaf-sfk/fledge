// Option lists shared by onboarding forms, cards and scoring.

export const INDUSTRIES = [
  "Fintech",
  "B2B SaaS",
  "Edtech",
  "Healthtech",
  "E-commerce",
  "Logistics",
  "Climate",
  "AI/ML",
  "Marketplaces",
  "Agritech",
] as const;

export const STAGES = ["idea", "pre_seed", "seed", "series_a"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABEL: Record<Stage, string> = {
  idea: "Idea",
  pre_seed: "Pre-seed",
  seed: "Seed",
  series_a: "Series A",
};

export const GEOGRAPHIES = ["Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Central Asia", "CIS", "Global"] as const;

export const TRACTION_RANGES = ["Pre-revenue", "<$1K MRR", "$1–10K MRR", "$10–50K MRR", "$50K+ MRR"] as const;

export const INVESTOR_TYPES = ["angel", "vc", "accelerator", "corporate"] as const;
export type InvestorType = (typeof INVESTOR_TYPES)[number];
export const INVESTOR_TYPE_LABEL: Record<InvestorType, string> = {
  angel: "Angel",
  vc: "VC fund",
  accelerator: "Accelerator",
  corporate: "Corporate VC",
};

export type StartupCard = {
  id: string;
  owner_id: string | null;
  name: string;
  pitch: string;
  problem: string;
  industry: string;
  stage: Stage;
  geography: string;
  traction_range: string;
  funding_target_usd: number;
  team_size: number;
  looking_for: InvestorType[];
  is_demo: boolean;
};

export type InvestorCard = {
  id: string;
  owner_id: string | null;
  display_name: string;
  investor_type: InvestorType;
  thesis: string;
  industries: string[];
  stages: Stage[];
  geographies: string[];
  ticket_min_usd: number;
  ticket_max_usd: number;
  portfolio: string;
  is_demo: boolean;
};

export const STARTUP_COLUMNS =
  "id, owner_id, name, pitch, problem, industry, stage, geography, traction_range, funding_target_usd, team_size, looking_for, is_demo";
export const INVESTOR_COLUMNS =
  "id, owner_id, display_name, investor_type, thesis, industries, stages, geographies, ticket_min_usd, ticket_max_usd, portfolio, is_demo";

export function usd(n: number) {
  if (n >= 1_000_000) return `$${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}
