import React, { useState, useEffect } from 'react';
import { ExpenseItem } from '../types';
import { Plus, Trash2, Save, Download, Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const ExpenseStructureScreen: React.FC = () => {
    const [items, setItems] = useState<ExpenseItem[]>(() => {
        const saved = localStorage.getItem('schumacher_expense_structure');
        return saved ? JSON.parse(saved) : [
            { id: '1', description: 'Receita Mensal', type: 'income', value: 0 },
            { id: '2', description: 'Aluguel', type: 'expense', value: 0 },
            { id: '3', description: 'Internet', type: 'expense', value: 0 },
        ];
    });

    useEffect(() => {
        localStorage.setItem('schumacher_expense_structure', JSON.stringify(items));
    }, [items]);

    const addItem = () => {
        const newItem: ExpenseItem = {
            id: Math.random().toString(36).substr(2, 9),
            description: 'Novo Item',
            type: 'expense',
            value: 0
        };
        setItems([...items, newItem]);
    };

    const updateItem = (id: string, field: keyof ExpenseItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const deleteItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const totalIncome = items.filter(i => i.type === 'income').reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const totalExpense = items.filter(i => i.type === 'expense').reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const balance = totalIncome - totalExpense;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Estrutura de Gastos</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Planeje e simule seus custos e receitas mensais.</p>
                </div>
                <button
                    onClick={addItem}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Adicionar Linha
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Cards */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Receitas</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-100 dark:bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400">
                            <TrendingDown className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Despesas</p>
                            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm flex items-center gap-4 ${balance >= 0 ? 'border-emerald-200 dark:border-emerald-900/50 shadow-emerald-500/10' : 'border-rose-200 dark:border-rose-900/50 shadow-rose-500/10'}`}>
                        <div className={`p-3 rounded-xl ${balance >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                            <DollarSign className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Saldo Previsto</p>
                            <p className={`text-2xl font-black ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Spreadsheet */}
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest w-16">#</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Descrição do Item</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest w-48">Tipo</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest w-48">Valor (R$)</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest w-24 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {items.map((item, index) => (
                                    <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-3 font-mono text-xs text-slate-400">
                                            {(index + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="px-6 py-3">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 dark:text-slate-200 placeholder-slate-400"
                                                placeholder="Nome do item..."
                                            />
                                        </td>
                                        <td className="px-6 py-3">
                                            <select
                                                value={item.type}
                                                onChange={(e) => updateItem(item.id, 'type', e.target.value)}
                                                className={`w-full text-xs font-bold uppercase py-1.5 px-3 rounded-lg border-none focus:ring-0 cursor-pointer transition-colors ${item.type === 'income'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                                    }`}
                                            >
                                                <option value="income">Receita (+)</option>
                                                <option value="expense">Despesa (-)</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                                                <input
                                                    type="number"
                                                    value={item.value}
                                                    onChange={(e) => updateItem(item.id, 'value', parseFloat(e.target.value))}
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-8 pr-4 text-sm font-mono font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <button
                                                onClick={() => deleteItem(item.id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Excluir linha"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            Nenhum item adicionado. Clique em "Adicionar Linha" para começar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="flex justify-end text-xs text-slate-400 font-medium">
                * As alterações são salvas automaticamente.
            </div>
        </div>
    );
};

export default ExpenseStructureScreen;
