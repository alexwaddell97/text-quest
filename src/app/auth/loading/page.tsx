"use client"
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AuthLoading() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/");
        } else if (status === "unauthenticated") {
            router.replace("/login");
        }
    }, [status, router]);

    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#070407]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-rose-400" />
            </div>
            <p className="text-sm tracking-widest uppercase text-white/50">Signing you in…</p>
        </motion.div>
    );
}
