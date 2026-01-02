import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { ChevronLeft, ChevronRight, Plus, Check, Trash2, Calendar as CalendarIcon, DollarSign, Bell, Briefcase } from 'lucide-react';

interface CalendarScreenProps {
    events: CalendarEvent[];
    onAddEvent: (event: CalendarEvent) => void;
    onUpdateEvent: (event: CalendarEvent) => void;
    onDeleteEvent: (id: string) => void;
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ events, onAddEvent, onUpdateEvent, onDeleteEvent }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');
    const [newEventType, setNewEventType] = useState<'bill' | 'reminder' | 'meeting'>('reminder');
    const [newEventAmount, setNewEventAmount] = useState('');

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    const handleAddEvent = () => {
        if (!selectedDate || !newEventTitle) return;

        const event: CalendarEvent = {
            id: Math.random().toString(36).substr(2, 9),
            title: newEventTitle,
            description: newEventDescription,
            date: selectedDate.toISOString().split('T')[0],
            type: newEventType,
            completed: false,
            amount: newEventType === 'bill' ? parseFloat(newEventAmount) || 0 : undefined,
        };

        onAddEvent(event);
        setShowAddModal(false);
        setNewEventTitle('');
        setNewEventDescription('');
        setNewEventType('reminder');
        setNewEventAmount('');
    };

    const getEventsForDay = (day: number) => {
        const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
        return events.filter(e => e.date === dateStr);
    };

    const getSelectedDayEvents = () => {
        if (!selectedDate) return [];
        const dateStr = selectedDate.toISOString().split('T')[0];
        return events.filter(e => e.date === dateStr);
    };

    const renderCalendarDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentDate);
        const firstDay = firstDayOfMonth(currentDate);

        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50"></div>);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
            const dayEvents = events.filter(e => e.date === dateStr);
            const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth() && selectedDate?.getFullYear() === currentDate.getFullYear();
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            days.push(
                <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`h-24 border border-slate-100 dark:border-slate-800 p-2 relative cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/20 z-10' : ''} ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-900'}`}
                >
                    <div className={`text-sm font-bold mb-1 flex justify-between items-center ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}>{day}</span>
                        {dayEvents.length > 0 && (
                            <span className="text-[10px] items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded-full hidden sm:flex">
                                {dayEvents.length}
                            </span>
                        )}
                    </div>
                    <div className="space-y-1 overflow-hidden max-h-[calc(100%-2rem)]">
                        {dayEvents.slice(0, 3).map((event) => (
                            <div key={event.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 ${event.completed ? 'bg-slate-100 text-slate-400 line-through dark:bg-slate-800 dark:text-slate-500' :
                                event.type === 'bill' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                    event.type === 'meeting' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                                        'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                                {event.type === 'bill' && <DollarSign className="w-2 h-2 shrink-0" />}
                                {event.title}
                            </div>
                        ))}
                        {dayEvents.length > 3 && (
                            <div className="text-[9px] text-slate-400 pl-1">+ {dayEvents.length - 3} mais</div>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Seu Calendário</h1>

                <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-1">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="w-40 text-center font-bold text-slate-700 dark:text-slate-200">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Calendar Grid */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
                            <div key={d} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 flex-1 overflow-y-auto auto-rows-fr">
                        {renderCalendarDays()}
                    </div>
                </div>

                {/* Sidebar Details Panel */}
                <div className="w-80 flex flex-col gap-6 shrink-0">
                    {/* Selected Day Events */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                                    {selectedDate?.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    {getSelectedDayEvents().length} eventos agendados
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {getSelectedDayEvents().length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                                    <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-sm">Nenhum evento para este dia.</p>
                                    <button onClick={() => setShowAddModal(true)} className="text-emerald-500 text-xs font-bold mt-2 hover:underline">Adicionar novo</button>
                                </div>
                            ) : (
                                getSelectedDayEvents().map(event => (
                                    <div key={event.id} className={`group p-4 rounded-xl border transition-all ${event.completed
                                        ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`p-1.5 rounded-lg ${event.type === 'bill' ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                                                    event.type === 'meeting' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                                                        'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                                                }`}>
                                                {event.type === 'bill' ? <DollarSign className="w-3.5 h-3.5" /> :
                                                    event.type === 'meeting' ? <Briefcase className="w-3.5 h-3.5" /> :
                                                        <Bell className="w-3.5 h-3.5" />}
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onUpdateEvent({ ...event, completed: !event.completed })}
                                                    className={`p-1.5 rounded-lg transition-colors ${event.completed ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteEvent(event.id)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <h4 className={`font-bold text-sm mb-1 ${event.completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                                            {event.title}
                                        </h4>
                                        {event.description && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{event.description}</p>}
                                        {event.amount && (
                                            <span className="inline-block text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                R$ {event.amount.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20">
                        <h3 className="font-bold text-lg mb-1">Próximo Vencimento</h3>
                        {(() => {
                            const today = new Date().toISOString().split('T')[0];
                            const nextBill = events
                                .filter(e => e.type === 'bill' && !e.completed && e.date >= today)
                                .sort((a, b) => a.date.localeCompare(b.date))[0];

                            if (nextBill) {
                                const daysDiff = Math.ceil((new Date(nextBill.date).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24));
                                return (
                                    <div>
                                        <p className="text-emerald-100 text-sm mb-4">Você tem uma conta para pagar em breve.</p>
                                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                                            <p className="font-bold text-sm truncate">{nextBill.title}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-emerald-100">
                                                    {daysDiff === 0 ? 'Vence hoje!' : daysDiff === 1 ? 'Vence amanhã' : `Vence em ${daysDiff} dias`}
                                                </span>
                                                <span className="font-bold bg-white text-emerald-600 text-xs px-2 py-0.5 rounded">
                                                    R$ {nextBill.amount?.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return <p className="text-emerald-100 text-sm">Nenhuma conta pendente próxima.</p>;
                        })()}
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 transform scale-100 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Novo Evento</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Título</label>
                                <input
                                    type="text"
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    placeholder="Ex: Pagar Internet"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo</label>
                                <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                                    {[
                                        { id: 'bill', label: 'Conta', icon: DollarSign },
                                        { id: 'reminder', label: 'Lembrete', icon: Bell },
                                        { id: 'meeting', label: 'Reunião', icon: Briefcase }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setNewEventType(type.id as any)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${newEventType === type.id
                                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white'
                                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                        >
                                            <type.icon className="w-3.5 h-3.5" />
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {newEventType === 'bill' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valor (R$)</label>
                                    <input
                                        type="number"
                                        value={newEventAmount}
                                        onChange={(e) => setNewEventAmount(e.target.value)}
                                        placeholder="0,00"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descrição (Opcional)</label>
                                <textarea
                                    value={newEventDescription}
                                    onChange={(e) => setNewEventDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-24 resize-none"
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddEvent}
                                disabled={!newEventTitle}
                                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                Criar Evento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarScreen;
