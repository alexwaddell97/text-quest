"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import React from 'react';
import { GameProvider } from '@/context/gameContext';

const Layout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    return (
        <>
        <Header />
        <GameProvider>
       {children}
       </GameProvider>
        <Footer />
        </>
    );
};

export default Layout;