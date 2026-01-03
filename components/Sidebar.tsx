import React from 'react';
import { Page } from '../types';
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
  const navItems = [
    { id: Page.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: Page.CONVERSATIONS, label: 'Conversas', icon: MessageSquare },
    { id: Page.CALENDAR, label: 'Calendário', icon: Calendar },
    { id: Page.FINANCE, label: 'Financeiro', icon: Wallet },
    { id: Page.EXPENSES, label: 'Estrutura de Gastos', icon: Table },
    { id: Page.CLIENTS, label: 'Clientes', icon: Users },
    { id: Page.SALES, label: 'Vendas', icon: ShoppingCart },
    { id: Page.EMPLOYEES, label: 'Funcionários', icon: UserCheck },
    { id: Page.SETTINGS, label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 flex flex-col bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 flex-shrink-0 z-20 transition-colors">
      <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white leading-none flex items-center gap-2">
              Schumacher
              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 text-[8px] rounded-md border border-emerald-500/20">v1.1</span>
            </span>
            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-0.5">Tecnologia Ltda.</span>
          </div>
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
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Não conectado</p>
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ring-4 ring-red-100 dark:ring-red-500/10"></div>
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
