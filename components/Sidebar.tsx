import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { getBackendUrl } from '../lib/api';
import {
  LayoutDashboard,
  QrCode,
  MessageSquare,
  Settings,
  Smartphone,
  Zap,
  Wallet,
  Calendar,
  Table,
  Users,
  ShoppingCart,
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const [deviceStatus, setDeviceStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const backendUrl = getBackendUrl();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${backendUrl}/connection-status`);
        if (res.ok) {
          const data = await res.json();
          setDeviceStatus(data.status);
        }
      } catch (error) {
        console.error('Error fetching connection status:', error);
        setDeviceStatus('disconnected');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [backendUrl]);
  const navItems = [
    { id: Page.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: Page.CALENDAR, label: 'Calendário', icon: Calendar },
    { id: Page.CONVERSATIONS, label: 'Conversas', icon: MessageSquare },
    { id: Page.WHATSAPP_CHAT, label: 'WhatsApp', icon: Zap },
    { id: Page.SALES, label: 'Vendas', icon: ShoppingCart },
    { id: Page.FINANCE, label: 'Financeiro', icon: Wallet },
    { id: Page.EXPENSES, label: 'Estrutura de Gastos', icon: Table },
    { id: Page.EMPLOYEES, label: 'Funcionários', icon: UserCheck },
    { id: Page.CLIENTS, label: 'Clientes', icon: Users },
    { id: Page.SETTINGS, label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 flex flex-col bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 flex-shrink-0 z-20 transition-colors">
      <div
        className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
        onClick={() => onNavigate(Page.DASHBOARD)}
      >
        <div className="flex items-center gap-3 w-full">
          <img
            src="/logo.png"
            alt="Go Solutions Logo"
            className="h-10 w-auto object-contain"
          />
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group border ${activePage === item.id
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 font-bold border-emerald-100 dark:border-emerald-500/20 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
              }`}
          >
            <item.icon className={`w-5 h-5 transition-colors ${activePage === item.id ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex items-center justify-between border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
              <Smartphone className="w-4 h-4 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">Dispositivo</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {deviceStatus === 'connected' ? 'Dispositivo conectado' : 'Dispositivo desconectado'}
              </p>
            </div>
          </div>
          <div className={`w-2 h-2 rounded-full ${deviceStatus === 'connected' ? 'bg-green-500 ring-green-100 dark:ring-green-500/10' : 'bg-red-500 ring-red-100 dark:ring-red-500/10'} animate-pulse ring-4`}></div>
        </div>

        <button
          onClick={() => onNavigate(Page.CONNECT)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activePage === Page.CONNECT
            ? 'bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20'
            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500/50'
            }`}
        >
          <QrCode className={`w-5 h-5 ${activePage === Page.CONNECT ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'}`} />
          <span className="text-sm">Conectar WhatsApp</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
