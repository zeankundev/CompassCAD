import React, { useEffect, useState } from 'react';
import style from '../App.module.css';

interface ToastProps {
    message: string;
    duration?: number;
    onClose: () => void;
}

interface ToastState {
    message: string;
    isVisible: boolean;
}

let toastTimeout: NodeJS.Timeout;
let showToast: (message: string) => void;

export const Toast: React.FC<ToastProps> = ({ message, duration = 3000, onClose }) => {
    const [isPaused, setIsPaused] = useState(false);
    let remainingTime = duration;
    let startTime: number;

    useEffect(() => {
        if (!isPaused && message) {
            startTime = Date.now();
            toastTimeout = setTimeout(onClose, remainingTime);
        }
        return () => clearTimeout(toastTimeout);
    }, [message, isPaused]);

    const handleMouseEnter = () => {
        clearTimeout(toastTimeout);
        remainingTime -= Date.now() - startTime;
        setIsPaused(true);
    };

    const handleMouseLeave = () => {
        setIsPaused(false);
    };

    return message ? (
        <div
            className={style.toast}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {message}
        </div>
    ) : null;
};

// Toast Container Component
export const ToastContainer: React.FC = () => {
    const [toastState, setToastState] = useState<ToastState>({
        message: '',
        isVisible: false,
    });

    // Assign the showToast function
    showToast = (message: string) => {
        setToastState({ message, isVisible: true });
    };

    const handleClose = () => {
        setToastState({ message: '', isVisible: false });
    };

    return (
        <div className={style['toast-container']}>
            {toastState.isVisible && (
                <Toast message={toastState.message} onClose={handleClose} />
            )}
        </div>
    );
};

// Export the toast function
export const toast = (message: string): Promise<void> => {
    return new Promise((resolve) => {
        showToast(message);
        setTimeout(resolve, 3000);
    });
};