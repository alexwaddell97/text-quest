"use client"

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // Assuming you are using next-auth for session management

interface UserSettings {
    theme: Theme;
}

interface User {
    settings: UserSettings;
}

interface Session {
    user: User;
}
type Theme = 'dark' | 'light';

interface ThemeContextProps {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { data: session } = useSession();
    const userTheme = (session as Session)?.user?.settings?.theme;
    const [theme, setTheme] = useState<Theme>(userTheme || 'light');

    useEffect(() => {
        if (userTheme) {
            setTheme(userTheme);
        }
    }, [userTheme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextProps => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};