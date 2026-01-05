/* =====================================================
   AUTH CONTROL — AntiGravit Script
   Resolve: login persistente indevido
   Inclui: logout real, expiração, validação e proteção
===================================================== */
import { useEffect } from "react";
import { getBackendUrl } from "./api";

/**
 * Realize o logout real limpando todos os vestígios de sessão
 */
export function logout() {
    if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("schumacher_theme"); // Opcional, mas limpa o estado
        sessionStorage.clear();

        // Limpeza agressiva de cookies
        document.cookie.split(";").forEach(c => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // Redireciona para o início
        window.location.href = "/";
    }
}

/**
 * Salva a sessão no frontend
 */
export async function saveAuthSession(user: any) {
    const backendUrl = getBackendUrl();
    try {
        const response = await fetch(`${backendUrl}/api/auth/login-register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: user.id, email: user.email })
        });
        const data = await response.json();
        if (data.token) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
        }
    } catch (error) {
        console.error("Erro ao sincronizar sessão com backend:", error);
    }
}

/**
 * Hook para proteção de rotas no frontend
 */
export function useAuthGuard(activeUser: any, onLogout: () => void) {
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token && activeUser) {
            // Se temos um usuário mas não temos token, algo está errado (ou logado via Supabase apenas)
            return;
        }

        if (token) {
            fetch(`${getBackendUrl()}/api/auth/validate`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                if (!res.ok) {
                    logout();
                    onLogout();
                }
            }).catch(err => {
                console.error("Falha ao validar token:", err);
            });
        }
    }, [activeUser]);
}
