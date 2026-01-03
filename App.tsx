import React, { useState, useEffect } from 'react';
import { Page, User, CalendarEvent, NotificationItem, Transaction, Client, Quote, Service, ExpenseItem, Employee } from './types';
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
import EmployeesScreen from './screens/EmployeesScreen';
import Layout from './components/Layout';
import Calculator from './components/Calculator';
import { supabase } from './lib/supabase';
import { Bell, Lock, X } from 'lucide-react';

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [requestedPage, setRequestedPage] = useState<Page | null>(null);

  useEffect(() => {
    console.log("App Schumacher v1.1 - Supabase Sync Active");
    // 1. Initial Supabase Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          username: session.user.user_metadata.display_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        });
        fetchAllData();
      }
    });

    // 2. Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          username: session.user.user_metadata.display_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        });
        fetchAllData();

        // Push to dashboard ONLY on sign in event to avoid interrupting active sessions on refresh
        if (event === 'SIGNED_IN') {
          setActivePage(Page.DASHBOARD);
        }
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

    // 3. Real-time Changes Listener
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        console.log("Real-time update received from database...");
        fetchAllData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAllData = async () => {
    try {
      // 1. Fetch Employees (Prioritized)
      try {
        const { data: empData, error: empErr } = await supabase.from('employees').select('*').order('full_name');
        if (empErr) {
          console.error('Supabase error fetching employees:', empErr);
          throw empErr;
        }

        if (empData) {
          console.log(`📡 SYNC: Fetched ${empData.length} employees`);
          const mapped = empData.map(emp => ({
            id: emp.id,
            costCenter: emp.cost_center || '',
            fullName: emp.full_name || 'Sem Nome',
            position: emp.position || 'Sem Cargo',
            hireDate: emp.hire_date || new Date().toISOString().split('T')[0],
            workSchedule: emp.work_schedule || '',
            baseSalary: Number(emp.base_salary) || 0,
            additionalPercent20: Number(emp.additional_percent_20) || 0,
            attendance: Number(emp.attendance) || 0,
            mealVoucher: Number(emp.meal_voucher) || 0,
            foodVoucherPerDay: Number(emp.food_voucher_per_day) || 0,
            foodVoucherTotal: Number(emp.food_voucher_total) || 0,
            transportVoucherPerDay: Number(emp.transport_voucher_per_day) || 0,
            transportVoucherTotal: Number(emp.transport_voucher_total) || 0,
            absenceDays: Number(emp.absence_days) || 0,
            absenceTotal: Number(emp.absence_total) || 0,
            fuel: Number(emp.fuel) || 0,
            carRental: Number(emp.car_rental) || 0,
            observations: emp.observations || '',
            cpf: emp.cpf || '',
            department: emp.department || '',
            email: emp.email || '',
            phone: emp.phone || '',
            salary: Number(emp.salary) || 0,
            status: emp.status || 'active',
            address: emp.address || '',
            birthDate: emp.birth_date || ''
          }));
          setEmployees(mapped);
        } else {
          setEmployees([]);
        }
      } catch (e: any) {
        console.error('CRITICAL: Mapping or fetch failed for employees:', e);
        // Only alert if it's a real fetch error, not just an empty result
        if (e.message && !e.message.includes('null')) {
          alert('Aviso técnico: Erro ao carregar funcionários do banco.');
        }
      }

      // 2. Fetch Clients
      let clientsData: any[] = [];
      try {
        const { data, error } = await supabase.from('clients').select('*').order('company_name');
        if (error) throw error;
        if (data) {
          clientsData = data;
          setClients(data.map(c => ({
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
      } catch (e) {
        console.error('Error fetching clients:', e);
      }

      // 3. Fetch Services
      try {
        const { data, error } = await supabase.from('services').select('*').order('name');
        if (error) throw error;
        if (data) setServices(data);
      } catch (e) {
        console.error('Error fetching services:', e);
      }

      // 4. Fetch Transactions
      try {
        const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        if (error) throw error;
        if (data) {
          setTransactions(data.map(t => ({
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
      } catch (e) {
        console.error('Error fetching transactions:', e);
      }

      // 5. Fetch Quotes with Items
      try {
        const { data, error } = await supabase.from('quotes').select(`
          *,
          items:quote_items(*)
        `).order('date', { ascending: false }).order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          const mappedQuotes = data.map(q => ({
            id: q.id,
            clientId: q.client_id,
            clientName: clientsData?.find(c => c.id === q.client_id)?.company_name || 'Desconhecido',
            items: q.items?.map((i: any) => ({
              serviceId: i.service_id,
              serviceName: i.service_name,
              quantity: i.quantity,
              unitPrice: Number(i.unit_price),
              total: Number(i.total)
            })) || [],
            subtotal: Number(q.subtotal),
            discountPercentage: Number(q.discount_percentage),
            discountAmount: Number(q.discount_amount),
            total: Number(q.total),
            status: q.status,
            date: q.date
          }));
          setQuotes(mappedQuotes);
        }
      } catch (e) {
        console.error('Error fetching quotes:', e);
      }

      // 6. Fetch Expense Structure
      try {
        const { data, error } = await supabase.from('expense_structure').select('*').order('created_at');
        if (error) throw error;
        if (data) {
          setExpenseItems(data.map(e => ({
            id: e.id,
            description: e.description,
            type: e.type,
            value: Number(e.value)
          })));
        }
      } catch (e) {
        console.error('Error fetching expense structure:', e);
      }

      // 7. Fetch Calendar Events
      try {
        const { data, error } = await supabase.from('calendar_events').select('*').order('date');
        if (error) throw error;
        if (data) {
          const mappedEvents: CalendarEvent[] = data.map(e => ({
            id: e.id,
            title: e.title,
            description: e.description,
            date: e.date,
            type: e.type as any,
            completed: e.completed,
            amount: e.amount ? Number(e.amount) : undefined
          }));
          setEvents(mappedEvents);
          checkNotifications(mappedEvents);
        }
      } catch (e) {
        console.error('Error fetching calendar events:', e);
      }
    } catch (error) {
      console.error('General data fetch error:', error);
    }
  };

  const clearAllData = () => {
    setClients([]);
    setServices([]);
    setTransactions([]);
    setQuotes([]);
    setExpenseItems([]);
    setEvents([]);
    setEmployees([]);
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

  const handleUpdateQuotes = async () => {
    await fetchAllData();
  };

  const handleDeleteQuote = async (id: string) => {
    if (id) {
      // 1. Delete items first (cascade or manual)
      await supabase.from('quote_items').delete().eq('quote_id', id);
      // 2. Delete quote
      await supabase.from('quotes').delete().eq('id', id);
      // 3. Refresh
      await fetchAllData();
    }
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

  const PROTECTED_PAGES = [Page.FINANCE, Page.EXPENSES, Page.EMPLOYEES];
  const CORRECT_PASSWORD = '1601';

  const handleNavigate = (page: Page) => {
    if (PROTECTED_PAGES.includes(page)) {
      setRequestedPage(page);
      setIsPasswordProtected(true);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setActivePage(page);
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!viewedNotifications.includes(notification.id)) {
      const newViewed = [...viewedNotifications, notification.id];
      setViewedNotifications(newViewed);
      localStorage.setItem('schumacher_viewed_notifications', JSON.stringify(newViewed));
    }

    if (notification.page) {
      handleNavigate(notification.page);
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

  const handleAddEvent = async (event: CalendarEvent) => {
    const { id, ...eventData } = event;
    const { error } = await supabase.from('calendar_events').insert(eventData);
    if (error) {
      console.error('Error adding event:', error);
      alert('Erro ao salvar evento no calendário.');
    } else {
      await fetchAllData();
    }
  };

  const handleUpdateEvent = async (updatedEvent: CalendarEvent) => {
    const { id, ...eventData } = updatedEvent;
    const { error } = await supabase.from('calendar_events').update(eventData).eq('id', id);
    if (error) {
      console.error('Error updating event:', error);
      alert('Erro ao atualizar evento.');
    } else {
      await fetchAllData();
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) {
      console.error('Error deleting event:', error);
      alert('Erro ao excluir evento.');
    } else {
      await fetchAllData();
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setActivePage(Page.DASHBOARD);
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


  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === CORRECT_PASSWORD) {
      if (requestedPage) {
        setActivePage(requestedPage);
      }
      setIsPasswordProtected(false);
      setPasswordInput('');
      setPasswordError('');
      setRequestedPage(null);
    } else {
      setPasswordError('Senha incorreta. Tente novamente.');
      setPasswordInput('');
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activePage) {
      case Page.DASHBOARD:
        return <DashboardScreen transactions={transactions} expenseItems={expenseItems} />;
      case Page.CONNECT:
        return <ConnectScreen />;
      case Page.CONVERSATIONS:
        return user ? <ConversationsScreen currentUser={user} /> : null;
      case Page.SETTINGS:
        return <SettingsScreen />;
      case Page.FINANCE:
        return <FinanceScreen transactions={transactions} expenseItems={expenseItems} onUpdateTransactions={handleUpdateTransactions} fetchAllData={fetchAllData} />;
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
          onDeleteQuote={handleDeleteQuote}
          onApproveQuote={handleApproveQuote}
          onUpdateServices={handleUpdateServices}
          fetchAllData={fetchAllData}
        />;
      case Page.EMPLOYEES:
        return <EmployeesScreen employees={employees} setEmployees={setEmployees} fetchAllData={fetchAllData} />;
      default:
        return <DashboardScreen transactions={transactions} expenseItems={expenseItems} />;
    }
  };

  return (
    <Layout
      user={user}
      activePage={activePage}
      onNavigate={handleNavigate}
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

      {/* Password Protection Modal */}
      {isPasswordProtected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-200 dark:border-slate-800 transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                  <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Área Protegida</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Digite a senha para continuar</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsPasswordProtected(false);
                  setPasswordInput('');
                  setPasswordError('');
                  setRequestedPage(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                  Senha de Acesso
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-4 px-4 text-center text-2xl font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                  placeholder="••••"
                  maxLength={4}
                />
                {passwordError && (
                  <p className="text-sm text-rose-500 font-medium mt-2 flex items-center gap-2">
                    <X className="w-4 h-4" />
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordProtected(false);
                    setPasswordInput('');
                    setPasswordError('');
                    setRequestedPage(null);
                  }}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Desbloquear
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                <span className="font-bold">Páginas protegidas:</span> Financeiro, Estrutura de Gastos e Funcionários
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
