import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
    Search,
    Send,
    MessageCircle,
    RefreshCw,
    MoreVertical,
    User as UserIcon,
    CheckCheck,
    Zap,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { getBackendUrl } from '../lib/api';

interface WhatsAppMessage {
    id: string;
    fromMe: boolean;
    body: string;
    timestamp: number;
}

interface WhatsAppChat {
    id: string; // JID
    name: string;
    lastMessage?: string;
    timestamp?: number;
    unreadCount: number;
}

const WhatsAppChatScreen: React.FC = () => {
    const [chats, setChats] = useState<WhatsAppChat[]>([]);
    const [selectedChat, setSelectedChat] = useState<WhatsAppChat | null>(null);
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoadingChats, setIsLoadingChats] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);

    const socketRef = useRef<Socket | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const backendUrl = getBackendUrl();

    // 1. Setup Socket & Check Status
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${backendUrl}/whatsapp/status`);
                const data = await response.json();
                setIsConnected(data.connected);

                if (data.connected && !socketRef.current) {
                    socketRef.current = io(backendUrl);
                    socketRef.current.on('new_message', (payload: any) => {
                        fetchChats();
                        if (selectedChatRef.current?.id === payload.jid) {
                            const msg: WhatsAppMessage = {
                                id: payload.timestamp + Math.random().toString(),
                                fromMe: false,
                                body: payload.message,
                                timestamp: payload.timestamp * 1000
                            };
                            setMessages(prev => [...prev, msg]);
                        }
                    });
                }
            } catch (error) {
                console.error('Error checking WhatsApp status:', error);
                setIsConnected(false);
            } finally {
                setIsCheckingStatus(false);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 10000);
        return () => {
            clearInterval(interval);
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, []);

    // Ref to track selectedChat in socket callback
    const selectedChatRef = useRef<WhatsAppChat | null>(null);
    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    // 2. Fetch Chats
    const fetchChats = async () => {
        if (!isConnected) return;
        setIsLoadingChats(true);
        try {
            const response = await fetch(`${backendUrl}/whatsapp/chats`);
            const data = await response.json();

            const mapped: WhatsAppChat[] = data.map((c: any) => ({
                id: c.id,
                name: c.name || c.id.split('@')[0],
                lastMessage: c.conversationTimestamp ? 'Atividade recente' : undefined,
                timestamp: c.conversationTimestamp ? c.conversationTimestamp * 1000 : undefined,
                unreadCount: c.unreadCount || 0
            }));

            setChats(mapped);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setIsLoadingChats(false);
        }
    };

    useEffect(() => {
        if (isConnected) {
            fetchChats();
        }
    }, [isConnected]);

    // 3. Fetch Messages
    const fetchMessages = async (jid: string) => {
        setIsLoadingMessages(true);
        try {
            const response = await fetch(`${backendUrl}/whatsapp/messages/${jid}`);
            const data = await response.json();

            const mapped: WhatsAppMessage[] = data.map((m: any) => {
                const body = m.message?.conversation || m.message?.extendedTextMessage?.text || 'Mídia/Outro';
                return {
                    id: m.key.id,
                    fromMe: m.key.fromMe,
                    body: body,
                    timestamp: (m.messageTimestamp || Date.now() / 1000) * 1000
                };
            }).filter((m: any) => m.body !== 'Mídia/Outro');

            setMessages(mapped);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.id);
        } else {
            setMessages([]);
        }
    }, [selectedChat?.id]);

    // 4. Auto-scroll
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || isSending) return;

        const text = newMessage.trim();
        setIsSending(true);

        try {
            const response = await fetch(`${backendUrl}/whatsapp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: selectedChat.id,
                    message: text
                })
            });

            if (response.ok) {
                const msg: WhatsAppMessage = {
                    id: 'temp-' + Date.now(),
                    fromMe: true,
                    body: text,
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, msg]);
                setNewMessage('');
                setTimeout(fetchChats, 1000);
            } else {
                alert('Erro ao enviar mensagem via WhatsApp.');
            }
        } catch (error) {
            console.error('Error sending WhatsApp message:', error);
            alert('Falha ao conectar ao servidor de WhatsApp.');
        } finally {
            setIsSending(false);
        }
    };

    const filteredChats = chats.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.includes(searchTerm)
    );

    if (isCheckingStatus) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                    <p className="text-slate-500 font-bold animate-pulse">Iniciando serviço de mensagens...</p>
                </div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center text-rose-600 mb-8 border-4 border-rose-500/5">
                    <AlertCircle className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">WhatsApp Offline</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-md text-sm leading-relaxed">
                    A conexão com o WhatsApp não foi detectada. Verifique se o seu celular está conectado.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-8 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <RefreshCw className="w-5 h-5" /> Tentar Reconectar
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 animate-in fade-in duration-300">
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex">

                {/* Sidebar */}
                <div className="w-80 md:w-96 flex flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                WhatsApp <Zap className="w-5 h-5 text-emerald-500" />
                            </h3>
                            <button onClick={fetchChats} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors">
                                <RefreshCw className={`w-4 h-4 ${isLoadingChats ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar conversas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {filteredChats.map((chat) => (
                            <div
                                key={chat.id}
                                onClick={() => setSelectedChat(chat)}
                                className={`p-4 cursor-pointer border-l-4 transition-all hover:bg-white dark:hover:bg-slate-900 ${selectedChat?.id === chat.id ? 'bg-white dark:bg-slate-900 border-emerald-500' : 'border-transparent'}`}
                            >
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center font-black text-sm border border-emerald-200 dark:border-emerald-500/20">
                                        <UserIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate tracking-tight">
                                                {chat.name}
                                            </h4>
                                            {chat.timestamp && (
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate pr-2">
                                                {chat.lastMessage || 'Sem mensagens recentes'}
                                            </p>
                                            {chat.unreadCount > 0 && (
                                                <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                    {chat.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Chat Area */}
                {selectedChat ? (
                    <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/10">
                        <div className="h-20 px-8 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white leading-tight">
                                        {selectedChat.name}
                                    </h3>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Conexão Ativa</p>
                                </div>
                            </div>
                            <button className="p-2.5 text-slate-400 hover:text-emerald-500 rounded-xl transition-all">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>

                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-8 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
                        >
                            {isLoadingMessages ? (
                                <div className="h-full flex items-center justify-center font-bold text-slate-400 animate-pulse">
                                    Carregando mensagens...
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                                        <div className={`max-w-[75%] px-5 py-4 rounded-3xl shadow-sm ${msg.fromMe ? 'bg-emerald-500 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                        </div>
                                        <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${msg.fromMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {msg.fromMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-500 opacity-50" />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                            <form onSubmit={handleSendMessage} className="flex gap-3 max-w-5xl mx-auto">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escreva sua mensagem..."
                                    className="flex-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending}
                                    className="p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                                >
                                    {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/30 dark:bg-slate-900/10">
                        <MessageCircle className="w-16 h-16 text-emerald-500/20 mb-4" />
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Selecione uma conversa</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs text-sm">
                            Escolha um cliente na lista ao lado para ver o histórico e enviar novas mensagens.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppChatScreen;
