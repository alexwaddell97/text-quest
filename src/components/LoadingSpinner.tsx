import React from 'react';

interface LoadingSpinnerProps {
    size?: number;
    strokeWidth?: number;
    className?: string;
    label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 16,
    strokeWidth = 2,
    className = '',
    label = 'Loading',
}) => {
    return (
        <span
            role="status"
            aria-live="polite"
            aria-label={label}
            className={`inline-flex items-center justify-center ${className}`}
        >
            <span
                className="inline-block animate-spin rounded-full border-current border-t-transparent"
                style={{ width: size, height: size, borderWidth: strokeWidth }}
            />
            <span className="sr-only">{label}</span>
        </span>
    );
};

export default LoadingSpinner;
