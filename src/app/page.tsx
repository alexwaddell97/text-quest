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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSettings = async (page: number) => {
    try {
      const response = await fetch(`/api/settings?page=${page}&limit=12`);
      const data = await response.json();
      setSettings(data.settings);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings(1);
  }, []);

  const handlePageChange = (page: number) => {
    setLoading(true);
    fetchSettings(page).then(() => {
      setCurrentPage(page);
    });
  };

  console.log(settings)
  
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />

      <div className={`relative w-full h-full py-4 px-10 md:p-4 overflow-auto ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}>
        {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-opacity-50 bg-gray-800 z-50">
            <div className="spinner-border animate-spin inline-block w-16 h-16 border-8 border-t-8 border-t-indigo-600 rounded-full" role="status">
              <span className="visually-hidden hidden">Loading...</span>
            </div>
          </div>
        )}
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {settings.map((setting, index) => (
              <SettingCard setting={setting} key={index} onClick={() => {}} />
            ))}
          </div>
        </AnimatePresence>

        <div className="flex justify-center mt-4 mb-4">
          <div className="btn-group">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={loading || currentPage === 1}
              className="btn"
            >
              «
            </button>
            {[...Array(totalPages)].map((_, pageIndex) => (
              <button
                key={pageIndex}
                onClick={() => handlePageChange(pageIndex + 1)}
                disabled={loading}
                className={`btn ${currentPage === pageIndex + 1 ? 'btn-active' : ''}`}
              >
                {pageIndex + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={loading || currentPage === totalPages}
              className="btn"
            >
              »
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
