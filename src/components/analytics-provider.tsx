"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

// Browser PostHog: pageviews, autocapture of clicks, session replay (inputs masked).
// Disabled when NEXT_PUBLIC_POSTHOG_KEY is missing.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Child effects run before parent effects, so every caller makes sure PostHog is initialised.
function ensureInit() {
  if (!KEY || posthog.__loaded) return Boolean(KEY);
  posthog.init(KEY, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2025-05-24",
    person_profiles: "identified_only",
    session_recording: { maskAllInputs: true },
  });
  return true;
}

export function AnalyticsProvider({ user }: { user?: { id: string; role: string; isTest: boolean } | null }) {
  const id = user?.id;
  const role = user?.role;
  const isTest = user?.isTest;

  useEffect(() => {
    if (!ensureInit()) return;
    if (id) posthog.identify(id, { role, is_test: isTest });
  }, [id, role, isTest]);

  return null;
}

export function captureClient(event: string, properties: Record<string, unknown> = {}) {
  if (!ensureInit()) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // analytics must never break the page
  }
}

export function resetAnalytics() {
  if (KEY) posthog.reset();
}
