
import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message } from '../types';
import { 
  Search, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  CheckCheck, 
  Check,
  User,
  PlusCircle,
  Hash,
  MessageCircle
} from 'lucide-react';

const mockConversations: Conversation[] = [
  { id: '1', name: 'João Silva', lastMessage: 'Quero saber mais sobre os serviços', time: '10:30', unreadCount: 2, avatar: 'JS', phone: '+55 11 99999-0001' },
  { id: '2', name: 'Maria Santos', lastMessage: 'Obrigada pelas informações!', time: '09:45', unreadCount: 0, avatar: 'MS', phone: '+55 21 98888-0002' },
  { id: '3', name: 'Pedro Costa', lastMessage: 'Qual o horário de funcionamento?', time: 'Ontem', unreadCount: 1, avatar: 'PC', phone: '+55 31 97777-0003' },
  { id: '4', name: 'Ana Oliveira', lastMessage: 'Perfeito, aguardo o retorno.', time: 'Ontem', unreadCount: 0, avatar: 'AO', phone: '+55 11 96666-0004' },
];

const initialMessages: Message[] = [
  { id: 'm1', sender: 'Bot', text: 'Olá! Como posso ajudar você hoje?', timestamp: '10:25', isMe: false },
  { id: 'm2', sender: 'João Silva', text: 'Olá, gostaria de saber mais sobre os serviços de limpeza.', timestamp: '10:28', isMe: true, status: 'read' },
  { id: 'm3', sender: 'Bot', text: 'Com certeza! Temos planos mensais e avulsos. Qual sua necessidade?', timestamp: '10:28', isMe: false },
  { id: 'm4', sender: 'João Silva', text: 'Quero saber mais sobre os serviços residenciais.', timestamp: '10:30', isMe: true, status: 'delivered' },
];

const ConversationsScreen: React.FC = () => {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(mockConversations[0]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'Você',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Mock bot response after 1.5s
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'Bot',
        text: 'Obrigado pelo seu contato! Um de nossos consultores irá analisar sua mensagem e retornará o mais breve possível. Posso ajudar em algo mais?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-300">
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex">
        
        {/* Left List */}
        <div className="w-80 md:w-96 flex flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Conversas</h3>
                <button className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500/20 transition-all">
                   <PlusCircle className="w-5 h-5" />
                </button>
             </div>
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Pesquisar contatos..."
                  className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
             </div>
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['Tudo', 'Não lidas', 'Grupos', 'Agendas'].map((filter, i) => (
                  <button key={i} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${i === 0 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}>
                    {filter}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {mockConversations.map((conv) => (
              <div 
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`p-4 cursor-pointer border-l-4 transition-all hover:bg-white dark:hover:bg-slate-900 ${selectedConv?.id === conv.id ? 'bg-white dark:bg-slate-900 border-emerald-500' : 'border-transparent'}`}
              >
                <div className="flex gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center font-black text-sm border border-emerald-200 dark:border-emerald-500/20">
                      {conv.avatar}
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate tracking-tight">{conv.name}</h4>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{conv.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate line-clamp-1">{conv.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Chat Area */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/10">
            {/* Chat Header */}
            <div className="h-20 px-8 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center font-black text-sm border border-emerald-200 dark:border-emerald-500/20">
                  {selectedConv.avatar}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">{selectedConv.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{selectedConv.phone}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <button className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"><Search className="w-5 h-5" /></button>
                 <button className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Chat History */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-8 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
            >
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[80%] px-5 py-4 rounded-3xl shadow-sm ${msg.isMe ? 'bg-emerald-500 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 mt-2 px-1 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{msg.timestamp}</span>
                    {msg.isMe && (
                      msg.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Check className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-5xl mx-auto">
                 <div className="flex gap-1 pb-1">
                    <button type="button" className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><PlusCircle className="w-6 h-6" /></button>
                    <button type="button" className="p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><Smile className="w-6 h-6" /></button>
                 </div>
                 <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm rounded-2xl py-4 pl-6 pr-14 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-white"
                    />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors">
                      <Mic className="w-5 h-5" />
                    </button>
                 </div>
                 <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="p-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:shadow-none text-white rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                   <Send className="w-6 h-6" />
                 </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/30 dark:bg-slate-900/10">
             <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mb-6">
                <MessageCircle className="w-10 h-10" />
             </div>
             <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Suas Mensagens</h3>
             <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs">Selecione uma conversa ao lado para visualizar o histórico de mensagens e responder.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsScreen;
