export const getBackendUrl = (): string => {
    // 1. Se houver uma variável de ambiente definida (PRODUÇÃO), usa ela
    if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
    }

    // 2. Se estiver rodando no navegador (lado do cliente) em DESENVOLVIMENTO
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // Se estiver acessando via localhost, assume backend na 3001
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }

        // Se estiver acessando via IP de rede (ex: 192.168.1.15), 
        // assume que o backend está no mesmo IP, porta 3001.
        // Isso permite testes em outros dispositivos na MESMA rede.
        return `http://${hostname}:3001`;
    }

    // Fallback padrão
    return 'http://localhost:3001';
};
