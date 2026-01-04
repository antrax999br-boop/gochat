export const getBackendUrl = (): string => {

    // --- URL TÚNEL SERVEO (Sem Senha) ---
    const tunnelUrl = 'https://d9f578a30d0c3db3-45-235-251-97.serveousercontent.com';

    if (import.meta.env.VITE_BACKEND_URL) {
        if (import.meta.env.VITE_BACKEND_URL.includes('localhost')) {
            return tunnelUrl;
        }
        return import.meta.env.VITE_BACKEND_URL;
    }

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.includes('vercel.app')) return tunnelUrl;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') return tunnelUrl;
        return 'http://localhost:3001';
    }

    return 'http://localhost:3001';
};
