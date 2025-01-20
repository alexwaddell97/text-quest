import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '@/context';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';

export default function Header() {
    const { theme, toggleTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: session, status } = useSession();

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleThemeToggle = async () => {
        toggleTheme();
        await fetch('/api/theme-toggle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ theme: theme === 'dark' ? 'light' : 'dark', userId: session?.user?.id }),
        });
    };

    return (
        <motion.div 
            className={`bg-${theme === 'dark' ? 'gray-800' : 'gray-100'} shadow-md w-full top-0 flex justify-between items-center`}
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 50 }}
        >
            <div className="mx-[10px] p-4 w-full flex justify-between items-center">
                <Link href={'/'}>
                    <motion.div 
                        className="flex items-center"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <img src="/logo.svg" alt="Logo" className="h-8 w-8 mr-2" />
                        <h1 
                            className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-600`}
                        >
                            Roleplaying Realm
                        </h1>
                    </motion.div>
                </Link>
                <div className="flex items-center space-x-4">
                    <button 
                        className={`md:hidden bg-${theme === 'dark' ? 'gray-700' : 'gray-200'} focus:outline-none`}
                        onClick={toggleMobileMenu}
                    >
                        <svg className="w-6 h-6" fill="none" stroke={theme === 'dark' ? 'white' : 'black'} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                        </svg>
                    </button>
                    <nav className={`fixed !mx-0 inset-0 bg-${theme === 'dark' ? 'gray-800' : 'gray-100'} bg-opacity-95 z-50 flex flex-col items-center justify-center transition-transform transform ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:relative md:bg-transparent md:flex-row md:space-x-4`}>
                        <button 
                            className="absolute top-4 right-4 text-white focus:outline-none md:hidden"
                            onClick={toggleMobileMenu}
                        >
                            <svg className="w-6 h-6" fill="none" stroke={theme === 'dark' ? 'white' : 'black'} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                        <ul className="flex flex-col md:flex-row justify-around p-4 space-y-4 md:space-y-0 md:space-x-4">
                            {['Home', 'About'].map((item, index) => (
                                <motion.li 
                                    key={item}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    <Link
                                        href={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                                        onClick={() => { toggleMobileMenu(); }}
                                        className={`text-${theme === 'dark' ? 'white' : 'gray-800'} hover:text-${theme === 'dark' ? 'gray-400' : 'gray-600'} px-3 py-2 rounded-md text-sm font-medium md:bg-${theme === 'dark' ? 'gray-700' : 'gray-300'} md:hover:bg-${theme === 'dark' ? 'gray-600' : 'gray-400'} md:rounded-lg`}
                                    >
                                        {item}
                                    </Link>
                                </motion.li>
                            ))}
                        </ul>
                        {session ? (
                            <button
                                onClick={() => { signOut(); toggleMobileMenu(); }}
                                className={`bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 md:hidden`}
                            >
                                Logout
                            </button>
                        ) : (
                            <Link href="/login"
                                className={`bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 md:hidden`}
                                onClick={toggleMobileMenu}
                            >
                                Login
                            </Link>
                        )}
                    </nav>
                    {session ? (
                        <button
                            onClick={() => signOut()}
                            className={`bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 hidden md:block`}
                        >
                            Logout
                        </button>
                    ) : (
                        <Link href="/login"
                            className={`bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:scale-105 hidden md:block`}
                        >
                            Login
                        </Link>
                    )}
                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                            type="checkbox" 
                            name="toggle" 
                            id="toggle" 
                            onChange={handleThemeToggle} 
                            checked={theme === 'dark'} 
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                        />
                        <label 
                            htmlFor="toggle" 
                            className={`toggle-label block overflow-hidden h-6 rounded-full bg-${theme === 'dark' ? 'gray-600' : 'gray-200'} cursor-pointer`}
                        ></label>
                    </div>
                    <style jsx>{`
                        .toggle-checkbox:checked {
                            right: 0;
                            border-color: #4f46e5;
                        }
                        .toggle-checkbox:checked + .toggle-label {
                            background-color: #4f46e5;
                        }
                    `}</style>
                </div>
            </div>
        </motion.div>
    );
}