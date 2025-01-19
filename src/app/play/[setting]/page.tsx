"use client"
// import Image from "next/image";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
// import Button from "@/components/Button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTheme } from "@/context"; 
import { useEffect } from "react";
import { useParams } from "next/navigation";
import Modal from "@/components/Modal";
import Link from "next/link";
import Markdown from 'marked-react';

interface Message {
    text: string;
    sender: "You" | "Gamemaster";
}

interface Setting {
    _id: string;
    name: string;
    description: string;
    system_message: string;
    genre: string;
    factions: { name: string; description: string }[];
    key_beings: { name: string; description: string }[];
    key_themes: { theme: string; description: string }[];
    major_locations: { name: string; description: string }[];
    rules: { rule: string; description: string }[];
    cover_image: string;
}

interface InventoryItem {
    name: string;
    description: string;
    rarity: "common" | "uncommon" | "rare" | "legendary" | "unique";
}

export default function Play() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [character, setCharacter] = useState<any>({name: "Darjin Jeda", race: "Rodian", level: 1, health: 100, xp: 70, xpToNextLevel: 30, currency: 100, stats: { strength: 15, agility: 12, intelligence: 14, charisma: 10 }, inventory: [
        { name: "Blaster Pistol", description: "A standard issue blaster pistol.", rarity: "common" },
        { name: "Thermal Detonator", description: "A powerful explosive device.", rarity: "uncommon" },
        { name: "Mandalorian Armor", description: "Armor made from beskar, offering great protection.", rarity: "rare" },
        { name: "Jedi Holocron", description: "Contains ancient Jedi knowledge.", rarity: "legendary" },
        { name: "Kyber Crystal", description: "A unique and powerful crystal used in lightsabers.", rarity: "unique" },
    ]});
    const [input, setInput] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);
    const { theme } = useTheme(); // Use the theme from context

    const [setting, setSetting] = useState<Setting | null>(null);

    const params = useParams();
    const settingId = params.setting;

    useEffect(() => {
        if (settingId) {
            fetch(`/api/settings?settingId=${settingId}`)
                .then((response) => response.json())
                .then((data) => {
                    setSetting(data);
                    // Connect to the game client
                    fetch('/api/game', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ character: character, setting: data, gameId: 5 }),
                    })
                    .then((response) => response.json())
                    .then((gameData) => {
                        console.log("Connected to game client:", gameData);
                    })
                    .catch((error) => console.error("Error connecting to game client:", error));
                })
                .catch((error) => console.error("Error fetching setting:", error));
        }
    }, [settingId]);
    
    const handleSend = () => {
        if (input.trim()) {
            const newMessage = { text: input, sender: "You" };
            setMessages([...messages, newMessage as Message]);
            setInput("");
            inputRef.current?.focus();

            // Send user message to the game client
            fetch('/api/game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ setting: setting, character: character, gameId: 5, message: newMessage.text }),
            })
            .then((response) => response.json())
            .then((gameData) => {
                console.log("Message sent to game client:", gameData);
                if (gameData.choices && gameData.choices[0] && gameData.choices[0].message) {
                    const gmMessage = { text: gameData.choices[0].message.content, sender: "Gamemaster" };
                setMessages((prevMessages) => [...prevMessages, gmMessage as Message]);
                }
            })
            .catch((error) => console.error("Error sending message to game client:", error));
        }
    };

    const handleSendOption = (option: string) => {
        const newMessage = { text: option, sender: "You" };
        setMessages([...messages, newMessage as Message]);

        // Send user option to the game client
        fetch('/api/game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ setting: setting, character: character, gameId: 1, message: option }),
        })
        .then((response) => response.json())
        .then((gameData) => {
            console.log("Option sent to game client:", gameData);
            if (gameData.choices && gameData.choices[0] && gameData.choices[0].message) {
                const gmMessage = { text: gameData.choices[0].message.content, sender: "Gamemaster" };
                setMessages((prevMessages) => [...prevMessages, gmMessage as Message]);
            }
        })
        .catch((error) => console.error("Error sending option to game client:", error));
    };

    useEffect(() => {
        if (setting) {
            setMessages([
                { text: `Welcome to the ${setting.name} setting!`, sender: "Gamemaster" },
                { text: "You are standing in a dark forest. The trees are tall and the air is thick with mist.", sender: "Gamemaster" },
                { text: "What would you like to do?", sender: "Gamemaster" },
            ]);
        }
    }, [setting]);

    const getRarityColor = (rarity: InventoryItem["rarity"]) => {
        switch (rarity) {
            case "common":
                return "text-gray-500";
            case "uncommon":
                return "text-green-500";
            case "rare":
                return "text-blue-500";
            case "legendary":
                return "text-orange-500";
            case "unique":
                return "text-red-500 unique-item";
            default:
                return "";
        }
    };
    
    return (
        <div className="flex flex-col min-h-screen w-full h-full">
            <Header />
            {setting && (
            <Modal isOpen={true} onClose={() => {}}>
                <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                <h2 className="text-xl font-bold mb-4">Notice</h2>
                <p className="mb-4">You are about to start playing in the <strong>{setting.name}</strong> setting. However, you are not logged in, so your characters and progress will be lost when you leave and will not be saved.</p>
                <p className="mb-4">By logging in, you can:</p>
                <ul className="list-disc list-inside mb-4">
                    <li>Save your characters and progress</li>
                    <li>Access your game from any device</li>
                    <li>Unlock exclusive content and features</li>
                </ul>
                <div className="flex justify-end">
                    <Link href="/login">
                        <div className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-300">
                            Log In
                        </div>
                    </Link>
                </div>
                </div>
            </Modal>
            )}
            <div className={`flex-grow w-full h-full p-4 ${theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex flex-col md:flex-row h-auto lg:h-[80vh] mx-auto">
                <div className="flex flex-col w-full md:flex-row gap-4">
                <div className={`w-full md:w-1/4 p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg mb-4 md:mb-0`}>
                    <h2 className="text-lg font-bold mb-4">Character Info</h2>
                    <p>Character Name: Darjin Jeda</p>
                    <p>Race: Rodian</p>
                    <p>Level: 1</p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4 relative">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: '70%' }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-white">70XP (30XP to next level)</span>
                    </div>
                    <p>Health: 100/100</p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div className="bg-red-600 h-3 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <h3 className="text-md font-bold my-4">Inventory</h3>
                    <ul>
                    {character?.inventory.map((item: InventoryItem, index: number) => (
                        <li key={index} className="mb-2">
                        <div className="flex items-center">
                            <span className={`${getRarityColor(item.rarity)} font-bold`}>{item.name}</span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${item.rarity === 'unique' ? 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white' : ''} ${item.rarity === 'common' ? 'bg-gray-500 text-white' : ''} ${item.rarity === 'uncommon' ? 'bg-green-500 text-white' : ''} ${item.rarity === 'rare' ? 'bg-blue-500 text-white' : ''} ${item.rarity === 'legendary' ? 'bg-orange-500 text-white' : ''}`}>
                            {item.rarity}
                            </span>
                        </div>
                        <p>{item.description}</p>
                        </li>
                    ))}
                    </ul>
                <h3 className="text-md font-bold my-4">Core Stats</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div className={`stat-item flex items-center justify-between p-2 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center">
                        <img src="/icons/strength.png" alt="Strength Icon" className="w-6 h-6 mr-4" />
                        <p className="">Strength</p>
                    </div>
                    <p className="text-lg font-semibold">15</p>
                    </div>
                    <div className={`stat-item flex items-center justify-between p-2 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center">
                        <img src="/icons/agility.png" alt="Agility Icon" className="w-6 h-6 mr-4" />
                        <p className="">Agility</p>
                    </div>
                    <p className="text-lg font-semibold">12</p>
                    </div>
                    <div className={`stat-item flex items-center justify-between p-2 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center">
                        <img src="/icons/intelligence.png" alt="Intelligence Icon" className="w-6 h-6 mr-4" />
                        <p className="">Intelligence</p>
                    </div>
                    <p className="text-lg font-semibold">14</p>
                    </div>
                    <div className={`stat-item flex items-center justify-between p-2 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-center">
                            <img src="/icons/charisma.png" alt="Charisma Icon" className="w-6 h-6 mr-4" />
                            <p className="">Charisma</p>
                        </div>
                        <p className="text-lg font-semibold">10</p>
                    </div>
                </div>
                </div>
                <div className={`chat-window w-full md:w-1/2 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} flex flex-col border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg overflow-hidden mb-4 md:mb-0`}>
                    <div className="messages flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-300 dark:scrollbar-thumb-gray-700 dark:scrollbar-track-gray-800">
                    {messages.map((message, index) => (
                        <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`message mb-3 p-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded shadow-sm ${message.sender === "You" ? 'self-start' : 'self-end'} ${message.sender === "You" ? 'mr-auto' : 'ml-auto'}`}
                        >
                        <strong>{message.sender}:</strong> <Markdown breaks>{message.text.replace(/\*\*\*\*([^*]+)\*\*\*\*/g, '')}</Markdown>
                        {message.sender === "Gamemaster" && (
                            <div className="mt-2">
                                {message.text.split('\n').map((line, i) => {
                                    const match = line.match(/\*\*\*\*([^*]+)\*\*\*\*/);
                                    if (match) {
                                        return (
                                            <button
                                                key={i}
                                                className="mt-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-300"
                                                onClick={() => handleSendOption(match[1])}
                                            >
                                                {match[1]}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        )}
                        </motion.div>
                    ))}
                    </div>
                    <div className={`input-area flex p-4 ${theme === 'dark' ? 'bg-gray-700 border-t border-gray-600' : 'bg-white border-t border-gray-300'}`}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Type a message..."
                        className={`flex-1 p-2 border ${theme === 'dark' ? 'border-gray-600 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-800'} rounded mr-2`}
                    />
                    <button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded">Send</button>
                    </div>
                </div>
                <div className={`w-full md:w-1/4 p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg`}>
                    {setting ? (
                    <>
                        <div className="relative mb-4 h-[100px]">
                        <img 
                            src={setting.cover_image} 
                            alt={`${setting.name} cover image`} 
                            className="rounded-lg w-full h-[100px] object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
                            <h2 className="text-lg font-bold text-white">{setting.name}</h2>
                        </div>
                        </div>
                        {/* <p className="break-words">{setting.description}</p> */}
                        {/* <h3 className="text-md font-bold mt-4">Rules</h3>
                        <ul>
                        {setting.rules.slice(4).map((rule, index) => (
                            <li key={index}>
                            <strong>{rule.rule}:</strong> {rule.description}
                            </li>
                        ))}
                        </ul> */}
                    </>
                    ) : (
                    <p>Loading setting information...</p>
                    )}
                </div>
                </div>
            </div>
            </div>
            <Footer />
            <style jsx>{`
            .unique-item {
                background: linear-gradient(90deg, #ff6ec4, #7873f5);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: gradient-animation 3s ease infinite;
            }

            @keyframes gradient-animation {
                0% {
                background-position: 0% 50%;
                }
                50% {
                background-position: 100% 50%;
                }
                100% {
                background-position: 0% 50%;
                }
            }
            `}</style>
        </div>
    );
}
