import React, { useState, useEffect } from 'react';
import { Page, User, CalendarEvent, NotificationItem, Transaction, Client, Quote, Service, ExpenseItem } from './types';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ConnectScreen from './screens/ConnectScreen';
import ConversationsScreen from './screens/ConversationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import FinanceScreen from './screens/FinanceScreen';
import CalendarScreen from './screens/CalendarScreen';
import ExpenseStructureScreen from './screens/ExpenseStructureScreen';
import ClientsScreen from './screens/ClientsScreen';
import SalesScreen from './screens/SalesScreen';
import Layout from './components/Layout';
import Calculator from './components/Calculator';
import { supabase } from './lib/supabase';
import { Bell, X } from 'lucide-react';

const initialTransactions: Transaction[] = [
  { id: '1', description: 'Assinatura API WhatsApp', amount: 250, type: 'expense', date: '2023-10-05', month: 'Out', category: 'Software' },
  { id: '2', description: 'Venda de Plano Premium', amount: 1500, type: 'income', date: '2023-10-10', month: 'Out', category: 'Vendas' },
  { id: '3', description: 'Aluguel Escritório', amount: 800, type: 'expense', date: '2023-10-15', month: 'Out', category: 'Infra' },
  { id: '4', description: 'Consultoria Especializada', amount: 3000, type: 'income', date: '2023-09-20', month: 'Set', category: 'Serviços' },
  { id: '5', description: 'Marketing Digital', amount: 1200, type: 'expense', date: '2023-09-25', month: 'Set', category: 'Marketing' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>(Page.DASHBOARD);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentToast, setCurrentToast] = useState<NotificationItem | null>(null);
  const [viewedNotifications, setViewedNotifications] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);

  useEffect(() => {
    console.log("App Schumacher v1.1 - Supabase Sync Active");
    // 1. Initial Supabase Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          username: session.user.user_metadata.display_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        });
        fetchAllData();
      }
    });

    // 2. Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          username: session.user.user_metadata.display_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        });
        fetchAllData();
      } else {
        setUser(null);
        clearAllData();
      }
    });

    const theme = localStorage.getItem('schumacher_theme');
    if (theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Load viewed notifications
    const savedViewed = localStorage.getItem('schumacher_viewed_notifications');
    if (savedViewed) {
      setViewedNotifications(JSON.parse(savedViewed));
    }

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch Clients
      const { data: clientsData } = await supabase.from('clients').select('*').order('company_name');
      if (clientsData) {
        setClients(clientsData.map(c => ({
          id: c.id,
          cnpj: c.cnpj,
          companyName: c.company_name,
          contactName: c.contact_name,
          contactPhone: c.contact_phone,
          address: c.address,
          email: c.email,
          createdAt: c.created_at
        })));
      }

      // Fetch Services
      const { data: servicesData } = await supabase.from('services').select('*').order('name');
      if (servicesData) {
        setServices(servicesData);
      }

      // Fetch Transactions
      const { data: transData } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (transData) {
        setTransactions(transData.map(t => ({
          id: t.id,
          description: t.description,
          amount: Number(t.amount),
          type: t.type,
          date: t.date,
          month: t.month,
          category: t.category,
          clientId: t.client_id
        })));
      }

      // Fetch Quotes with Items
      const { data: quotesData } = await supabase.from('quotes').select(`
        *,
        items:quote_items(*)
      `).order('date', { ascending: false });

      if (quotesData) {
        const mappedQuotes = quotesData.map(q => ({
          id: q.id,
          clientId: q.client_id,
          clientName: clientsData?.find(c => c.id === q.client_id)?.company_name || 'Desconhecido',
          items: q.items.map((i: any) => ({
            serviceId: i.service_id,
            serviceName: i.service_name,
            quantity: i.quantity,
            unitPrice: Number(i.unit_price),
            total: Number(i.total)
          })),
          subtotal: Number(q.subtotal),
          discountPercentage: Number(q.discount_percentage),
          discountAmount: Number(q.discount_amount),
          total: Number(q.total),
          status: q.status,
          date: q.date
        }));
        setQuotes(mappedQuotes);
      }
      // Fetch Expense Structure
      const { data: expData } = await supabase.from('expense_structure').select('*').order('created_at');
      if (expData) {
        setExpenseItems(expData.map(e => ({
          id: e.id,
          description: e.description,
          type: e.type,
          value: Number(e.value)
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const clearAllData = () => {
    setClients([]);
    setServices([]);
    setTransactions([]);
    setQuotes([]);
    setExpenseItems([]);
  };

  const handleUpdateTransactions = async (newTransactions: Transaction[]) => {
    // If length changed, it might be a delete or add
    // Screens handle their own inserts now, so let's check for deletion here
    if (newTransactions.length < transactions.length) {
      const deletedId = transactions.find(t => !newTransactions.find(nt => nt.id === t.id))?.id;
      if (deletedId) {
        await supabase.from('transactions').delete().eq('id', deletedId);
      }
    }
    await fetchAllData();
  };

  const handleUpdateClients = async (newClients: Client[]) => {
    // Simplified: in a real app we'd do individual updates, 
    // but for now let's just refresh after any change on client screen
    await fetchAllData();
  };

  const handleUpdateQuotes = async (newQuotes: Quote[]) => {
    // If the change was a deletion (length decreased)
    if (newQuotes.length < quotes.length) {
      const deletedId = quotes.find(q => !newQuotes.find(nq => nq.id === q.id))?.id;
      if (deletedId) {
        await supabase.from('quotes').delete().eq('id', deletedId);
      }
    }
    await fetchAllData();
  };

  const handleUpdateServices = async (newServices: Service[]) => {
    // Check for deletions
    const { data: currentDbServices } = await supabase.from('services').select('id');
    if (currentDbServices) {
      const currentDbIds = currentDbServices.map(s => s.id);
      const newIds = newServices.map(s => s.id);
      const toDelete = currentDbIds.filter(id => !newIds.includes(id));

      for (const id of toDelete) {
        await supabase.from('services').delete().eq('id', id);
      }
    }

    // Update/Insert others
    for (const s of newServices) {
      const isNew = s.id.length < 10 || isNaN(Date.parse(s.id)) && !s.id.includes('-'); // Rough check for non-UUID
      // Better check: if it doesn't look like a UUID, it's new
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id);

      if (isUuid) {
        await supabase.from('services').update({ name: s.name, price: s.price }).eq('id', s.id);
      } else {
        await supabase.from('services').insert({ name: s.name, price: s.price });
      }
    }
    await fetchAllData();
  };

  const handleApproveQuote = async (quote: Quote) => {
    // 1. Mark quote as approved in database
    await supabase.from('quotes').update({ status: 'approved' }).eq('id', quote.id);

    // 2. Create transaction
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();

    await supabase.from('transactions').insert({
      description: `Serviço: Orçamento #${quote.id.slice(-4)}`,
      amount: quote.total,
      type: 'income',
      date: now.toISOString().split('T')[0],
      month: monthNames[now.getMonth()],
      category: 'Vendas',
      client_id: quote.clientId
    });

    // 3. Refresh and Notify
    await fetchAllData();

    const notification: NotificationItem = {
      id: `notif-quote-${quote.id}`,
      title: 'Orçamento Aprovado!',
      message: `A venda para ${quote.clientName} (R$ ${quote.total.toLocaleString()}) foi registrada no financeiro.`,
      page: Page.FINANCE
    };
    setCurrentToast(notification);
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!viewedNotifications.includes(notification.id)) {
      const newViewed = [...viewedNotifications, notification.id];
      setViewedNotifications(newViewed);
      localStorage.setItem('schumacher_viewed_notifications', JSON.stringify(newViewed));
    }

    if (notification.page) {
      setActivePage(notification.page);
    }
  };

  const checkNotifications = (currentEvents: CalendarEvent[]) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const newNotifications: NotificationItem[] = [];

    // 1. Verificar contas vencendo hoje ou amanhã
    currentEvents.forEach(e => {
      if (e.type === 'bill' && !e.completed && (e.date === today || e.date === tomorrow)) {
        newNotifications.push({
          id: e.id,
          title: e.date === today ? 'Conta vence HOJE!' : 'Conta vence amanhã',
          message: `Pagar: ${e.title} (R$ ${e.amount?.toFixed(2)})`,
          page: Page.CALENDAR
        });
      }
    });

    // 2. Verificar outros eventos de hoje
    currentEvents.forEach(e => {
      if (e.date === today && !e.completed && e.type !== 'bill') {
        newNotifications.push({
          id: e.id,
          title: 'Evento Hoje',
          message: `${e.title}`,
          page: Page.CALENDAR
        });
      }
    });

    setNotifications(newNotifications);

    if (newNotifications.length > 0) {
      setCurrentToast(newNotifications[0]);
    }
  };

  const handleSaveEvents = (newEvents: CalendarEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem('schumacher_events', JSON.stringify(newEvents));
  };

  const handleAddEvent = (event: CalendarEvent) => {
    const newEvents = [...events, event];
    handleSaveEvents(newEvents);
    checkNotifications(newEvents);
  };

  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
    const newEvents = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    handleSaveEvents(newEvents);
    checkNotifications(newEvents);
  };

  const handleDeleteEvent = (id: string) => {
    const newEvents = events.filter(e => e.id !== id);
    handleSaveEvents(newEvents);
    checkNotifications(newEvents);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    // Session is handled by Supabase, but we can keep metadata in state
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('schumacher_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('schumacher_theme', 'light');
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activePage) {
      case Page.DASHBOARD:
        return <DashboardScreen transactions={transactions} />;
      case Page.CONNECT:
        return <ConnectScreen />;
      case Page.CONVERSATIONS:
        return <ConversationsScreen />;
      case Page.SETTINGS:
        return <SettingsScreen />;
      case Page.FINANCE:
        return <FinanceScreen transactions={transactions} onUpdateTransactions={handleUpdateTransactions} fetchAllData={fetchAllData} />;
      case Page.CALENDAR:
        return <CalendarScreen
          events={events}
          onAddEvent={handleAddEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
        />;
      case Page.EXPENSES:
        return <ExpenseStructureScreen items={expenseItems} setItems={setExpenseItems} fetchAllData={fetchAllData} />;
      case Page.CLIENTS:
        return <ClientsScreen clients={clients} setClients={handleUpdateClients} transactions={transactions} onUpdateTransactions={handleUpdateTransactions} />;
      case Page.SALES:
        return <SalesScreen
          clients={clients}
          quotes={quotes}
          services={services}
          onUpdateQuotes={handleUpdateQuotes}
          onApproveQuote={handleApproveQuote}
          onUpdateServices={handleUpdateServices}
        />;
      default:
        return <DashboardScreen transactions={transactions} />;
    }
  };

  return (
    <Layout
      user={user}
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={handleLogout}
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
      notifications={notifications}
      viewedNotifications={viewedNotifications}
      onNotificationClick={handleNotificationClick}
    >
      {renderContent()}

      {/* Global Floating Calculator - Only on Finance pages */}
      {(activePage === Page.FINANCE || activePage === Page.EXPENSES) && <Calculator />}

      {/* Notification Toast (Shows only the most important one) */}
      {currentToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            onClick={() => {
              handleNotificationClick(currentToast);
              setCurrentToast(null);
            }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 border-l-4 border-red-500 w-80 relative flex items-start gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div className={`p-2 rounded-full shrink-0 ${viewedNotifications.includes(currentToast.id) ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 pr-6">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{currentToast.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{currentToast.message}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentToast(null);
              }}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
