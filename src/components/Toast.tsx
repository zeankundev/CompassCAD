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
    const [isLeaving, setIsLeaving] = useState(false);
    const [isEntering, setIsEntering] = useState(true);
    let remainingTime = duration;
    let startTime: number;

    useEffect(() => {
        setIsEntering(true);
        const enterTimeout = setTimeout(() => setIsEntering(false), 300);

        if (!isPaused && message) {
            startTime = Date.now();
            const timeout = setTimeout(() => {
                setIsLeaving(true);
                // Add a small delay for the animation to complete
                setTimeout(onClose, 300);
            }, remainingTime);
            return () => {
                clearTimeout(timeout);
                clearTimeout(enterTimeout);
            };
        }
    }, [message, isPaused]);

    const handleMouseEnter = () => {
        startTime = Date.now();
        setIsPaused(true);
    };

    const handleMouseLeave = () => {
        setIsPaused(false);
    };

    const getAnimation = () => {
        if (isLeaving) return 'toast-leave 0.3s ease';
        if (isEntering) return 'toast-enter 0.3s ease';
        return 'none';
    };

    return (
        <div
            className={style.toast}
            style={{animation: getAnimation()}}
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