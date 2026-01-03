export const getBackendUrl = (): string => {
    // URL FIXA DO TUNNEL
    const tunnelUrl = 'https://vitta-manager-api.loca.lt';

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
    }

    return 'http://localhost:3001';
};

export const getTunnelPassword = (): string => {
    return '2804:4dbc:8b00:ed:1d20:a136:73d9:75c8';
};
