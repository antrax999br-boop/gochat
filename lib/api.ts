export const getBackendUrl = (): string => {

    // --- URL BACKEND RENDER ---
    const renderUrl = 'https://vitta-chat-backend.onrender.com';

    if (import.meta.env.VITE_BACKEND_URL) {
        if (import.meta.env.VITE_BACKEND_URL.includes('localhost')) {
            return renderUrl;
        }
        return import.meta.env.VITE_BACKEND_URL;
    }

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.includes('vercel.app')) return renderUrl;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') return renderUrl;
        return 'http://localhost:3001';
    }

    return 'http://localhost:3001';
};
