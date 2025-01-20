import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import { getRarityColor } from '@/utils';
import { useTheme } from '@/context';
import Markdown from 'marked-react';
import { motion } from 'framer-motion';
import { useGameContext } from '@/context/gameContext';

interface ChatPanelProps {
    messages: Message[];
    handleSendOption: (option: string, role?: string) => void;
    input: string;
    setInput: (input: string) => void;
    handleSend: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, handleSendOption, input, setInput, handleSend, inputRef}) => {
    const { theme } = useTheme();
    const { character, gameId } = useGameContext();
    const [latestGamemasterIndex, setLatestGamemasterIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const lastIndex = messages.map((message, index) => ({ message, index }))
            .filter(({ message }) => message.sender === 'Gamemaster')
            .map(({ index }) => index)
            .pop();
        setLatestGamemasterIndex(lastIndex ?? null);
        if (lastIndex !== null) {
            setIsLoading(false);
        }
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendWithStart = () => {
        if (!messages.length && gameId) {
            handleSendOption('start game', 'system');
            setIsLoading(true);
        } else {
            handleSend();
        }
    };

    return (
        <div className={`chat-window w-full md:w-1/2 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} flex flex-col border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg overflow-hidden mb-4 md:mb-0`}>
            <div className={`messages flex-1 p-4 overflow-y-auto scrollbar-thin ${theme === 'dark' ? 'scrollbar-thumb-gray-700 scrollbar-track-gray-800' : 'scrollbar-thumb-gray-500 scrollbar-track-gray-300'}`}>
                {messages.map((message, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`message mb-3 p-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded shadow-sm ${message.sender === "You" ? 'self-start' : 'self-end'} ${message.sender === "You" ? 'mr-auto' : 'ml-auto'}`}
                    >
                        <Markdown>{message.text.replace(/\*\*\*\*([^*]+)\*\*\*\*/g, '').replace(/\n/g, '\n\n\n\n\n\n\n\n')}</Markdown>
                        {message.sender === "Gamemaster" && (
                            <div className="mt-2 flex flex-col items-center">
                                {message.text.split('\n').map((line, i) => {
                                    const match = line.match(/\*\*\*\*([^*]+)\*\*\*\*/);
                                    if (match) {
                                        return (
                                            <button
                                                key={i}
                                                className={`mt-1 px-4 py-2 rounded transition duration-300 ${index !== latestGamemasterIndex ? 'bg-gray-400 text-gray-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                                onClick={() => handleSendOption(match[1])}
                                                disabled={index !== latestGamemasterIndex}
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
                {isLoading && (
                    <div className="loading-indicator text-center mt-4">
                        <span>Loading...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            {!messages.length ? (
                <div className={`input-area flex p-4 ${theme === 'dark' ? 'bg-gray-700 border-t border-gray-600' : 'bg-white border-t border-gray-300'} relative`}>
                    <button
                        onClick={handleSendWithStart}
                        className={`w-full p-2 rounded ${!character || !character._id ? 'bg-gray-400 text-gray-700' : 'bg-indigo-600 text-white'}`}
                        disabled={!character || !character._id}
                    >
                        Start
                    </button>
                </div>
            ) : (
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
            )}
        </div>
    );
};

export default ChatPanel;