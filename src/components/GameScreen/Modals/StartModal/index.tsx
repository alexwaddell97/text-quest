import React from 'react';
import Modal from '@/components/Modal';
import Link from 'next/link';
import { useTheme } from '@/context';
import { Setting } from '@/types';
import { useGameContext } from '@/context/gameContext';


const StartModal: React.FC = () => {
   
    const { theme } = useTheme();
    const { setting } = useGameContext();


    return (
        <Modal isOpen={true} onClose={() => {}}>
        <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <h2 className="text-xl font-bold mb-4">Notice</h2>
        <p className="mb-4">You are about to start playing in the <strong>{setting?.name}</strong> setting. However, you are not logged in, so your characters and progress will be lost when you leave and will not be saved.</p>
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
    );
};

export default StartModal;
