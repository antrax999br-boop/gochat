export const getBackendUrl = (): string => {
    // Se a variável de ambiente estiver definida (cenário ideal de produção configurado)
    if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
    }

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // --- INTEGRAÇÃO VERCEL (Produção) ---
        // Se estiver acessando pelo link do Vercel, devemos apontar para o Tunnel atual do seu PC.
        // ATENÇÃO: Esta URL muda se você reiniciar o localtunnel
        if (hostname.includes('vercel.app')) {
            return 'https://loose-buttons-sniff.loca.lt';
        }

        // --- INTEGRAÇÃO LOCALTUNNEL (Dev Remoto) ---
        if (hostname.endsWith('.loca.lt')) {
            return 'https://loose-buttons-sniff.loca.lt';
        }

        // --- DEV LOCAL ---
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }

        // Rede Local
        return `http://${hostname}:3001`;
    }

    return 'http://localhost:3001';
};
