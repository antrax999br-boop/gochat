
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  DollarSign,
  Filter,
  BarChart3,
  Search
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const initialTransactions: Transaction[] = [
  { id: '1', description: 'Assinatura API WhatsApp', amount: 250, type: 'expense', date: '2023-10-05', month: 'Out', category: 'Software' },
  { id: '2', description: 'Venda de Plano Premium', amount: 1500, type: 'income', date: '2023-10-10', month: 'Out', category: 'Vendas' },
  { id: '3', description: 'Aluguel Escritório', amount: 800, type: 'expense', date: '2023-10-15', month: 'Out', category: 'Infra' },
  { id: '4', description: 'Consultoria Especializada', amount: 3000, type: 'income', date: '2023-09-20', month: 'Set', category: 'Serviços' },
  { id: '5', description: 'Marketing Digital', amount: 1200, type: 'expense', date: '2023-09-25', month: 'Set', category: 'Marketing' },
];

interface FinanceScreenProps {
  transactions: Transaction[];
  onUpdateTransactions: (t: Transaction[]) => void;
  fetchAllData: () => Promise<void>;
}

const FinanceScreen: React.FC<FinanceScreenProps> = ({ transactions, onUpdateTransactions, fetchAllData }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [selectedMonth, setSelectedMonth] = useState('Out');
  const [category, setCategory] = useState('Geral');
  const chartRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const income = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0);
    const expense = transactions.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const chartData = useMemo(() => {
    return months.map(m => {
      const monthTransactions = transactions.filter(t => t.month === m);
      const income = monthTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0);
      const expense = monthTransactions.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0);
      return { name: m, Lucro: income, Despesas: expense };
    }).filter(d => d.Lucro > 0 || d.Despesas > 0);
  }, [transactions]);

  const handleExportReport = async () => {
    try {
      const doc = new jsPDF();

      // Title
      doc.setFontSize(22);
      doc.setTextColor(33, 33, 33);
      doc.text(`Relatório Financeiro - ${selectedMonth}`, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}`, 14, 28);

      let yPos = 40;

      // Capture Chart
      if (chartRef.current) {
        // Temporarily change background to white for capture if dark mode (optional, but safer)
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: null, // Transparent or existing
          scale: 2 // Higher quality
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 180;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(imgData, 'PNG', 15, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 10;
      }

      // Summary
      const monthTransactions = transactions.filter(t => t.month === selectedMonth);
      const mIncome = monthTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0);
      const mExpense = monthTransactions.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0);
      const mBalance = mIncome - mExpense;

      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text(`Resumo do Mês (${selectedMonth})`, 14, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129); // Green
      doc.text(`Entradas: R$ ${mIncome.toLocaleString()}`, 14, yPos);

      doc.setTextColor(244, 63, 94); // Red
      doc.text(`Saídas: R$ ${mExpense.toLocaleString()}`, 70, yPos);

      doc.setTextColor(33, 33, 33); // Black
      doc.text(`Saldo: R$ ${mBalance.toLocaleString()}`, 130, yPos);
      yPos += 15;

      // Table
      autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
        body: monthTransactions.map(t => [
          new Date(t.date).toLocaleDateString(),
          t.description,
          t.category,
          t.type === 'income' ? 'Entrada' : 'Saída',
          `R$ ${t.amount.toLocaleString()}`
        ]),
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      doc.save(`relatorio_${selectedMonth}.pdf`);
    } catch (error) {
      console.error("Error generating PDF", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      description,
      amount: parseFloat(amount),
      type,
      date: new Date().toISOString().split('T')[0],
      month: selectedMonth,
      category
    };

    onUpdateTransactions([]); // Refresh via App.tsx
    await fetchAllData();
    setDescription('');
    setAmount('');
  };

  const removeTransaction = (id: string) => {
    onUpdateTransactions(transactions.filter(t => t.id !== id));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Financeiro</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestão de balancete e fluxo de caixa da sua operação.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm">
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <DollarSign className="w-4 h-4" /> Exportar Relatório PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet className="w-16 h-16 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">Saldo Geral</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">R$ {stats.balance.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">+R$ 1.200</span>
            <span className="text-[10px] text-slate-400 font-medium">este mês</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-500" /> Total Entradas
          </p>
          <h3 className="text-3xl font-black text-emerald-500 mt-2 tracking-tight">R$ {stats.income.toLocaleString()}</h3>
          <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[75%]"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-rose-500" /> Total Saídas
          </p>
          <h3 className="text-3xl font-black text-rose-500 mt-2 tracking-tight">R$ {stats.expense.toLocaleString()}</h3>
          <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 w-[25%]"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col gap-6 h-fit">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50 dark:border-slate-800">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Nova Transação</h2>
          </div>

          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${type === 'income' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'}`}
              >
                <TrendingUp className="w-4 h-4" /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${type === 'expense' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'}`}
              >
                <TrendingDown className="w-4 h-4" /> Saída
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Venda de serviço"
                className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white text-sm font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mês</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white text-sm"
                >
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white text-sm"
              >
                <option>Geral</option>
                <option>Vendas</option>
                <option>Software</option>
                <option>Marketing</option>
                <option>Infra</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all mt-4">
              Registrar Transação
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col" ref={chartRef}>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Lucro vs. Despesas</h2>
                <p className="text-xs text-slate-500 font-medium">Comparativo mensal acumulado</p>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '16px',
                    color: '#fff'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Lucro" fill="#10b981" radius={[10, 10, 0, 0]} barSize={32} />
                <Bar dataKey="Despesas" fill="#f43f5e" radius={[10, 10, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Últimas Movimentações</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Filtrar..." className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-emerald-500 outline-none w-48" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{t.description}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md uppercase">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold text-xs ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.type === 'income' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-sm">
                    R$ {t.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => removeTransaction(t.id)} className="p-2 text-slate-300 hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceScreen;
