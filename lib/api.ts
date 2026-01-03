export const getBackendUrl = (): string => {

    // --- URL TÚNEL DINÂMICA (Atualizada em 03/01) ---
    const tunnelUrl = 'https://decab30da15c42.lhr.life';

    // Se estiver em produção (Vercel define isso)
    if (import.meta.env.VITE_BACKEND_URL) {
        // Se a variável de ambiente for o padrão localhost, forçamos o túnel
        if (import.meta.env.VITE_BACKEND_URL.includes('localhost')) {
            return tunnelUrl;
        }
        return import.meta.env.VITE_BACKEND_URL;
    }

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // Vercel Production
        if (hostname.includes('vercel.app')) {
            return tunnelUrl;
        }

        // Testes Locais em outros dispositivos
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return tunnelUrl;
        }

        // Desenvolvimento Local
        return 'http://localhost:3001';
    }

    return 'http://localhost:3001';
};
