import React, { useEffect, useState } from 'react';
import style from '../App.module.css';
import '../styles/theme.css'

interface ToastProps {
    message: string;
    duration?: number;
    onClose: () => void;
    id: string; // Add id to identify each toast
}

interface ToastState {
    id: string;
    message: string;
}

let showToast: (message: string) => void;

export const Toast: React.FC<ToastProps> = ({ message, duration = 3000, onClose, id }) => {
    const [isPaused, setIsPaused] = useState(false);
    let remainingTime = duration;
    let startTime: number;

    useEffect(() => {
        if (!isPaused && message) {
            startTime = Date.now();
            const timeout = setTimeout(onClose, remainingTime);
            return () => clearTimeout(timeout);
        }
    }, [message, isPaused]);

    const handleMouseEnter = () => {
        startTime = Date.now();
        setIsPaused(true);
    };

    const handleMouseLeave = () => {
        setIsPaused(false);
    };

    return (
        <div
            className={style.toast}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {message}
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<ToastState[]>([]);

    showToast = (message: string) => {
        const newToast = {
            id: Date.now().toString(),
            message
        };
        setToasts(prev => [...prev, newToast]);
    };

    const handleClose = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <div className={style['toast-container']}>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    message={toast.message}
                    onClose={() => handleClose(toast.id)}
                />
            ))}
        </div>
    );
};

export const toast = (message: string): Promise<void> => {
    return new Promise((resolve) => {
        showToast(message);
        setTimeout(resolve, 5000);
    });
};