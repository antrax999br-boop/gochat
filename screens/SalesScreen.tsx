import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useState, useMemo } from 'react';
import { Client, Quote, Service, QuoteItem } from '../types';
import { supabase } from '../lib/supabase';
import {
    ShoppingCart,
    Plus,
    Search,
    Trash2,
    FileText,
    Tag,
    Percent,
    ChevronRight,
    Save,
    X,
    CreditCard,
    Building2,
    CheckCircle2,
    Clock,
    Calendar,
    User,
    Check,
    Pencil,
    Minus
} from 'lucide-react';

interface SalesScreenProps {
    clients: Client[];
    quotes: Quote[];
    services: Service[];
    onUpdateQuotes: (quotes: Quote[]) => void;
    onApproveQuote: (quote: Quote) => void;
    onUpdateServices: (services: Service[]) => void;
}

const SalesScreen: React.FC<SalesScreenProps> = ({ clients, quotes, services, onUpdateQuotes, onApproveQuote, onUpdateServices }) => {

    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [currentQuoteItems, setCurrentQuoteItems] = useState<QuoteItem[]>([]);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // New Service Form State
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [newServiceName, setNewServiceName] = useState('');
    const [newServicePrice, setNewServicePrice] = useState('');

    const handleAddServiceToQuote = (service: Service) => {
        const existing = currentQuoteItems.find(item => item.serviceId === service.id);
        if (existing) {
            setCurrentQuoteItems(currentQuoteItems.map(item =>
                item.serviceId === service.id
                    ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
                    : item
            ));
        } else {
            const newItem: QuoteItem = {
                serviceId: service.id,
                serviceName: service.name,
                quantity: 1,
                unitPrice: service.price,
                total: service.price
            };
            setCurrentQuoteItems([...currentQuoteItems, newItem]);
        }
    };

    const removeItemFromQuote = (index: number) => {
        setCurrentQuoteItems(currentQuoteItems.filter((_, i) => i !== index));
    };

    const updateItemQuantity = (index: number, delta: number) => {
        setCurrentQuoteItems(currentQuoteItems.map((item, i) => {
            if (i === index) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty, total: newQty * item.unitPrice };
            }
            return item;
        }));
    };

    const updateItemPrice = (index: number, newPrice: number) => {
        setCurrentQuoteItems(currentQuoteItems.map((item, i) => {
            if (i === index) {
                return { ...item, unitPrice: newPrice, total: item.quantity * newPrice };
            }
            return item;
        }));
    };

    const subtotal = useMemo(() => {
        return currentQuoteItems.reduce((acc, item) => acc + item.total, 0);
    }, [currentQuoteItems]);

    const discountAmount = useMemo(() => {
        return (subtotal * discountPercent) / 100;
    }, [subtotal, discountPercent]);

    const total = useMemo(() => {
        return subtotal - discountAmount;
    }, [subtotal, discountAmount]);

    const handleCreateService = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newServiceName || !newServicePrice) return;

        if (editingService) {
            onUpdateServices(services.map(s => s.id === editingService.id ? {
                ...s,
                name: newServiceName,
                price: parseFloat(newServicePrice)
            } : s));
            setEditingService(null);
        } else {
            const ns: Service = {
                id: Date.now().toString(),
                name: newServiceName,
                price: parseFloat(newServicePrice)
            };
            onUpdateServices([...services, ns]);
            handleAddServiceToQuote(ns);
        }

        setNewServiceName('');
        setNewServicePrice('');
        setShowServiceForm(false);
    };

    const startEditingService = (service: Service, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingService(service);
        setNewServiceName(service.name);
        setNewServicePrice(service.price.toString());
        setShowServiceForm(true);
    };

    const handleDeleteService = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Excluir este serviço do catálogo?')) {
            onUpdateServices(services.filter(s => s.id !== id));
        }
    };

    const handleSaveQuote = async () => {
        if (!selectedClientId || currentQuoteItems.length === 0) {
            alert('Selecione um cliente e adicione pelo menos um serviço.');
            return;
        }

        const client = clients.find(c => c.id === selectedClientId);
        if (!client) return;

        try {
            const quoteData = {
                client_id: selectedClientId,
                subtotal,
                discount_percentage: discountPercent,
                discount_amount: discountAmount,
                total,
                status: editingQuoteId ? quotes.find(q => q.id === editingQuoteId)?.status || 'draft' : 'draft',
                date: editingQuoteId ? quotes.find(q => q.id === editingQuoteId)?.date || new Date().toISOString() : new Date().toISOString()
            };

            let quoteId = editingQuoteId;

            if (editingQuoteId) {
                await supabase.from('quotes').update(quoteData).eq('id', editingQuoteId);
                // Delete old items to replace them
                await supabase.from('quote_items').delete().eq('quote_id', editingQuoteId);
            } else {
                const { data, error } = await supabase.from('quotes').insert(quoteData).select().single();
                if (error) throw error;
                quoteId = data.id;
            }

            // Insert Items
            if (quoteId) {
                const itemsToInsert = currentQuoteItems.map(item => ({
                    quote_id: quoteId,
                    service_id: item.serviceId.length > 10 ? item.serviceId : null, // Only UUIDs
                    service_name: item.serviceName,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    total: item.total
                }));
                await supabase.from('quote_items').insert(itemsToInsert);
            }

            onUpdateQuotes([]); // Trigger refresh in App.tsx
            setShowQuoteModal(false);
            resetForm();
        } catch (error) {
            console.error('Error saving quote:', error);
            alert('Erro ao salvar orçamento. Verifique sua conexão.');
        }
    };

    const handleEditQuote = (quote: Quote) => {
        setEditingQuoteId(quote.id);
        setSelectedClientId(quote.clientId);
        setCurrentQuoteItems(quote.items);
        setDiscountPercent(quote.discountPercentage);
        setSelectedQuote(null);
        setShowQuoteModal(true);
    };

    const handleDeleteQuote = (id: string) => {
        if (window.confirm('Excluir este orçamento permanentemente?')) {
            onUpdateQuotes(quotes.filter(q => q.id !== id));
            setSelectedQuote(null);
        }
    };

    const generateQuotePDF = (quote: Quote) => {
        const client = clients.find(c => c.id === quote.clientId);
        const doc = new jsPDF();

        // Header
        doc.setFillColor(16, 185, 129); // Schumacher Emerald
        doc.rect(0, 0, 210, 40, 'F');

        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('SCHUMACHER TECNOLOGIA', 14, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('SOLICITAÇÃO DE LIBERAÇÃO DE SERVIÇO', 14, 33);
        doc.text(`Orçamento #${quote.id.slice(-6).toUpperCase()}`, 150, 25);
        doc.text(`Data: ${new Date(quote.date).toLocaleDateString()}`, 150, 31);

        // Body section 1: Client Data
        doc.setTextColor(33, 33, 33);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('DADOS DO CLIENTE', 14, 55);

        doc.setLineWidth(0.5);
        doc.setDrawColor(16, 185, 129);
        doc.line(14, 58, 65, 58);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Razão Social: ${client?.companyName || quote.clientName || 'N/A'}`, 14, 68);
        doc.text(`CNPJ: ${client?.cnpj || 'N/A'}`, 14, 76);
        doc.text(`Endereço: ${client?.address || 'N/A'}`, 14, 84);
        doc.text(`Contato: ${client?.contactName || 'N/A'}`, 14, 92);

        // Body section 2: Items
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALHAMENTO DO PEDIDO', 14, 110);
        doc.line(14, 113, 80, 113);

        autoTable(doc, {
            startY: 120,
            head: [['Produto/Serviço', 'Qtd', 'Vl. Unitário', 'Vl. Total']],
            body: quote.items.map(item => [
                item.serviceName,
                item.quantity,
                `R$ ${item.unitPrice.toLocaleString()}`,
                `R$ ${item.total.toLocaleString()}`
            ]),
            headStyles: { fillColor: [16, 185, 129], halign: 'center', textColor: [255, 255, 255] },
            bodyStyles: { textColor: [0, 0, 0] },
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: {
                0: { cellWidth: 80 },
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' }
            },
            alternateRowStyles: { fillColor: [245, 255, 250] },
            foot: [[
                { content: 'VALOR TOTAL DO PEDIDO:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] } },
                { content: `R$ ${quote.total.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [0, 0, 0] } }
            ]],
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 40;

        // Signature Area
        doc.line(20, finalY, 90, finalY);
        doc.line(120, finalY, 190, finalY);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('RESPONSÁVEL PELA LIBERAÇÃO', 25, finalY + 5);
        doc.text('ASSINATURA DO CLIENTE', 135, finalY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('(Assinatura e Carimbo)', 40, finalY + 10);

        // Footer message
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Este documento formaliza a liberação do serviço e autoriza o faturamento conforme condições comerciais acertadas.', 105, 285, { align: 'center' });

        doc.save(`Pedido_${client?.companyName || 'Cliente'}_${quote.id.slice(-4)}.pdf`);
    };

    const handleApprove = async (quote: Quote) => {
        if (window.confirm(`Confirmar aprovação do orçamento para ${quote.clientName}? Isso gerará o PDF de liberação e registrará a entrada no financeiro.`)) {
            try {
                // 1. Approve in DB-level
                await onApproveQuote(quote);

                // 2. Generate PDF
                generateQuotePDF(quote);

                setSelectedQuote(null);
                alert('Venda aprovada e PDF de liberação gerado!');
            } catch (error) {
                console.error('Failure in approval flow:', error);
                alert('Erro ao aprovar venda.');
            }
        }
    };

    const resetForm = () => {
        setSelectedClientId('');
        setCurrentQuoteItems([]);
        setDiscountPercent(0);
        setEditingQuoteId(null);
    };

    const filteredQuotes = useMemo(() => {
        return quotes.filter(q => q.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [quotes, searchTerm]);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Gestão de Vendas</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gere orçamentos e acompanhe suas propostas comerciais.</p>
                </div>
                <button
                    onClick={() => setShowQuoteModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Novo Orçamento
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar orçamentos por cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuotes.map((quote) => (
                    <div
                        key={quote.id}
                        onClick={() => setSelectedQuote(quote)}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${quote.status === 'approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'}`}>
                                <FileText className="w-6 h-6" />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${quote.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {quote.status === 'approved' ? 'Aprovado' : 'Aguardando'}
                            </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 truncate">{quote.clientName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{new Date(quote.date).toLocaleDateString()}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xl font-black text-slate-900 dark:text-white">R$ {quote.total.toLocaleString()}</span>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        </div>
                    </div>
                ))}

                {filteredQuotes.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <div className="inline-flex p-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
                            <ShoppingCart className="w-12 h-12" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nenhum orçamento encontrado</h3>
                        <p className="text-slate-500">Crie um novo orçamento para começar.</p>
                    </div>
                )}
            </div>

            {/* Quote Creation/Edit Modal */}
            {showQuoteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                {editingQuoteId ? 'Editar Orçamento' : 'Novo Orçamento'}
                            </h2>
                            <button onClick={() => { setShowQuoteModal(false); resetForm(); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Client Selection */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                    <Building2 className="w-4 h-4 text-emerald-500" /> Selecionar Cliente
                                </label>
                                <select
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                                >
                                    <option value="">Selecione um cliente...</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.companyName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Service Selection / Catalog */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                            <Tag className="w-4 h-4 text-emerald-500" /> Catálogo de Serviços
                                        </label>
                                        <button
                                            onClick={() => setShowServiceForm(true)}
                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Criar Novo
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {services.map(service => (
                                            <div
                                                key={service.id}
                                                className="group flex items-center justify-between p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-emerald-500/50 transition-all cursor-pointer"
                                            >
                                                <div className="flex-1" onClick={() => handleAddServiceToQuote(service)}>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">{service.name}</p>
                                                    <p className="text-xs text-emerald-600 font-bold">R$ {service.price.toLocaleString()}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => startEditingService(service, e)}
                                                        className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 rounded-lg transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteService(service.id, e)}
                                                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Selected Items */}
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                        <ShoppingCart className="w-4 h-4 text-emerald-500" /> Itens do Orçamento
                                    </label>
                                    <div className="space-y-3">
                                        {currentQuoteItems.map((item, index) => (
                                            <div key={index} className="flex flex-col p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-slate-900 dark:text-white text-sm flex-1">{item.serviceName}</span>
                                                    <button onClick={() => removeItemFromQuote(index)} className="text-rose-500 hover:text-rose-700 p-1">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-1">
                                                        <button onClick={() => updateItemQuantity(index, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                                            <Minus className="w-3 h-3 text-slate-500" />
                                                        </button>
                                                        <span className="px-3 font-bold text-sm min-w-[30px] text-center dark:text-white">{item.quantity}</span>
                                                        <button onClick={() => updateItemQuantity(index, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                                            <Plus className="w-3 h-3 text-slate-500" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-400 font-bold">R$</span>
                                                        <input
                                                            type="number"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateItemPrice(index, parseFloat(e.target.value) || 0)}
                                                            className="w-20 text-right bg-transparent border-b border-emerald-200 dark:border-emerald-500/30 focus:border-emerald-500 outline-none font-bold text-emerald-600 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {currentQuoteItems.length === 0 && (
                                            <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400">
                                                Nenhum item adicionado
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Totals and Discounts */}
                            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex flex-col md:flex-row justify-between gap-8">
                                    <div className="flex-1 space-y-4">
                                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                            <Percent className="w-4 h-4 text-emerald-500" /> Desconto Especial (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={discountPercent}
                                            onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                            className="w-full md:w-32 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                                        />
                                    </div>
                                    <div className="w-full md:w-80 space-y-3 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Subtotal:</span>
                                            <span className="font-bold text-slate-900 dark:text-white">R$ {subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-rose-500">
                                            <span>Desconto:</span>
                                            <span className="font-bold">- R$ {discountAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-2xl pt-3 border-t border-slate-200 dark:border-slate-800">
                                            <span className="font-black text-slate-900 dark:text-white italic">Total:</span>
                                            <span className="font-black text-emerald-600">R$ {total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => { setShowQuoteModal(false); resetForm(); }}
                                className="px-6 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveQuote}
                                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 shadow-lg transition-all"
                            >
                                <Save className="w-5 h-5" /> {editingQuoteId ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quote Detail View Modal */}
            {selectedQuote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="relative h-32 bg-emerald-500 p-8">
                            <button onClick={() => setSelectedQuote(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-all">
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-black text-white tracking-tight">Detalhes do Orçamento</h2>
                            <p className="text-emerald-100 opacity-80 text-sm">#{selectedQuote.id.slice(-6).toUpperCase()}</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                    <Building2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cliente</p>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase">{selectedQuote.clientName}</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-emerald-500" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Data</p>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{new Date(selectedQuote.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-emerald-500" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm capitalize">{selectedQuote.status === 'approved' ? 'Aprovado' : 'Rascunho'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Itens da Proposta</h4>
                                <div className="space-y-2">
                                    {selectedQuote.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-bold text-xs italic">
                                                    {item.quantity}x
                                                </div>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{item.serviceName}</span>
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white">R$ {item.total.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                                <div>
                                    <p className="text-sm font-bold text-slate-400 uppercase">Valor Final</p>
                                    <p className="text-3xl font-black text-emerald-600 italic">R$ {selectedQuote.total.toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditQuote(selectedQuote)}
                                        className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-emerald-50 transition-all"
                                        title="Editar Itens"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteQuote(selectedQuote.id)}
                                        className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
                                        title="Excluir Orçamento"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                            {selectedQuote.status === 'approved' ? (
                                <button
                                    onClick={() => generateQuotePDF(selectedQuote)}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-xl transition-all hover:scale-[1.02]"
                                >
                                    <FileText className="w-5 h-5" /> Baixar Pedido (PDF)
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleApprove(selectedQuote)}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02]"
                                >
                                    <CheckCircle2 className="w-5 h-5" /> Aprovar e Gerar Pedido
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* New/Edit Service Floating Modal */}
            {showServiceForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
                        <h3 className="text-xl font-black mb-6 dark:text-white">
                            {editingService ? 'Editar Serviço' : 'Novo Serviço no Catálogo'}
                        </h3>
                        <form onSubmit={handleCreateService} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Nome do Serviço</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newServiceName}
                                    onChange={(e) => setNewServiceName(e.target.value)}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                                    placeholder="Ex: Consultoria Mensal"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Preço Base (R$)</label>
                                <input
                                    type="number"
                                    value={newServicePrice}
                                    onChange={(e) => setNewServicePrice(e.target.value)}
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowServiceForm(false); setEditingService(null); }}
                                    className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 font-bold bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                                >
                                    {editingService ? 'Salvar' : 'Adicionar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesScreen;
