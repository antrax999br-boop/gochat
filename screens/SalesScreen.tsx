import React, { useState, useMemo, useEffect } from 'react';
import { Client, Quote, Service, QuoteItem } from '../types';
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
    CheckCircle2
} from 'lucide-react';

const SalesScreen: React.FC<{ clients: Client[] }> = ({ clients }) => {
    const [quotes, setQuotes] = useState<Quote[]>(() => {
        const saved = localStorage.getItem('schumacher_quotes');
        return saved ? JSON.parse(saved) : [];
    });

    const [services, setServices] = useState<Service[]>(() => {
        const saved = localStorage.getItem('schumacher_services');
        if (saved) return JSON.parse(saved);
        return [
            { id: '1', name: 'Limpeza Caixa D\'água', price: 250 },
            { id: '2', name: 'Limpeza Estofados', price: 180 },
            { id: '3', name: 'Limpeza Casas', price: 350 },
            { id: '4', name: 'Segurança de Portaria', price: 1200 },
        ];
    });

    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [currentQuoteItems, setCurrentQuoteItems] = useState<QuoteItem[]>([]);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // New Service Form State
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [newServiceName, setNewServiceName] = useState('');
    const [newServicePrice, setNewServicePrice] = useState('');

    useEffect(() => {
        localStorage.setItem('schumacher_quotes', JSON.stringify(quotes));
    }, [quotes]);

    useEffect(() => {
        localStorage.setItem('schumacher_services', JSON.stringify(services));
    }, [services]);

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
        const ns: Service = {
            id: Date.now().toString(),
            name: newServiceName,
            price: parseFloat(newServicePrice)
        };
        setServices([...services, ns]);
        handleAddServiceToQuote(ns);
        setNewServiceName('');
        setNewServicePrice('');
        setShowServiceForm(false);
    };

    const handleSaveQuote = () => {
        if (!selectedClientId || currentQuoteItems.length === 0) {
            alert('Selecione um cliente e adicione pelo menos um serviço.');
            return;
        }

        const client = clients.find(c => c.id === selectedClientId);
        if (!client) return;

        const newQuote: Quote = {
            id: Date.now().toString(),
            clientId: selectedClientId,
            clientName: client.companyName,
            items: [...currentQuoteItems],
            subtotal,
            discountPercentage: discountPercent,
            discountAmount,
            total,
            status: 'draft',
            date: new Date().toISOString()
        };

        setQuotes([newQuote, ...quotes]);
        setShowQuoteModal(false);
        resetForm();
    };

    const resetForm = () => {
        setSelectedClientId('');
        setCurrentQuoteItems([]);
        setDiscountPercent(0);
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar orçamento por cliente..."
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-slate-900 dark:text-white shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuotes.map(quote => (
                    <div key={quote.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-emerald-500/50 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl text-emerald-500">
                                <FileText className="w-6 h-6" />
                            </div>
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${quote.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                    quote.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-600'
                                }`}>
                                {quote.status === 'draft' ? 'Rascunho' : quote.status === 'approved' ? 'Aprovado' : 'Pendente'}
                            </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-1">{quote.clientName}</h3>
                        <p className="text-xs text-slate-400 mb-4">{new Date(quote.date).toLocaleDateString()}</p>

                        <div className="space-y-2 mb-6">
                            {quote.items.slice(0, 2).map((item, i) => (
                                <div key={i} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                    <span>{item.serviceName} (x{item.quantity})</span>
                                    <span>R$ {item.total.toLocaleString()}</span>
                                </div>
                            ))}
                            {quote.items.length > 2 && (
                                <p className="text-[10px] text-slate-400 italic">+ {quote.items.length - 2} outros serviços</p>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total com Desconto</p>
                                <p className="text-xl font-black text-emerald-600">R$ {quote.total.toLocaleString()}</p>
                            </div>
                            <button className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quote Modal */}
            {showQuoteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl p-0 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row max-h-[90vh] overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">

                        {/* Left Side: Services Selection */}
                        <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-emerald-500" /> Catálogo de Serviços
                                </h2>
                                <button
                                    onClick={() => setShowServiceForm(!showServiceForm)}
                                    className="text-xs font-bold text-emerald-600 hover:underline"
                                >
                                    {showServiceForm ? 'Ver lista' : '+ Criar Novo'}
                                </button>
                            </div>

                            {showServiceForm ? (
                                <form onSubmit={handleCreateService} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in slide-in-from-top-2">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Cadastrar Serviço na Hora</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nome do Serviço</label>
                                            <input
                                                type="text"
                                                value={newServiceName}
                                                onChange={e => setNewServiceName(e.target.value)}
                                                placeholder="Ex: Instalação de Câmeras"
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Preço Base (R$)</label>
                                            <input
                                                type="number"
                                                value={newServicePrice}
                                                onChange={e => setNewServicePrice(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 focus:ring-2 focus:ring-emerald-500 outline-none text-sm dark:text-white font-bold"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button type="button" onClick={() => setShowServiceForm(false)} className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Voltar</button>
                                            <button type="submit" className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95">Adicionar e Usar</button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {services.map(service => (
                                        <button
                                            key={service.id}
                                            onClick={() => handleAddServiceToQuote(service)}
                                            className="text-left p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-emerald-500 group transition-all"
                                        >
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500">{service.name}</p>
                                            <p className="text-xs text-slate-400 mt-1">R$ {service.price.toLocaleString()}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Side: Quote Summary */}
                        <div className="w-full md:w-[400px] border-l border-slate-100 dark:border-slate-800 p-8 flex flex-col h-full bg-white dark:bg-slate-900 relative">
                            <button onClick={() => setShowQuoteModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Resumo</h2>

                            <div className="space-y-4 flex-1 overflow-y-auto min-h-0 mb-6 pr-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                                    <select
                                        value={selectedClientId}
                                        onChange={e => setSelectedClientId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white text-sm"
                                    >
                                        <option value="">Selecione um cliente...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                                    </select>
                                </div>

                                <div className="pt-4 space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Itens Adicionados</p>
                                    {currentQuoteItems.length === 0 ? (
                                        <div className="border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-950/20">
                                            <ShoppingCart className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-xs text-slate-400 font-medium">Nenhum serviço selecionado</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {currentQuoteItems.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl group animate-in slide-in-from-right-2">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.serviceName}</p>
                                                        <p className="text-[10px] text-slate-400">R$ {item.unitPrice.toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-black text-slate-900 dark:text-white">R$ {item.total.toLocaleString()}</span>
                                                        <button onClick={() => removeItemFromQuote(i)} className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 ml-2">
                                        <Tag className="w-3.5 h-3.5" /> Desconto (%)
                                    </div>
                                    <input
                                        type="number"
                                        value={discountPercent}
                                        onChange={e => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                        className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2 text-right text-xs font-black text-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    />
                                </div>

                                <div className="space-y-1 py-2">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Subtotal</span>
                                        <span>R$ {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-rose-500 font-medium">
                                        <span>Desconto ({discountPercent}%)</span>
                                        <span>- R$ {discountAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-2 border-t border-slate-50 dark:border-slate-800 mt-2">
                                        <span>Total Geral</span>
                                        <span className="text-emerald-500">R$ {total.toLocaleString()}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveQuote}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 mt-4"
                                >
                                    <Save className="w-5 h-5" /> Salvar Orçamento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesScreen;
