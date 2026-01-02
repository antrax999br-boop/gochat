import React, { useState, useEffect, useMemo } from 'react';
import { Client, Transaction } from '../types';
import {
    Users,
    Search,
    Plus,
    Building2,
    MapPin,
    Phone,
    Mail,
    Trash2,
    Edit,
    User as UserIcon,
    X,
    CreditCard,
    TrendingUp,
    TrendingDown,
    DollarSign
} from 'lucide-react';

interface ClientsScreenProps {
    clients: Client[];
    setClients: (clients: Client[]) => void;
    transactions: Transaction[];
    onUpdateTransactions: (t: Transaction[]) => void;
}

const ClientsScreen: React.FC<ClientsScreenProps> = ({ clients, setClients, transactions, onUpdateTransactions }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showClientModal, setShowClientModal] = useState(false);
    const [showFinanceModal, setShowFinanceModal] = useState(false);

    // Form State for Client
    const [clientForm, setClientForm] = useState<Partial<Client>>({});
    const [editingClientId, setEditingClientId] = useState<string | null>(null);

    // Context for Finance
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [transactionDescription, setTransactionDescription] = useState('');
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');



    // --- Client Management ---
    const handleSaveClient = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientForm.companyName || !clientForm.cnpj) {
            alert('Nome da empresa e CNPJ são obrigatórios!');
            return;
        }

        if (editingClientId) {
            setClients(clients.map(c => c.id === editingClientId ? { ...c, ...clientForm } as Client : c));
        } else {
            const newClient: Client = {
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                companyName: clientForm.companyName!,
                cnpj: clientForm.cnpj!,
                contactName: clientForm.contactName || '',
                contactPhone: clientForm.contactPhone || '',
                address: clientForm.address || '',
                email: clientForm.email || ''
            };
            setClients([newClient, ...clients]);
        }
        closeClientModal();
    };

    const handleDeleteClient = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            setClients(clients.filter(c => c.id !== id));
            // Optional: prevent deleting transactions or delete them too? Keeping them safe for now.
        }
    };

    const openEditClient = (client: Client) => {
        setClientForm(client);
        setEditingClientId(client.id);
        setShowClientModal(true);
    };

    const closeClientModal = () => {
        setShowClientModal(false);
        setClientForm({});
        setEditingClientId(null);
    };

    // --- Finance Management ---
    const openFinance = (client: Client) => {
        setSelectedClient(client);
        setShowFinanceModal(true);
        setTransactionDescription('');
        setTransactionAmount('');
        setTransactionType('income');
    };

    const closeFinanceModal = () => {
        setShowFinanceModal(false);
        setSelectedClient(null);
    };

    const handleAddTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !transactionDescription || !transactionAmount) return;

        const date = new Date();
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        const newTransaction: Transaction = {
            id: Date.now().toString(),
            description: transactionDescription,
            amount: parseFloat(transactionAmount),
            type: transactionType,
            date: date.toISOString().split('T')[0],
            month: monthNames[date.getMonth()],
            category: 'Serviços ao Cliente',
            clientId: selectedClient.id
        };

        onUpdateTransactions([newTransaction, ...transactions]);
        setTransactionDescription('');
        setTransactionAmount('');
    };

    const handleDeleteTransaction = (id: string) => {
        if (window.confirm('Excluir esta transação?')) {
            onUpdateTransactions(transactions.filter(t => t.id !== id));
        }
    };

    const filteredClients = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return clients.filter(c =>
            c.companyName.toLowerCase().includes(lowerSearch) ||
            c.cnpj.includes(lowerSearch) ||
            c.contactName.toLowerCase().includes(lowerSearch)
        );
    }, [clients, searchTerm]);

    const clientTransactions = useMemo(() => {
        if (!selectedClient) return [];
        return transactions.filter(t => t.clientId === selectedClient.id);
    }, [transactions, selectedClient]);

    const clientStats = useMemo(() => {
        const income = clientTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0);
        const expense = clientTransactions.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0);
        return { income, expense, balance: income - expense };
    }, [clientTransactions]);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Gestão de Clientes</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie sua base de clientes e financeiro individual.</p>
                </div>
                <button
                    onClick={() => setShowClientModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Novo Cliente
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por empresa, CNPJ ou contato..."
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white shadow-sm"
                />
            </div>

            {/* Grid of Clients */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map(client => (
                    <div key={client.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-emerald-500/50 transition-all group relative flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl">
                                <Building2 className="w-8 h-8 text-slate-700 dark:text-slate-300" />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditClient(client)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteClient(client.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-1">{client.companyName}</h3>
                        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-4 bg-slate-100 dark:bg-slate-800 w-fit px-2 py-1 rounded">{client.cnpj}</p>

                        <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800 flex-1">
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                <UserIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="truncate">{client.contactName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="truncate">{client.contactPhone}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => openFinance(client)}
                            className="w-full mt-6 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <CreditCard className="w-4 h-4" /> Financeiro do Cliente
                        </button>
                    </div>
                ))}
            </div>

            {/* Client Form Modal */}
            {showClientModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-slate-200 dark:border-slate-800 transform scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {editingClientId ? 'Editar Cliente' : 'Novo Cliente'}
                            </h2>
                            <button onClick={closeClientModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveClient} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome da Empresa *</label>
                                    <input
                                        required
                                        type="text"
                                        value={clientForm.companyName || ''}
                                        onChange={e => setClientForm({ ...clientForm, companyName: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="Razão Social ou Fantasia"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">CNPJ *</label>
                                    <input
                                        required
                                        type="text"
                                        value={clientForm.cnpj || ''}
                                        onChange={e => setClientForm({ ...clientForm, cnpj: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-mono"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Contato</label>
                                    <input
                                        type="text"
                                        value={clientForm.contactName || ''}
                                        onChange={e => setClientForm({ ...clientForm, contactName: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="Nome do responsável"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Telefone / WhatsApp</label>
                                    <input
                                        type="text"
                                        value={clientForm.contactPhone || ''}
                                        onChange={e => setClientForm({ ...clientForm, contactPhone: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
                                    <input
                                        type="email"
                                        value={clientForm.email || ''}
                                        onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="email@empresa.com"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Endereço Completo</label>
                                    <textarea
                                        value={clientForm.address || ''}
                                        onChange={e => setClientForm({ ...clientForm, address: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white h-24 resize-none"
                                        placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                                    />
                                </div>
                            </div>
                            <div className="pt-6 flex gap-3">
                                <button type="button" onClick={closeClientModal} className="flex-1 py-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all">{editingClientId ? 'Salvar Alterações' : 'Cadastrar Cliente'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Finance Modal */}
            {showFinanceModal && selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl p-8 border border-slate-200 dark:border-slate-800 transform scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Financeiro: {selectedClient.companyName}</h2>
                                <p className="text-sm text-slate-500">Histórico de serviços e pagamentos.</p>
                            </div>
                            <button onClick={closeFinanceModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-emerald-200 dark:bg-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-400"><TrendingUp className="w-4 h-4" /></div>
                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Recebido (Serviços)</span>
                                </div>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">R$ {clientStats.income.toLocaleString()}</p>
                            </div>
                            <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-rose-200 dark:bg-rose-500/20 rounded-lg text-rose-700 dark:text-rose-400"><TrendingDown className="w-4 h-4" /></div>
                                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">Despesas</span>
                                </div>
                                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">R$ {clientStats.expense.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300"><DollarSign className="w-4 h-4" /></div>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Saldo Cliente</span>
                                </div>
                                <p className={`text-2xl font-black ${clientStats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>R$ {clientStats.balance.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Add Transaction Form */}
                        <form onSubmit={handleAddTransaction} className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 mb-8">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Novo Lançamento
                            </h3>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={transactionDescription}
                                        onChange={(e) => setTransactionDescription(e.target.value)}
                                        placeholder="Descrição (ex: Desenvolvimento Site)"
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:text-white"
                                    />
                                </div>
                                <div className="w-32">
                                    <input
                                        type="number"
                                        value={transactionAmount}
                                        onChange={(e) => setTransactionAmount(e.target.value)}
                                        placeholder="Valor R$"
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold dark:text-white"
                                    />
                                </div>
                                <div className="w-40 flex bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('income')}
                                        className={`flex-1 flex items-center justify-center text-xs font-bold transition-colors ${transactionType === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-emerald-500'}`}
                                    >+ Rec</button>
                                    <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                                    <button
                                        type="button"
                                        onClick={() => setTransactionType('expense')}
                                        className={`flex-1 flex items-center justify-center text-xs font-bold transition-colors ${transactionType === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-rose-500'}`}
                                    >- Desp</button>
                                </div>
                                <button type="submit" className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-sm shadow-lg hover:opacity-90 transition-opacity">
                                    Adicionar
                                </button>
                            </div>
                        </form>

                        {/* Transaction List */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {clientTransactions.length > 0 ? (
                                clientTransactions.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-slate-200 dark:hover:border-slate-700 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{t.description}</p>
                                                <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()} - {t.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-mono font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {t.type === 'income' ? '+ ' : '- '}R$ {t.amount.toLocaleString()}
                                            </span>
                                            <button onClick={() => handleDeleteTransaction(t.id)} className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm">Nenhuma transação registrada para este cliente.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientsScreen;
