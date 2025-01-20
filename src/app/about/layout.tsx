"use client";

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import React from 'react';

const Layout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    return (
        <>
        <Header />
       {children}
        <Footer />
        </>
    );
};

export default Layout;