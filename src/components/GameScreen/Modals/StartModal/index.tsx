import React, { useState } from 'react';
import Modal from '@/components/Modal';
import Link from 'next/link';
import { useGameContext } from '@/context/gameContext';


const StartModal: React.FC = () => {
    const { setting } = useGameContext();
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <Modal isOpen={!dismissed} onClose={() => setDismissed(true)}>
        <div className="space-y-6 text-white">
            <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.4em] text-white/60">Heads up</p>
                <h2 className="text-2xl font-semibold">This adventure won&apos;t be saved</h2>
                <p className="text-white/80 leading-relaxed">
                    You&apos;re about to enter <span className="text-rose-300 font-medium">{setting?.name}</span> as a guest. Once you leave, your character sheet, inventory, and objective progress disappear.
                </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[rgba(33,33,38,0.85)] divide-y divide-white/10 overflow-hidden">
                {[ 
                    { title: 'Persist your characters', description: 'Save and return to them anytime, across devices.' },
                    { title: 'Unlock world archives', description: 'Browse prior turns, lore drops, and branching choices.' },
                    { title: 'Access advanced systems', description: 'Inventory, objective tracker, and stat modules stay in sync.' }
                ].map((item, idx) => (
                    <div key={idx} className="p-4 flex gap-4 items-start">
                        <span className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-400 via-amber-500 to-red-800 flex items-center justify-center text-white font-semibold">
                            {idx + 1}
                        </span>
                        <div>
                            <p className="font-semibold text-white">{item.title}</p>
                            <p className="text-sm text-white/70">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-white/70">Log in now to keep everything synced.</p>
                <div className="flex gap-3">
                    <button onClick={() => setDismissed(true)} className="px-5 py-2 rounded-full border border-white/20 text-white/80 whitespace-nowrap">
                        Continue as guest
                    </button>
                    <Link href="/login" className="px-6 py-2 rounded-full bg-gradient-to-r from-rose-400 via-amber-600 to-red-800 text-white font-semibold shadow whitespace-nowrap">
                        Log in &amp; save
                    </Link>
                </div>
            </div>
        </div>
    </Modal>
    );
};

export default StartModal;
