"use client"
import Image from "next/image";
import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTheme } from "@/context"; // Adjust the import path as necessary

export default function Home() {
  const { theme } = useTheme();
  const audioRef = useRef();
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <Header />
      <motion.div
        className={`w-full h-full p-10 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
      >
        <h1 className="text-4xl font-bold mb-4">About Roleplaying Realm</h1>
        <p className="text-lg mb-4">
          Welcome to Roleplaying Realm, where your imagination meets the power of AI. Our platform generates text-based roleplaying games set in various exciting settings. Whether you're a fan of fantasy, sci-fi, or historical adventures, Roleplaying Realm has something for you.
        </p>
        <p className="text-lg mb-4">
          Our AI-driven engine crafts unique and engaging stories tailored to your preferences. Dive into a world of endless possibilities and let your creativity run wild. Join us on this journey and become a part of the Roleplaying Realm community.
        </p>
        <p className="text-lg mb-4">
          At Roleplaying Realm, we leverage the power of GPT-4 and an intricate story-building system to create persistent and dynamic stories in your favorite worlds. Our platform allows you to save your games and continue your adventures at any time. We also welcome user-submitted worlds and settings, making the possibilities truly endless.
        </p>
      </motion.div>
      <Footer />
    </>
  );
}