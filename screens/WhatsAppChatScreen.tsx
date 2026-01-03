import React, { useState, useEffect, useRef } from 'react';
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
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    // 1. Check Connection Status
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${backendUrl}/whatsapp/status`);
                const data = await response.json();
                setIsConnected(data.connected);
            } catch (error) {
                console.error('Error checking WhatsApp status:', error);
                setIsConnected(false);
            } finally {
                setIsCheckingStatus(false);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    // 2. Mock some chats for UI demonstration (replace with API later)
    useEffect(() => {
        if (isConnected) {
            setChats([
                { id: '5511999999999@s.whatsapp.net', name: 'João Silva', lastMessage: 'Olá, gostaria de um orçamento.', timestamp: Date.now() - 100000, unreadCount: 2 },
                { id: '5511888888888@s.whatsapp.net', name: 'Maria Souza', lastMessage: 'Obrigada pelo atendimento!', timestamp: Date.now() - 500000, unreadCount: 0 },
                { id: '5511777777777@s.whatsapp.net', name: 'Pedro Santos', lastMessage: 'Vou falar com meu sócio.', timestamp: Date.now() - 1000000, unreadCount: 1 },
            ]);
        }
    }, [isConnected]);

    // 3. Auto-scroll
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
                    to: selectedChat.id.split('@')[0],
                    message: text
                })
            });

            if (response.ok) {
                // Optimistic update
                const msg: WhatsAppMessage = {
                    id: Date.now().toString(),
                    fromMe: true,
                    body: text,
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, msg]);
                setNewMessage('');
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
                    <p className="text-slate-500 font-bold animate-pulse">Verificando conexão WhatsApp...</p>
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
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">WhatsApp Desconectado</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-md text-sm leading-relaxed">
                    Você precisa conectar seu WhatsApp para ver as conversas e enviar mensagens por aqui.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-8 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <RefreshCw className="w-5 h-5" /> Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-6 animate-in fade-in duration-300">
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex">

                {/* Chats Sidebar */}
                <div className="w-80 md:w-96 flex flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                WhatsApp <Zap className="w-5 h-5 text-emerald-500" />
                            </h3>
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[10px] font-black rounded-lg border border-emerald-200 dark:border-emerald-500/20">ON</span>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Pesquisar contatos..."
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
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center font-black text-sm border border-emerald-200 dark:border-emerald-500/20 uppercase">
                                            <UserIcon className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate tracking-tight">{chat.name}</h4>
                                            {chat.timestamp && (
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate pr-2">{chat.lastMessage || '...'}</p>
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

                        {filteredChats.length === 0 && (
                            <div className="p-12 text-center">
                                <p className="text-sm text-slate-400 font-medium">Nenhuma conversa encontrada.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                {selectedChat ? (
                    <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/10">
                        <div className="h-20 px-8 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-md">
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                                        {selectedChat.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ativo no WhatsApp</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-8 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
                        >
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                                    <MessageCircle className="w-16 h-16 text-slate-400 mb-4" />
                                    <p className="text-sm font-bold text-slate-500">Inicie uma conversa por WhatsApp</p>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.fromMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[75%] overflow-hidden rounded-3xl shadow-lg ${msg.fromMe ? 'bg-emerald-500 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                                        <div className="px-5 py-4">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 mt-2 px-1 ${msg.fromMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {msg.fromMe && (
                                            <CheckCheck className="w-3.5 h-3.5 text-emerald-500 opacity-50" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                            <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-5xl mx-auto relative">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Responda por WhatsApp..."
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm rounded-2xl py-4 px-6 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending}
                                    className="p-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:shadow-none text-white rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                                >
                                    {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/30 dark:bg-slate-900/10">
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-500 mb-8 border-4 border-emerald-500/5">
                            <Zap className="w-12 h-12" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Conversas WhatsApp</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-sm text-sm">
                            Selecione um cliente para visualizar as mensagens e responder diretamente pelo sistema.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppChatScreen;
