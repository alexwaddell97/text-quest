"use client"
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTheme } from "@/context"; // Adjust the import path as necessary
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Login() {
    // const audioRef = useRef();
    const { theme } = useTheme();
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        console.log('session', session);
        if (session)
        {
            router.push('/');
        }
    },
    [session]);


    const handleGoogleLogin = () => {
        signIn("google");
    };

    return (
        <>
        <Header />
        <div className={`flex items-center justify-center h-screen w-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <motion.div
                className={`w-[500px] p-8 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'} rounded-lg shadow-md`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
                <div className="flex items-center justify-center">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.9 0 7.1 1.4 9.6 3.7l7.1-7.1C36.4 2.3 30.7 0 24 0 14.6 0 6.4 5.8 2.5 14.2l8.3 6.5C12.7 14.1 17.9 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.5 24c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3.2-2.4 5.9-5 7.7l8.3 6.5c4.8-4.4 7.5-10.9 7.5-18.7z"/>
                            <path fill="#FBBC05" d="M10.8 28.7c-1.1-3.2-1.1-6.7 0-9.9L2.5 14.2C-1.1 21.1-1.1 30.9 2.5 37.8l8.3-6.5z"/>
                            <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.7l-8.3-6.5c-2.3 1.5-5.2 2.4-7.7 2.4-6.1 0-11.3-4.1-13.2-9.7l-8.3 6.5C6.4 42.2 14.6 48 24 48z"/>
                        </svg>
                        Login with Google
                    </button>
                </div>
            </motion.div>
        </div>
        <Footer />
    </>
    );
}
