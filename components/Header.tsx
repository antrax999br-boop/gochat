
import React, { useState, useRef, useEffect } from 'react';
import { Page, User, NotificationItem } from '../../types';
import { Bell, Moon, Sun, ChevronRight, User as UserIcon, LogOut } from 'lucide-react';

interface HeaderProps {
  user: User;
  activePage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  notifications: NotificationItem[];
  viewedNotifications: string[];
  onNotificationClick: (note: NotificationItem) => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  activePage,
  onNavigate,
  onLogout,
  isDarkMode,
  toggleDarkMode,
  notifications,
  viewedNotifications,
  onNotificationClick
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const pageTitles: Record<Page, string> = {
    [Page.DASHBOARD]: 'Visão Geral',
    [Page.CONNECT]: 'Conectar WhatsApp',
    [Page.CONVERSATIONS]: 'Conversas',
    [Page.SETTINGS]: 'Configurações',
    [Page.FINANCE]: 'Financeiro',
    [Page.CALENDAR]: 'Calendário',
    [Page.EXPENSES]: 'Estrutura de Gastos',
    [Page.CLIENTS]: 'Gestão de Clientes',
    [Page.SALES]: 'Gestão de Vendas'
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userRole = user.username.toLowerCase() === 'admin' ? 'Admin' : 'Usuário';
  const newNotificationsCount = notifications.filter(n => !viewedNotifications.includes(n.id)).length;

  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-8 flex-shrink-0 z-30 transition-colors">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 dark:text-slate-500 font-medium">Schumacher Tecnologia Ltda.</span>
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
        <span className="text-slate-900 dark:text-slate-100 font-bold">{pageTitles[activePage]}</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-all"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-all relative ${isNotificationsOpen ? 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
          >
            <Bell className="w-5 h-5" />
            {newNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 transition-all transform origin-top-right scale-100 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 mb-1 flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notificações do Dia</p>
                {newNotificationsCount > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">{newNotificationsCount} novas</span>}
              </div>

              {notifications.length > 0 ? (
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {notifications.map((note, index) => {
                    const isViewed = viewedNotifications.includes(note.id);
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          onNotificationClick(note);
                          setIsNotificationsOpen(false);
                        }}
                        className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-0`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isViewed ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          <div className={isViewed ? 'opacity-60' : ''}>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{note.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{note.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">Hoje</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhuma notificação para hoje</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer ${isMenuOpen ? 'bg-slate-100 dark:bg-slate-900' : ''}`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-green-200 dark:shadow-none">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{user.username}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{userRole}</p>
            </div>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 transition-all transform origin-top-right scale-100 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minha Conta</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-1">{user.email}</p>
              </div>

              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <UserIcon className="w-4 h-4" />
                Meu Perfil
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
