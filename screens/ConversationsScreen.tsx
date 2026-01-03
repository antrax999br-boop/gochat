
import React, { useState, useEffect, useRef } from 'react';
import { User as AppUser } from '../types';
import { supabase } from '../lib/supabase';
import {
  Search,
  MoreVertical,
  Send,
  PlusCircle,
  Smile,
  Mic,
  CheckCheck,
  Check,
  User,
  MessageCircle,
  Users
} from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  last_seen: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  channel_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ConversationsScreenProps {
  currentUser: AppUser;
}

const ConversationsScreen: React.FC<ConversationsScreenProps> = ({ currentUser }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUser.id)
        .order('username');

      if (data) setProfiles(data);
      if (error) console.error('Error fetching profiles:', error);
    };

    fetchProfiles();
  }, [currentUser.id]);

  // 2. Fetch Messages on Select
  useEffect(() => {
    const fetchMessages = async () => {
      if (activeTab === 'users' && !selectedProfile) {
        setMessages([]);
        return;
      }

      let query = supabase.from('chat_messages').select('*');

      if (activeTab === 'users' && selectedProfile) {
        // Private chat logic: (Me -> Him) OR (Him -> Me)
        query = query.or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedProfile.id}),and(sender_id.eq.${selectedProfile.id},receiver_id.eq.${currentUser.id})`);
      } else {
        // Group chat
        query = query.eq('channel_id', 'general');
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (data) setMessages(data);
      if (error) console.error('Error fetching messages:', error);
    };

    fetchMessages();
  }, [selectedProfile, activeTab, currentUser.id]);

  // 3. Real-time Subscription (Managed in a separate useEffect to avoid race conditions during state reset)
  useEffect(() => {
    // We listen to ALL messages globally for the chat component
    const channel = supabase
      .channel('internal-chat-sync')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const m = payload.new as ChatMessage;

        // Check if message belongs to current focused view
        const isForGeneral = activeTab === 'groups' && m.channel_id === 'general';
        const isForSelectedUser = activeTab === 'users' && selectedProfile && (
          (m.sender_id === currentUser.id && m.receiver_id === selectedProfile.id) ||
          (m.sender_id === selectedProfile.id && m.receiver_id === currentUser.id)
        );

        if (isForGeneral || isForSelectedUser) {
          setMessages(prev => {
            if (prev.find(existing => existing.id === m.id)) return prev;
            return [...prev, m];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedProfile, activeTab, currentUser.id]);

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;

    const messageData = {
      sender_id: currentUser.id,
      receiver_id: activeTab === 'users' ? selectedProfile?.id : null,
      channel_id: activeTab === 'groups' ? 'general' : 'private', // 'private' just to tag non-general
      content: text,
    };

    // Optimistic Update: Add message immediately for better speed
    const tempId = 'temp-' + Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      ...messageData,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');

    const { data, error } = await supabase.from('chat_messages').insert(messageData).select().single();

    if (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert('Erro ao enviar mensagem.');
    } else if (data) {
      // Replace optimistic message with real message from DB to sync correct ID and timestamp
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-300">
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex">

        {/* Left List */}
        <div className="w-80 md:w-96 flex flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Chat Interno</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`p-2 rounded-lg transition-all ${activeTab === 'users' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400'}`}
                >
                  <User className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab('groups');
                    setSelectedProfile(null);
                  }}
                  className={`p-2 rounded-lg transition-all ${activeTab === 'groups' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400'}`}
                >
                  <Users className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'groups' && (
              <div
                onClick={() => {
                  setSelectedProfile(null);
                  setActiveTab('groups');
                }}
                className={`p-4 cursor-pointer border-l-4 transition-all hover:bg-white dark:hover:bg-slate-900 ${activeTab === 'groups' ? 'bg-white dark:bg-slate-900 border-emerald-500' : 'border-transparent'}`}
              >
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center font-black text-sm border border-blue-600 shadow-md">
                    G
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">Geral (Equipe)</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Comunidade</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                onClick={() => setSelectedProfile(profile)}
                className={`p-4 cursor-pointer border-l-4 transition-all hover:bg-white dark:hover:bg-slate-900 ${selectedProfile?.id === profile.id ? 'bg-white dark:bg-slate-900 border-emerald-500' : 'border-transparent'}`}
              >
                <div className="flex gap-4 items-center">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center font-black text-sm border border-emerald-200 dark:border-emerald-500/20 uppercase">
                      {profile.username.substring(0, 2)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate tracking-tight">{profile.username}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">Funcionário</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {(selectedProfile || activeTab === 'groups') ? (
          <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/10">
            <div className="h-20 px-8 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl ${activeTab === 'groups' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'} flex items-center justify-center font-black text-sm border border-opacity-20 shadow-md`}>
                  {activeTab === 'groups' ? 'G' : selectedProfile?.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                    {activeTab === 'groups' ? 'Chat Geral Schumacher' : selectedProfile?.username}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Online</p>
                  </div>
                </div>
              </div>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-8 space-y-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
            >
              {messages.map((msg) => {
                const isMe = msg.sender_id === currentUser.id;
                const senderProfile = profiles.find(p => p.id === msg.sender_id);

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    {!isMe && activeTab === 'groups' && (
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                        {senderProfile?.username || 'Colega'}
                      </span>
                    )}
                    <div className={`max-w-[75%] px-5 py-4 rounded-3xl shadow-lg ${isMe ? 'bg-emerald-500 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 mt-2 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && !msg.id.startsWith('temp-') && (
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <MessageCircle className="w-12 h-12 mb-4 animate-bounce" />
                  <p className="text-sm font-bold uppercase tracking-widest italic">Inicie esta conversa!</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-5xl mx-auto">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Falar com a equipe..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm rounded-2xl py-4 pl-6 pr-14 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:shadow-none text-white rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/30 dark:bg-slate-900/10">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-500 mb-8 border-4 border-emerald-500/5 rotate-3 shadow-sm">
              <MessageCircle className="w-12 h-12" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Schumacher Chat</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-sm text-sm">Escolha alguém ao lado para conversar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsScreen;
