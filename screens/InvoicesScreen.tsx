import React, { useState, useMemo } from 'react';
import { Invoice, Client, Page } from '../types';
import {
    Plus,
    Search,
    Receipt,
    FileWarning,
    History,
    FileText,
    ChevronRight,
    Filter,
    ArrowDown,
    ArrowUp,
    CheckCircle2,
    Clock,
    Trash2,
    Edit,
    FileDown,
    Calendar,
    X,
    MoreVertical
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';

interface InvoicesScreenProps {
    invoices: Invoice[];
    clients: Client[];
    activePage: Page;
    fetchAllData: () => Promise<void>;
}

const InvoicesScreen: React.FC<InvoicesScreenProps> = ({ invoices, clients, activePage, fetchAllData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Invoice>>({
        type: activePage === Page.BOLETOS_SEM_NOTA ? 'sem_nota' : 'inicial',
        status: 'pending',
        dueDate: new Date().toISOString().split('T')[0]
    });
    const [isSaving, setIsSaving] = useState(false);

    // List of months for filter
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    // Filtered Invoices
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchesSearch =
                inv.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());

            // For sidebar items, we filter by type
            const matchesPage =
                activePage === Page.BOLETOS_ATIVOS ? (inv.type === 'inicial' || inv.type === 'internet') :
                    activePage === Page.BOLETOS_SEM_NOTA ? (inv.type === 'sem_nota') :
                        true;

            const invDate = new Date(inv.dueDate);
            const matchesMonth = invDate.getMonth() + 1 === selectedMonth;
            const matchesYear = invDate.getFullYear() === selectedYear;

            return matchesSearch && matchesPage && matchesMonth && matchesYear;
        });
    }, [invoices, searchTerm, activePage, selectedMonth, selectedYear]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientId || !form.originalValue || !form.dueDate) {
            alert('Preencha os campos obrigatórios!');
            return;
        }

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const client = clients.find(c => c.id === form.clientId);

            const dataToSave = {
                type: form.type,
                client_id: form.clientId,
                invoice_number: form.invoiceNumber || '',
                original_value: Number(form.originalValue),
                final_value: Number(form.finalValue || form.originalValue),
                due_date: form.dueDate,
                status: form.status,
                month: `${String(selectedMonth).padStart(2, '0')}/${selectedYear}`,
                user_id: user?.id
            };

            if (editingId) {
                const { error } = await supabase.from('invoices').update(dataToSave).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('invoices').insert(dataToSave);
                if (error) throw error;
            }

            setShowModal(false);
            setEditingId(null);
            setForm({});
            fetchAllData();
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert('Erro ao salvar. Verifique se a tabela "invoices" existe.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleInvoiceStatus = async (invoice: Invoice) => {
        try {
            const newStatus = invoice.status === 'paid' ? 'pending' : 'paid';
            const { error } = await supabase
                .from('invoices')
                .update({ status: newStatus })
                .eq('id', invoice.id);

            if (error) throw error;
            fetchAllData();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Erro ao atualizar status.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Excluir este registro permanentemente?')) return;
        try {
            const { error } = await supabase.from('invoices').delete().eq('id', id);
            if (error) throw error;
            fetchAllData();
        } catch (error) {
            console.error('Error deleting invoice:', error);
            alert('Erro ao excluir.');
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('Relatório de Boletos e Registros', 14, 25);
        doc.setFontSize(10);
        doc.text(`${months[selectedMonth - 1]} / ${selectedYear}`, 14, 33);

        const tableData = filteredInvoices.map(inv => [
            inv.clientName || 'N/A',
            `R$ ${inv.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            new Date(inv.dueDate).toLocaleDateString('pt-BR'),
            inv.type === 'inicial' ? '✓' : '',
            inv.type === 'sem_nota' ? '✓' : '',
            inv.type === 'internet' ? '✓' : '',
            inv.type === 'aguardando_nota' ? '✓' : '',
            `R$ ${inv.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            inv.status === 'paid' ? 'PAGO' : 'ABERTO'
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['CLIENTE', 'VALOR ORIG.', 'VENCIMENTO', 'ATIVO', 'S/ NOTA', 'INTERNET', 'AGUARD. NOTA', 'VALOR FINAL', 'STATUS']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129] }
        });

        doc.save(`Boletos_${months[selectedMonth - 1]}_${selectedYear}.pdf`);
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Breadcrumbs & Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-widest">
                        <span>Financeiro</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-emerald-500">Boletos</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Boletos e Registros
                    </h1>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportToPDF}
                        disabled={filteredInvoices.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <FileDown className="w-5 h-5 text-emerald-500" />
                        Emitir Relatório PDF
                    </button>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setForm({
                                type: activePage === Page.BOLETOS_SEM_NOTA ? 'sem_nota' : 'inicial',
                                status: 'pending',
                                dueDate: new Date().toISOString().split('T')[0]
                            });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Novo Boleto
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por cliente ou ID do boleto..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent focus:border-emerald-500/50 rounded-2xl outline-none transition-all dark:text-white"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="flex-1 md:flex-none px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent rounded-2xl outline-none dark:text-white"
                    >
                        {months.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="flex-1 md:flex-none px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-transparent rounded-2xl outline-none dark:text-white"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <span>{activePage === Page.BOLETOS_SEM_NOTA ? '📄 Sem Nota' : '🔥 Boletos Iniciais'}</span>
                    </div>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Mostrando {filteredInvoices.length} registros
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="text-left p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
                                <th className="text-left p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor Original</th>
                                <th className="text-left p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vencimento</th>
                                <th className="text-center p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Boletos Ativos</th>
                                <th className="text-center p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Boletos S/ Nota</th>
                                <th className="text-center p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Boleto Internet</th>
                                <th className="text-center p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Aguardando Nota</th>
                                <th className="text-right p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor Final</th>
                                <th className="text-center p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full">
                                                <History className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-slate-900 dark:text-white font-bold">Nenhum boleto encontrado</p>
                                                <p className="text-slate-500 text-sm">Tente ajustar seus filtros ou cadastrar um novo boleto.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map(inv => (
                                    <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                                                    {(inv.clientName || '?')[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white uppercase text-sm leading-tight">{inv.clientName}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">#{inv.invoiceNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6 font-bold text-slate-700 dark:text-slate-300 text-sm">
                                            R$ {inv.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <Calendar className="w-4 h-4 text-emerald-500" />
                                                {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                                            </div>
                                        </td>
                                        <td className="p-6 text-center">
                                            {(inv.type === 'inicial') && (
                                                <div className="inline-flex px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black">
                                                    R$ {inv.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6 text-center">
                                            {inv.type === 'sem_nota' && (
                                                <div className="inline-flex px-3 py-1 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-black">
                                                    R$ {inv.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6 text-center">
                                            {inv.type === 'internet' && (
                                                <div className="inline-flex px-3 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black">
                                                    R$ {inv.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6 text-center">
                                            {inv.type === 'aguardando_nota' && (
                                                <div className="inline-flex px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-black">
                                                    R$ {inv.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className={`text-sm font-black ${inv.status === 'paid' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                                R$ {inv.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                            <button
                                                onClick={() => toggleInvoiceStatus(inv)}
                                                className="flex items-center justify-end gap-1 mt-1 hover:opacity-70 transition-opacity ml-auto"
                                            >
                                                {inv.status === 'paid' ? (
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                ) : (
                                                    <Clock className="w-3 h-3 text-amber-500" />
                                                )}
                                                <span className={`text-[8px] font-black uppercase tracking-tighter ${inv.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {inv.status === 'paid' ? 'Liquidado' : 'Em Aberto'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => toggleInvoiceStatus(inv)}
                                                    title={inv.status === 'paid' ? "Marcar como Em Aberto" : "Marcar como Pago"}
                                                    className={`p-2 border rounded-xl transition-all shadow-sm ${inv.status === 'paid'
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-500'}`}
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(inv.id);
                                                        setForm(inv);
                                                        setShowModal(true);
                                                    }}
                                                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-blue-500 transition-colors shadow-sm"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(inv.id)}
                                                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-red-500 transition-colors shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Novo Registro */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    {editingId ? 'Editar Registro' : 'Novo Registro de Boleto'}
                                </h2>
                                <p className="text-xs text-slate-500 font-medium">Preencha as informações para o financeiro</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            {/* Tipo de Registro */}
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Tipo de Registro</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'inicial', label: 'Boleto Inicial' },
                                        { id: 'internet', label: 'Internet' },
                                        { id: 'sem_nota', label: 'Sem Nota' },
                                        { id: 'aguardando_nota', label: 'Aguardando Nota' }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setForm({ ...form, type: type.id as any })}
                                            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${form.type === type.id
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Cliente</label>
                                    <select
                                        value={form.clientId || ''}
                                        onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-white"
                                        required
                                    >
                                        <option value="">Selecione um cliente...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.companyName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Número do Boleto</label>
                                    <input
                                        type="text"
                                        value={form.invoiceNumber || ''}
                                        onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                                        placeholder="Ex: NF-2024-001"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Valor Original (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={form.originalValue || ''}
                                            onChange={(e) => setForm({ ...form, originalValue: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Vencimento</label>
                                        <input
                                            type="date"
                                            value={form.dueDate || ''}
                                            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Status</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, status: 'pending' })}
                                            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${form.status === 'pending'
                                                ? 'bg-amber-100 border-amber-200 text-amber-700'
                                                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'}`}
                                        >
                                            EM ABERTO
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, status: 'paid' })}
                                            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${form.status === 'paid'
                                                ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                                : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'}`}
                                        >
                                            PAGO
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-bold transition-all hover:bg-slate-200 active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Registro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoicesScreen;
