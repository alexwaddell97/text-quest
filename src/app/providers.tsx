"use client"

import type { Session as NextAuthSession } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { OnbordaProvider, Onborda } from "onborda";
import onboardingSteps from "@/lib/onboarding-steps";
import OnboardingCard from "@/components/OnboardingCard";

interface Session extends NextAuthSession {
    expires: string;
}

export default function Providers({ session, children }: { session: Session | null | undefined, children: React.ReactNode }) {
    return (
        <SessionProvider session={session}>
            <OnbordaProvider>
                <Onborda
                    steps={onboardingSteps}
                    cardComponent={OnboardingCard}
                    shadowRgb="0,0,0"
                    shadowOpacity="0.7"
                    cardTransition={{ duration: 0.3, type: "tween" }}
                >
                    {children}
                </Onborda>
            </OnbordaProvider>
        </SessionProvider>
    );
}