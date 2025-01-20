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
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSort, setSelectedSort] = useState('');

  const fetchSettings = async (page: number, genre: string, sort: string) => {
    try {
      const response = await fetch(`/api/settings?page=${page}&limit=12&genre=${genre}&sort=${sort}`);
      const data = await response.json();
      setSettings(data.settings);
      setTotalPages(data.totalPages);
      setGenres(data.genres);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings(1, selectedGenre, selectedSort);
  }, [selectedGenre, selectedSort]);

  const handlePageChange = (page: number) => {
    setLoading(true);
    fetchSettings(page, selectedGenre, selectedSort).then(() => {
      setCurrentPage(page);
    });
  };

  const handleGenreChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGenre(event.target.value);
  };

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSort(event.target.value);
  };
  
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Header />

      <div className={`relative w-full h-full py-4 px-2 md:px-10 md:p-4 overflow-auto ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}>
        <div className="flex justify-end gap-5 mb-4">
            <select value={selectedGenre} onChange={handleGenreChange} className={`p-2 border rounded ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}>
            <option value="">All Genres</option>
            {genres.map((genre, index) => (
              <option key={index} value={genre}>{genre}</option>
            ))}
            </select>
          <select value={selectedSort} onChange={handleSortChange} className={`p-2 border rounded ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}>
            <option value="">Sort By</option>
            <option value="most-voted">Most Voted</option>
            <option value="least-voted">Least Voted</option>
            {/* Add more sorting options as needed */}
          </select>
        </div>

        {loading && (
          <div className="absolute inset-0 flex justify-center items-center bg-opacity-50 bg-gray-800 z-[15]">
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

        {settings.length > 0 && (
          <div className="flex justify-center mt-4 mb-4">
            <div className="btn-group space-x-1">
                <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={loading || currentPage === 1}
                className={`w-5 ${theme === 'dark' ? 'text-white' : 'text-black'} ${loading || currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''} border-none`}
                >
                «
                </button>
                {[...Array(totalPages)].map((_, pageIndex) => (
                <button
                  key={pageIndex}
                  onClick={() => handlePageChange(pageIndex + 1)}
                  disabled={loading}
                  className={`btn ${currentPage === pageIndex + 1 ? (theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600') : ''} ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-black'} border-none`}
                >
                  {pageIndex + 1}
                </button>
                ))}
                <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={loading || currentPage === totalPages}
                className={`w-5 ${theme === 'dark' ? 'text-white' : 'text-black'} ${loading || currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''} border-none`}
                >
                »
                </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
