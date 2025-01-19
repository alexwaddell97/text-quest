import React from 'react';
import { Setting } from '@/types';
import { useTheme } from '@/context';
import { useGameContext } from '@/context/gameContext';

const SettingPanel: React.FC = () => {

    const { theme } = useTheme();
    const { setting } = useGameContext();

    return (
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
    );
};

export default SettingPanel;