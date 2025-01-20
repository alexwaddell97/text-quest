import React, { createContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { Character, Setting } from '@/types';
import { useContext } from 'react';

// Define the shape of the game context
interface GameContextType {
    character: Character | null;
    setting: Setting | null;
    gameId: string | null;
    setCharacter: Dispatch<SetStateAction<Character | null>>;
    setSetting: Dispatch<SetStateAction<Setting | null>>;
    setGameId: Dispatch<SetStateAction<string | null>>;
}

// Create a context for the game with a default value
const GameContext = createContext<GameContextType | undefined>(undefined);

// Define the props for the provider component
interface GameProviderProps {
    children: ReactNode;
}

// Create a provider component
const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
    const [character, setCharacter] = useState<Character | null>(null);
    const [setting, setSetting] = useState<Setting | null>(null);
    const [gameId, setGameId] = useState<string | null>(null);

    return (
        <GameContext.Provider value={{ character, setting, setCharacter, setSetting, gameId, setGameId }}>
            {children}
        </GameContext.Provider>
    );
};

export { GameContext, GameProvider };

const useGameContext = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGameContext must be used within a GameProvider');
    }
    return context;
};

export { useGameContext };
