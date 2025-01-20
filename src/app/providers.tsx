"use client"

import type { Session as NextAuthSession } from "next-auth";
import { SessionProvider } from "next-auth/react"
interface Session extends NextAuthSession {
    expires: string;
}

export default function Providers({ session, children }: { session: Session | null | undefined, children: React.ReactNode }) {
    return (
        <SessionProvider session={session}>
            {children}
        </SessionProvider>
    )
}