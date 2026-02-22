"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useOnborda } from "onborda";

const STORAGE_KEY_PREFIX = "onboarding_complete_";

/**
 * OnboardingTour
 * Mounts inside <OnbordaProvider>. Once a logged-in user is detected and they
 * haven't seen the tour before, it automatically starts the "main" tour.
 * Completion is persisted in localStorage under `onboarding_complete_<userId>`.
 */
export default function OnboardingTour() {
  const { data: session, status } = useSession();
  const { startOnborda } = useOnborda();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const storageKey = `${STORAGE_KEY_PREFIX}${session.user.id}`;
    const alreadyDone = localStorage.getItem(storageKey);

    if (!alreadyDone) {
      // Small delay so the page contents are visible before the overlay appears
      const timer = setTimeout(() => {
        startOnborda("main");
        localStorage.setItem(storageKey, "true");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [status, session?.user?.id, startOnborda]);

  return null;
}
