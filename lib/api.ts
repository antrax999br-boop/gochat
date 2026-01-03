export const getBackendUrl = (): string => {

    // --- URL TÚNEL ESTÁVEL (Sem Senha) ---
    // Atualizado automaticamente para:
    const tunnelUrl = 'https://f2e44e0640585b.lhr.life';

    if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
    }

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // Vercel -> Tunnel
        if (hostname.includes('vercel.app')) {
            return tunnelUrl;
        }

        // Se estiver acessando de qualquer lugar que não seja localhost
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return tunnelUrl;
        }

        // Local
        return 'http://localhost:3001';
    }

    return 'http://localhost:3001';
};
