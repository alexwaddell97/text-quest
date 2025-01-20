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
import  CharacterPanel from "@/components/GameScreen/Panels/CharacterPanel";
import ChatPanel from "@/components/GameScreen/Panels/ChatPanel";
import SettingPanel from "@/components/GameScreen/Panels/SettingPanel";
import { Message, Setting } from "@/types";
import StartModal from "@/components/GameScreen/Modals/StartModal";
import { useGameContext } from "@/context/gameContext";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";


export default function Play() {
    const [messages, setMessages] = useState<Message[]>([]);
    const { character, gameId, setGameId, setting, setSetting } = useGameContext();
    const [input, setInput] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);
    const { theme } = useTheme(); // Use the theme from context
    const searchParams = useSearchParams();
    const gameIdParam = searchParams.get('gameId');
    const { data: session } = useSession();


    const params = useParams();
    const settingId = params.setting;

    useEffect(() => {
        if (gameIdParam)
        {
            setGameId(gameIdParam);
    }

    return () => {
        setGameId(null);
    };
    }, []);

    useEffect(() => {
        if (settingId) {
            fetch(`/api/settings?settingId=${settingId}`)
                .then((response) => response.json())
                .then((data) => {
                    setSetting(data);
                    // Wait for character to be selected before connecting to the game client
                    if (character) {
                        fetch('/api/game', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ character: character, setting: data, gameId: gameId }),
                        })
                        .then((response) => response.json())
                        .then((gameData) => {
                            console.log("Connected to game client:", gameData);
                            setGameId(gameData.gameId);
                            if (gameData.messages) {
                                const formattedMessages = gameData.messages.map((msg: { role: string, content: string }) => ({
                                    text: msg.content,
                                    sender: msg.role === "user" ? "You" : "Gamemaster"
                                }));
                                setMessages((prevMessages) => [...prevMessages, ...formattedMessages]);
                            }
                        })
                        .catch((error) => console.error("Error connecting to game client:", error));
                    }
                })
                .catch((error) => console.error("Error fetching setting:", error));
        }
    }, [settingId, character]);
    
    const handleSendMessage = (message: string, isOption: boolean = false, role: string | undefined = undefined) => {
        if (message.trim()) {
            const newMessage = { text: message, sender: "You" };
            if (role !== "system") {
                setMessages([...messages, newMessage as Message]);
            }
            if (!isOption) setInput("");
            inputRef.current?.focus();

            // Send user message or option to the game client
            fetch('/api/game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ setting: setting, character: character, gameId: gameId, message: newMessage.text, role: role }),
            })
            .then((response) => response.json())
            .then((gameData) => {
                console.log("Message sent to game client:", gameData);
                if (gameData.completion.choices && gameData.completion.choices[0] && gameData.completion.choices[0].message) {
                    const gmMessage = { text: gameData.completion.choices[0].message.content, sender: "Gamemaster" };
                    setMessages((prevMessages) => [...prevMessages, gmMessage as Message]);
                }
            })
            .catch((error) => console.error("Error sending message to game client:", error));
        }
    };

    const handleSend = () => handleSendMessage(input);
    const handleSendOption = (option: string, role?: string) => handleSendMessage(option, true, role);
    
    return (
        <div className="flex flex-col w-full h-full">
            {setting && !session && (
                <StartModal />
            )}
            <div className={`flex-grow w-full p-4 pb-24 ${theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex flex-col md:flex-row h-auto lg:h-[80vh] mx-auto">
                <div className="flex flex-col w-full md:flex-row gap-4">
               <CharacterPanel />
               <ChatPanel messages={messages} handleSendOption={handleSendOption} input={input} setInput={setInput} inputRef={inputRef} handleSend={handleSend} />
               <SettingPanel />
                </div>
            </div>
            </div>
        </div>
    );
}
