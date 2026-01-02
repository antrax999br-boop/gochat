import React, { useMemo, useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  CreditCard,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from '../types';

interface DashboardProps {
  transactions: Transaction[];
}

const DashboardScreen: React.FC<DashboardProps> = ({ transactions }) => {

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][now.getMonth()];
    const lastMonthIndex = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthStr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][lastMonthIndex];

    // Totals
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalBalance = totalIncome - totalExpense;

    // Monthly Stats
    const currentMonthTrans = transactions.filter(t => t.month === currentMonthStr);
    const lastMonthTrans = transactions.filter(t => t.month === lastMonthStr);

    const monthIncome = currentMonthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const monthExpense = currentMonthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    // Growth Calculation (Income vs Last Month)
    const lastMonthIncome = lastMonthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);

    let growthPercent = 0;
    if (lastMonthIncome > 0) {
      growthPercent = ((monthIncome - lastMonthIncome) / lastMonthIncome) * 100;
    } else if (monthIncome > 0) {
      growthPercent = 100; // 0 to something is 100% growth essentially
    }

    const isPositiveGrowth = growthPercent >= 0;
    const balanceStatus = totalBalance >= 0 ? "Positivo" : "Negativo";

    return {
      totalBalance,
      monthIncome,
      monthExpense,
      growthPercent: growthPercent.toFixed(1),
      isPositiveGrowth,
      balanceStatus
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.map(m => {
      const monthTrans = transactions.filter(t => t.month === m);
      const income = monthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = monthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      return {
        name: m,
        Saldo: income - expense, // Net Balance for the month
        Receita: income,
        Despesa: expense
      };
    }).filter(d => d.Receita > 0 || d.Despesa > 0 || d.Saldo !== 0); // Hide empty months? Or maybe show recent ones.
  }, [transactions]);

  // Health Indicators
  const runwayMonths = stats.monthExpense > 0 ? (stats.totalBalance / stats.monthExpense).toFixed(1) : "Inf.";
  const profitMargin = stats.monthIncome > 0 ? (((stats.monthIncome - stats.monthExpense) / stats.monthIncome) * 100).toFixed(1) : "0";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Dashboard Financeiro</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Visão geral do crescimento e saúde financeira da Schumacher Tecnologia.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Saldo Total */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Saldo Total</p>
              <h3 className={`text-3xl font-extrabold mt-2 tracking-tight ${stats.totalBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
                R$ {stats.totalBalance.toLocaleString()}
              </h3>
            </div>
            <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-transform group-hover:scale-110`}>
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className={`font-bold flex items-center px-2 py-0.5 rounded-full ${stats.balanceStatus === 'Positivo' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {stats.balanceStatus === 'Positivo' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <AlertCircle className="w-3.5 h-3.5 mr-1" />}
              Balanço {stats.balanceStatus}
            </span>
          </div>
        </div>

        {/* Card 2: Receita Mensal */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Entradas (Mês)</p>
              <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">
                R$ {stats.monthIncome.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-110">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className={`font-bold flex items-center px-2 py-0.5 rounded-full ${stats.isPositiveGrowth ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {stats.isPositiveGrowth ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
              {stats.growthPercent}% Crescimento
            </span>
            <span className="text-slate-400 ml-2 font-medium text-[10px]">vs mês anterior</span>
          </div>
        </div>

        {/* Card 3: Despesas Mensais */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Saídas (Mês)</p>
              <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2 tracking-tight">
                R$ {stats.monthExpense.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 transition-transform group-hover:scale-110">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-slate-400 font-medium">Controle de custos</span>
          </div>
        </div>

        {/* Card 4: Lucro Líquido */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Lucro Líquido</p>
              <h3 className={`text-3xl font-extrabold mt-2 tracking-tight ${stats.monthIncome - stats.monthExpense >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
                R$ {(stats.monthIncome - stats.monthExpense).toLocaleString()}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 transition-transform group-hover:scale-110">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className={`font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full`}>
              {profitMargin}% Margem
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Balanço Financeiro</h3>
              <p className="text-sm text-slate-500">evolução do saldo líquido mensal</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="Saldo" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSaldo)" />
                <Area type="monotone" dataKey="Receita" stroke="#3b82f6" strokeWidth={1} fillOpacity={0} strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Health Indicators */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Saúde Financeira</h3>
            <p className="text-sm text-slate-500">Indicadores chave de performance</p>
          </div>
          <div className="p-6 flex flex-col gap-4">
            {[
              { label: 'Margem de Lucro', val: `${profitMargin}%`, status: Number(profitMargin) > 20 ? 'Excelente' : 'Regular' },
              { label: 'Runway (Meses)', val: runwayMonths, status: runwayMonths === 'Inf.' || Number(runwayMonths) > 6 ? 'Seguro' : 'Alerta' },
              { label: 'Ticket Médio', val: transactions.length > 0 ? `R$ ${(stats.totalBalance / transactions.length).toFixed(0)}` : 'R$ 0', status: 'Info' },
            ].map((ind, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm tracking-tight">{ind.label}</span>
                </div>
                <div className="text-right">
                  <span className="block font-black text-slate-900 dark:text-white">{ind.val}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{ind.status}</span>
                </div>
              </div>
            ))}

            <div className="mt-6">
              <div className={`rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group ${stats.totalBalance >= 0 ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/20' : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20'}`}>
                <Activity className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform duration-500" />
                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Status Geral</p>
                    <h4 className="text-3xl font-extrabold tracking-tight">{stats.totalBalance >= 0 ? 'Balanço Positivo' : 'Balanço Negativo'}</h4>
                  </div>
                  {stats.totalBalance >= 0 ? <CheckCircle2 className="w-10 h-10 text-white/40" /> : <AlertCircle className="w-10 h-10 text-white/40" />}
                </div>
                <p className="relative z-10 text-[10px] text-white/70 font-bold uppercase tracking-widest mt-3">Baseado no histórico total</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Últimas Transações</h3>
            <p className="text-sm text-slate-500">Histórico recente de movimentações</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {transactions.slice(0, 4).map((t, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
              <div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} dark:bg-slate-800`}>
                {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate w-32">{t.description}</p>
                  <span className={`text-xs font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'} {t.amount}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="col-span-4 text-center py-8 text-slate-400">Nenhuma transação registrada.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
