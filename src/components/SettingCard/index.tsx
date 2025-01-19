import { motion } from "framer-motion";
import { useTheme } from '@/context'; // Adjust the import path as necessary
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/userContext';

export default function SettingCard({ setting, onClick }: any) {
    const { theme } = useTheme();
    const [liked, setLiked] = useState(false);
    const { user } = useAuth();

    console.log(user)

    // Define variants
    const parentVariants = {
        initial: { opacity: 0, y: 0 },
        animate: { opacity: 1, y: 0 },
    };

    useEffect(() => {
        if (user && user.votes) {
            console.log(user.votes)
            const hasVoted = user.votes.some((vote: any) => vote.setting_id === setting._id);
            setLiked(hasVoted);
        }
    }, []);

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering the onClick of the parent div
        setLiked(!liked);

        // Update the likes count locally
        if (liked) {
            setting.votes -= 1;
        } else {
            setting.votes += 1;
        }

        fetch('/api/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: '60c72b2f5b4a0f001f2e9c70', // Replace with actual user ID
                setting_id: setting._id,
                voteType: liked ? 'down' : 'up',
            }),
        })
            .then(response => response.json())
            .then(data => {
                console.log('Vote response:', data);
            })
            .catch(error => {
                console.error('Error voting:', error);
            });
    };

    return (
        <motion.div
            id="parent"
            className={`${
                theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
            } rounded-lg h-48 flex items-center justify-center shadow-md relative`}
            style={{
                backgroundImage: `url(${setting.cover_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
            variants={parentVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            transition={{ duration: 0.3 }}
            onClick={onClick}
        >
            {/* Overlay BG 40% */}
            <div className="absolute inset-0 bg-black opacity-40 rounded-lg z-0 pointer-events-none"></div>
            {/* Heart Icon */}
            <motion.div 
                whileHover={{scale: 1.1}} 
                className="absolute cursor-pointer top-2 left-2 flex items-center space-x-1 z-[11]"
                onClick={handleLikeClick}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 ${liked ? 'text-red-500' : 'text-white'}`}
                    viewBox="0 0 20 20"
                    fill={liked ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656l-6.364 6.364a.5.5 0 01-.708 0l-6.364-6.364a4 4 0 010-5.656z"
                        clipRule="evenodd"
                    />
                </svg>
                <span className="text-white mt-1">{setting.votes}</span>
            </motion.div>
            <motion.div
                className="flex flex-col justify-center items-center text-center h-full w-full pointer-events-auto z-10"
                transition={{ duration: 0.3 }}
            >
                <h2 className="text-white font-bold text-lg relative">{setting.name}</h2>
               <Link href={`/play/${setting._id}`}>
               <button  className="mt-2 px-4 py-2 cursor-pointer bg-indigo-600 text-white rounded-full flex items-center space-x-2 hover:bg-indigo-700 transition duration-300">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11.414V13a1 1 0 001.707.707l3-3a1 1 0 000-1.414l-3-3A1 1 0 009 6.586z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>Play</span>
                </button>
                
                </Link>
            </motion.div>
        </motion.div>
    );
}
