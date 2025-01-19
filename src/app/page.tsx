"use client"
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SettingCard from "@/components/SettingCard";
import { useTheme } from '@/context'; // Adjust the import path as necessary

export default function About() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  console.log(settings)
  
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />

      <div className={`flex-grow w-full h-full py-4 px-10 md:p-4 overflow-auto ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="spinner-border animate-spin inline-block w-16 h-16 border-8 border-t-8 border-t-indigo-600 rounded-full" role="status">
              <span className="visually-hidden hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {settings.map((setting, index) => (
                <SettingCard setting={setting} key={index} onClick={() => {}} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
      <Footer />
    </div>
  );
}
