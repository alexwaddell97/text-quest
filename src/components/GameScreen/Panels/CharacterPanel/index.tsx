import React from 'react';
import { Character, InventoryItem } from '@/types';
import { getRarityColor } from '@/utils';
import { useTheme } from '@/context';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameContext } from '@/context/gameContext';
import CreateCharacterModal from '@/components/GameScreen/Modals/CreateCharacterModal';
import { useSession } from 'next-auth/react';

const CharacterPanel: React.FC = () => {

    const { theme } = useTheme();
    const { setting, character, setCharacter } = useGameContext();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [showCreateCharacterModal, setShowCreateCharacterModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const { data: session } = useSession();

    useEffect(() => {
        if (!setting?._id || !session?.user?.id) return;

        fetchCharacters(setting?._id);
    }, [setting?._id, session?.user?.id]);

    const fetchCharacters = async (settingId : string | undefined) => {
        try {
            const response = await fetch(`/api/characters?settingId=${settingId}&userId=${session?.user?.id}`);
            const data = await response.json();
            setCharacters(data);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('Error fetching characters:', error);
        }
    };

    const handleModalClose = () => {
        setShowCreateCharacterModal(false);
        fetchCharacters(setting?._id);
    };

    return (
       <>
       {showCreateCharacterModal && <CreateCharacterModal onClose={handleModalClose} />}

       {character ? (
         <div className={`w-full md:w-1/4 overflow-auto p-4 ${theme === 'dark' ? 'bg-gray-800 text-white scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800' : 'bg-white text-gray-800 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg mb-4 md:mb-0`}>
         <h2 className="text-lg font-bold mb-4">Character Info</h2>
         <p>Name: {character?.name}</p>
         <p>Race: {character?.race}</p>
         <p>Level: {character?.level}</p>
         <div className="w-full bg-gray-200 rounded-full h-3 mb-4 relative">
        <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${(character.xp.current / character.xp.max) * 100}%` }}></div>
         <span className="absolute inset-0 flex items-center justify-center text-xs text-white">{character?.xp?.current}XP ({character?.xp?.max - character?.xp?.current}XP to next level)</span>
         </div>
         <p>Health: {character?.health?.current}/{character?.health?.max}</p>
         <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div className="bg-red-600 h-3 rounded-full" style={{ width: `${(character.health.current / character.health.max) * 100}%` }}></div>
         </div>

         <div className={`collapse collapse-arrow border ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'} rounded-box mb-4`}>
         <input type="checkbox" />
           <div className="collapse-title text-md font-medium">
                Description
            </div>
            <div className="collapse-content">
                <p>{character?.description}</p>
            </div>
         </div>

         <div className={`collapse collapse-arrow border ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'} rounded-box mb-4`}>
         <input type="checkbox" />
            <div className="collapse-title text-md font-medium">
                Backstory
            </div>
            <div className="collapse-content">
                <p>{character?.backstory}</p>
            </div>
         </div>
     <h3 className="text-md font-bold my-4">Core Stats</h3>
    <div className="grid grid-cols-1 gap-4">
        <div className={`stat-item flex items-center justify-between p-2 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex items-center">
           <img src="/icons/strength.png" alt="Strength Icon" className={`w-6 h-6 mr-4 ${theme === 'dark' ? 'invert' : ''}`} />
           <p className="">Strength</p>
        </div>
        <p className="text-lg font-semibold">{character?.stats?.strength}</p>
        </div>
        <div className={`stat-item flex items-center justify-between p-2 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex items-center">
           <img src="/icons/agility.png" alt="Agility Icon" className={`w-6 h-6 mr-4 ${theme === 'dark' ? 'invert' : ''}`} />
           <p className="">Agility</p>
        </div>
        <p className="text-lg font-semibold">{character?.stats?.agility}</p>
        </div>
        <div className={`stat-item flex items-center justify-between p-2 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex items-center">
           <img src="/icons/intelligence.png" alt="Intelligence Icon" className={`w-6 h-6 mr-4 ${theme === 'dark' ? 'invert' : ''}`} />
           <p className="">Intelligence</p>
        </div>
        <p className="text-lg font-semibold">{character?.stats?.intelligence}</p>
        </div>
        <div className={`stat-item flex items-center justify-between p-2 rounded-lg shadow-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
           <div className="flex items-center">
              <img src="/icons/charisma.png" alt="Charisma Icon" className={`w-6 h-6 mr-4 ${theme === 'dark' ? 'invert' : ''}`} />
              <p className="">Charisma</p>
           </div>
           <p className="text-lg font-semibold">{character?.stats?.charisma}</p>
        </div>
    </div>
     <h3 className="text-md font-bold my-4">Inventory</h3>
         <div className={`max-h-[350px] overflow-y-auto scrollbar-thin ${theme === 'dark' ? 'scrollbar-thumb-gray-600 scrollbar-track-gray-800' : 'scrollbar-thumb-gray-400 scrollbar-track-gray-200'}`}>
         <ul>
         {character?.inventory.map((item: InventoryItem, index: number) => (
             <li key={index} className="mb-2">
             <div className="flex items-center justify-between">
                 <div className="flex items-center">
                     <span className={`${getRarityColor(item.rarity)} font-bold`}>{item.name}</span>
                     <span className={`ml-2 px-2 py-1 text-xs rounded-full ${item.rarity === 'unique' ? 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white' : ''} ${item.rarity === 'common' ? 'bg-gray-500 text-white' : ''} ${item.rarity === 'uncommon' ? 'bg-green-500 text-white' : ''} ${item.rarity === 'rare' ? 'bg-blue-500 text-white' : ''} ${item.rarity === 'legendary' ? 'bg-orange-500 text-white' : ''}`}>
                     {item.rarity}
                     </span>
                 </div>
                 {item.quantity > 1 && <span className="ml-4 text-sm">x{item.quantity}</span>}
             </div>
             <p className='mt-2 text-xs'>{item.description}</p>
             </li>
         ))}
         </ul>
         </div>
     </div>
       ) : (
        <div className={`w-full md:w-1/4   p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} rounded-lg mb-4`}>
            <div className="flex flex-col">
            <div className="flex justify-between mb-4">
                <h2 className='font-bold'>Characters</h2>
                <motion.button 
                    onClick={() => setShowCreateCharacterModal(true)}
                    className={`w-8 h-8 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg cursor-pointer`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    +
                </motion.button>
            </div>
            {loading ? (
                <div className="flex justify-center items-center h-full">
                    <div className="spinner-border animate-spin inline-block w-16 h-16 border-8 border-t-8 border-t-indigo-600 rounded-full mb-4" role="status">
                        <span className="visually-hidden hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                characters.length === 0 ? (
                    <p className="text-center">No characters found. <br /> Why not create one?</p>
                ) : (
                    characters.map((char, index) => (
                        <motion.div 
                            key={index} 
                            onClick={() => setCharacter(char)}
                            className={`w-full p-4 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg mb-4 flex flex-col items-center justify-center cursor-pointer relative`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <button 
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    await fetch(`/api/characters/delete`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ characterId: char._id }),
                                    });
                                    fetchCharacters(setting?._id);
                                }}
                                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"
                            >
                            <svg
                                fill="currentColor"
                                width="16px"
                                height="16px"
                                viewBox="0 0 408.483 408.483"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <g>
                                    <g>
                                        <path d="M87.748,388.784c0.461,11.01,9.521,19.699,20.539,19.699h191.911c11.018,0,20.078-8.689,20.539-19.699l13.705-289.316
                                            H74.043L87.748,388.784z M247.655,171.329c0-4.61,3.738-8.349,8.35-8.349h13.355c4.609,0,8.35,3.738,8.35,8.349v165.293
                                            c0,4.611-3.738,8.349-8.35,8.349h-13.355c-4.61,0-8.35-3.736-8.35-8.349V171.329z M189.216,171.329
                                            c0-4.61,3.738-8.349,8.349-8.349h13.355c4.609,0,8.349,3.738,8.349,8.349v165.293c0,4.611-3.737,8.349-8.349,8.349h-13.355
                                            c-4.61,0-8.349-3.736-8.349-8.349V171.329L189.216,171.329z M130.775,171.329c0-4.61,3.738-8.349,8.349-8.349h13.356
                                            c4.61,0,8.349,3.738,8.349,8.349v165.293c0,4.611-3.738,8.349-8.349,8.349h-13.356c-4.61,0-8.349-3.736-8.349-8.349V171.329z"/>
                                        <path d="M343.567,21.043h-88.535V4.305c0-2.377-1.927-4.305-4.305-4.305h-92.971c-2.377,0-4.304,1.928-4.304,4.305v16.737H64.916
                                            c-7.125,0-12.9,5.776-12.9,12.901V74.47h304.451V33.944C356.467,26.819,350.692,21.043,343.567,21.043z"/>
                                    </g>
                                </g>
                            </svg>
                            </button>
                            <h2 className="text-lg font-bold mb-2">{char.name}</h2>
                            <p>Race: {char.race}</p>
                            <p>Level: {char.level}</p>
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-2 relative">
                                <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${(char.xp.current / char.xp.max) * 100}%` }}></div>
                                <span className="absolute inset-0 flex items-center justify-center text-xs text-white">{char.xp.current}XP ({char.xp.max - char.xp.current}XP to next level)</span>
                            </div>
                            <p>Health: {char.health.current}/{char.health.max}</p>
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                                <div className="bg-red-600 h-3 rounded-full" style={{ width: `${(char.health.current / char.health.max) * 100}%` }}></div>
                            </div>
                        </motion.div>
                    ))
                )
            )}
            </div>
        </div>
       )}
       </>
    );
};

export default CharacterPanel;