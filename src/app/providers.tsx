// in app/providers.tsx

"use client"

import type { Session as NextAuthSession } from "next-auth"

interface Session extends NextAuthSession {
    expires: string;
}
import { SessionProvider } from "next-auth/react"

import { useEffect, useState } from "react";

export default function Providers({ session: sessionPromise, children }: { session: Promise<Session | null> | Session | null | undefined, children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null | undefined>(null);

    useEffect(() => {
        if (sessionPromise instanceof Promise) {
            sessionPromise.then(setSession);
        } else {
            setSession(sessionPromise);
        }
    }, [sessionPromise]);
    
    return (
        <SessionProvider session={session}>
            {children}
        </SessionProvider>
    )
}