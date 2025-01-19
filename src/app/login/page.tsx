"use client"
import Image from "next/image";
import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTheme } from "@/context"; // Adjust the import path as necessary

export default function Home() {
    const audioRef = useRef();
    const [playing, setPlaying] = useState(false);
    const { theme, toggleTheme } = useTheme();

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
                <form className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-lg font-medium">
                            Email address
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-lg font-medium">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="remember"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="remember" className="ml-2 block text-sm">
                            Remember me
                        </label>
                    </div>
                    <div className="flex items-center justify-between">
                        <button type="button" className="text-sm text-indigo-600 hover:text-indigo-500">
                            Forgot password?
                        </button>
                        <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
                            Login
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
        <Footer />
    </>
    );
}
