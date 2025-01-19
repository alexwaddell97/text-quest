import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { useTheme } from '@/context';
import { useGameContext } from '@/context/gameContext';

interface CreateCharacterModalProps {
    onClose: () => void;
}

const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({ onClose }) => {
    const { theme } = useTheme();
    const { setting } = useGameContext();
    const [characterName, setCharacterName] = useState('');
    const [characterRace, setCharacterRace] = useState('');
    const [characterDescription, setCharacterDescription] = useState('');
    const [characterBackstory, setCharacterBackstory] = useState('');
    const [characterStats, setCharacterStats] = useState({ strength: 0, agility: 0, intelligence: 0, charisma: 0 });
    const [rollCounts, setRollCounts] = useState({ strength: 0, agility: 0, intelligence: 0, charisma: 0 });
    const [startingLoot, setStartingLoot] = useState('');
    const [usePointAssign, setUsePointAssign] = useState(false);
    const [pointsLeft, setPointsLeft] = useState(50);

    const roll4d6DropLowest = () => {
        const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
        rolls.sort((a, b) => a - b);
        return rolls.slice(1).reduce((sum, roll) => sum + roll, 0);
    };

    const rollStat = (stat: keyof typeof characterStats) => {
        if (rollCounts[stat] < 2) {
            setCharacterStats(prevStats => ({
                ...prevStats,
                [stat]: roll4d6DropLowest(),
            }));
            setRollCounts(prevCounts => ({
                ...prevCounts,
                [stat]: prevCounts[stat] + 1,
            }));
        }
    };

    const rollLoot = () => {
        const lootOptions = ['Sword', 'Shield', 'Potion', 'Gold'];
        setStartingLoot(lootOptions[Math.floor(Math.random() * lootOptions.length)]);
    };

    const handleStatChange = (stat: keyof typeof characterStats, value: number) => {
        if (value <= 18 && pointsLeft - value + characterStats[stat] >= 0) {
            setCharacterStats(prevStats => ({
                ...prevStats,
                [stat]: value,
            }));
            setPointsLeft(prevPoints => prevPoints - value + characterStats[stat]);
        }
    };

    const toggleMode = () => {
        setUsePointAssign(prevMode => {
            if (!prevMode) {
                setCharacterStats({ strength: 0, agility: 0, intelligence: 0, charisma: 0 });
                setRollCounts({ strength: 0, agility: 0, intelligence: 0, charisma: 0 });
                setPointsLeft(50);
            }
            return !prevMode;
        });
    };

    const generateCharacter = async () => {
        try {
            const response = await fetch('/api/generate/character', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ setting: setting }),
            });
            const data = await response.json();
            setCharacterBackstory(data.character.backstory);

            // Generate other fields
            setCharacterName(data.character.name);
            setCharacterRace(data.character.race);
            setCharacterDescription(data.character.description);
            setCharacterStats({
                strength: roll4d6DropLowest(),
                agility: roll4d6DropLowest(),
                intelligence: roll4d6DropLowest(),
                charisma: roll4d6DropLowest(),
            });
        } catch (error) {
            console.error('Error generating character:', error);
        }
    };

    const handleCreateCharacter = async () => {
        const characterData = {
            name: characterName,
            race: characterRace,
            description: characterDescription,
            backstory: characterBackstory,
            stats: characterStats,
        };
    
        try {
            const response = await fetch('/api/characters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({character: characterData, settingId: setting?._id}),
            });
    
            if (!response.ok) {
                throw new Error('Failed to submit character');
            }
    
            const data = await response.json();
            console.log('Character submitted successfully:', data);
            onClose();
        } catch (error) {
            console.error('Error submitting character:', error);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} width='max-w-[1000px]'>
            <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                <h2 className="text-xl font-bold mb-4">Create Your Character</h2>
                <p className="mb-4">You are about to start playing in the <strong>{setting?.name}</strong> setting. Please create your character to begin.</p>
                <div className="flex flex-wrap -mx-2">
                    <div className="w-full md:w-1/2 px-2">
                        <div className="mb-4">
                            <label className="block mb-2">Name</label>
                            <input
                                type="text"
                                value={characterName}
                                onChange={(e) => setCharacterName(e.target.value)}
                                className={`w-full px-3 py-2 border rounded ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2">Race</label>
                            <input
                                type="text"
                                value={characterRace}
                                onChange={(e) => setCharacterRace(e.target.value)}
                                className={`w-full px-3 py-2 border rounded ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2">Description</label>
                            <textarea
                                value={characterDescription}
                                onChange={(e) => setCharacterDescription(e.target.value)}
                                className={`w-full px-3 py-2 border rounded ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                            />
                            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>A detailed description of your character will help influence the story and interactions within the game.</p>
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2">Backstory</label>
                            <textarea
                                value={characterBackstory}
                                onChange={(e) => setCharacterBackstory(e.target.value)}
                                className={`w-full px-3 py-2 border rounded h-32 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                            />
                            <button
                                onClick={generateCharacter}
                                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-300"
                            >
                                Generate Character
                            </button>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 px-2">
                        <div className="mb-4">
                            <label className="block mb-2">Character Stats</label>
                            <div className="flex items-center mb-4">
                                <div
                                    className={`relative inline-block w-12 h-6 mr-2 align-middle select-none transition duration-200 ease-in-out ${
                                        usePointAssign ? 'bg-indigo-600' : 'bg-gray-400'
                                    } rounded-full cursor-pointer`}
                                    onClick={toggleMode}
                                >
                                    <span
                                        className={`absolute block w-6 h-6 bg-white rounded-full shadow inset-y-0 left-0 transition-transform duration-200 ease-in-out transform ${
                                            usePointAssign ? 'translate-x-6' : ''
                                        }`}
                                    ></span>
                                </div>
                                <span className="ml-2 text-sm">
                                    {usePointAssign ? 'Point Assign Mode' : 'Roll Mode'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {['strength', 'agility', 'intelligence', 'charisma'].map(stat => (
                                    <div key={stat} className={`stat-item flex items-center justify-between p-2 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        <div className="flex items-center">
                                            <img
                                                src={`/icons/${stat}.png`}
                                                alt={`${stat} Icon`}
                                                className={`w-6 h-6 mr-4 ${theme === 'dark' ? 'invert' : ''}`}
                                            />
                                            <p className="capitalize">{stat}</p>
                                        </div>
                                        <div className="flex items-center">
                                            {usePointAssign ? (
                                                <input
                                                    type="number"
                                                    value={characterStats[stat as keyof typeof characterStats]}
                                                    onChange={(e) => handleStatChange(stat as keyof typeof characterStats, parseInt(e.target.value))}
                                                    className={`w-16 px-2 py-1 border rounded ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                                                    min="0"
                                                    max="18"
                                                />
                                            ) : (
                                                <>
                                                    <p className="text-lg font-semibold mr-4">{characterStats[stat as keyof typeof characterStats]}</p>
                                                    <button
                                                        onClick={() => rollStat(stat as keyof typeof characterStats)}
                                                        className={`px-4 py-2 ${rollCounts[stat as keyof typeof rollCounts] >= 2 ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded transition duration-300`}
                                                        disabled={rollCounts[stat as keyof typeof rollCounts] >= 2}
                                                    >
                                                        Roll
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {usePointAssign && (
                                <p className="text-sm text-gray-600 mt-2">Points left: {pointsLeft}</p>
                            )}
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2">Inventory</label>
                            <div className="flex items-center justify-between">
                                <div>{startingLoot}</div>
                                {/* <button
                                    onClick={rollLoot}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-300 ml-4"
                                >
                                    Generate Inventory
                                </button> */}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={handleCreateCharacter}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-300"
                    >
                        Create Character
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CreateCharacterModal;
