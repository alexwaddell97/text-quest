import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string; // Add an optional title prop
    width?: string; // Add an optional width prop
}

const Modal: React.FC<ModalProps> = ({ isOpen: initialIsOpen, onClose, children, title, width }) => {
    const [isOpen, setIsOpen] = useState(initialIsOpen);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        setIsOpen(initialIsOpen);
    }, [initialIsOpen]);

    const handleClose = () => {
        setIsOpen(false);
        onClose();
    };

    useEffect(() => {
        if (!hasMounted) {
            return;
        }
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = isOpen ? 'hidden' : previousOverflow;
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [hasMounted, isOpen]);

    if (!hasMounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4 sm:p-8" role="dialog" aria-modal="true">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative mx-auto flex h-auto w-full max-h-[calc(100vh-2rem)] flex-col overflow-y-auto rounded-3xl border border-[var(--border)] p-6 text-[var(--text)] shadow-2xl ${width ? width : 'max-w-lg'}`}
                style={{ background: 'linear-gradient(to bottom, var(--elevated), var(--panel), var(--bg))' }}
            >
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-white/70 hover:text-white"
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
                {title && <h2 className="text-lg font-semibold mb-4 text-[var(--text)]">{title}</h2>}
                {children}
            </motion.div>
        </div>,
        document.body
    );
};

export default Modal;