// Transparent rule-based fit score (0–100), as defined for the MVP:
// industry 35 · stage 30 · geography 20 · ticket size 15. Same formula for both sides.
import type { InvestorCard, StartupCard } from "./catalog";

const REGION_MEMBERS: Record<string, string[]> = {
  "Central Asia": ["Kazakhstan", "Uzbekistan", "Kyrgyzstan"],
  CIS: ["Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Central Asia"],
};

function geoCovers(investorGeo: string, startupGeo: string) {
  return (
    investorGeo === startupGeo ||
    investorGeo === "Global" ||
    (REGION_MEMBERS[investorGeo]?.includes(startupGeo) ?? false)
  );
}

export type Fit = { score: number; reasons: string[] };

export function fitScore(startup: StartupCard, investor: InvestorCard): Fit {
  let score = 0;
  const reasons: string[] = [];

  if (investor.industries.includes(startup.industry)) {
    score += 35;
    reasons.push(`Invests in ${startup.industry}`);
  }
  if (investor.stages.includes(startup.stage)) {
    score += 30;
    reasons.push("Stage match");
  }
  if (investor.geographies.some((g) => geoCovers(g, startup.geography))) {
    score += 20;
    reasons.push(`Covers ${startup.geography}`);
  } else if (investor.geographies.some((g) => REGION_MEMBERS[startup.geography]?.includes(g))) {
    score += 10;
    reasons.push("Partial geography overlap");
  }
  // A ticket fits when the smallest cheque is not above the whole raise.
  if (investor.ticket_min_usd <= startup.funding_target_usd) {
    score += 15;
    reasons.push("Ticket fits the raise");
  }

  return { score, reasons };
}
