import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import 'tailwindcss/tailwind.css';
import { useTheme } from '@/context'; // Adjust the import path as necessary

export default function Footer({ onClick }: any) {
    const { theme } = useTheme();

    return (
        <motion.footer
            className={`py-4 md:py-6 w-full fixed z-[20] bottom-0 left-0 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="mx-4 md:mx-[20px] flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                <div className="flex items-center space-x-2">
                    <Image src="/logo.svg" alt="Logo" width={24} height={24} />
                    <div className="text-lg font-bold text-indigo-600">Roleplaying Realm</div>
                </div>
                <nav className="flex space-x-2 md:space-x-4">
                    <Link href="/" passHref>
                        <span className="hover:text-gray-600 cursor-pointer">Home</span>
                    </Link>
                    <Link href="/about" passHref>
                        <span className="hover:text-gray-600 cursor-pointer">About</span>
                    </Link>
                </nav>
                <div className="flex items-center space-x-2">
                    <Link href="https://patreon.com/infiniteworldsai" target='_blank'>
                        <div className="hover:text-gray-600 cursor-pointer flex items-center space-x-2">
                            <Image className={`${theme === 'dark' ? 'filter invert' : ''}`} src="/icons/patreon.webp" alt="Patreon" width={24} height={24} />
                            <span>Support on Patreon</span>
                        </div>
                    </Link>
                </div>
            </div>
        </motion.footer>
    );
}