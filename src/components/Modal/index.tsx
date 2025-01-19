import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context'; // Adjust the import path as necessary

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string; // Add an optional title prop
    width?: string; // Add an optional width prop
}

const Modal: React.FC<ModalProps> = ({ isOpen: initialIsOpen, onClose, children, title, width }) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(initialIsOpen);

    const handleClose = () => {
        setIsOpen(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900 bg-opacity-75' : 'bg-gray-100 bg-opacity-75'}`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 w-full ${width ? width : 'max-w-md'} mx-auto relative`}
            >
                <button
                    onClick={handleClose}
                    className={`absolute top-0 right-0 mt-4 mr-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
                >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                >
                    <path
                        fillRule="evenodd"
                        d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.5l4.714 4.715a.75.75 0 01-1.06 1.06L12 11.475l-4.715 4.714a.75.75 0 01-1.06-1.06L10.94 10.5 6.225 5.775a.75.75 0 010-1.06z"
                        clipRule="evenodd"
                    />
                </svg>
                </button>
                {title && <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>{title}</h2>}
                {children}
            </motion.div>
        </div>
    );
};

export default Modal;