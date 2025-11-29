
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking, Transaction, DataContextType, BookingStatus, TransactionType, Currency, Agent, Client, Notification, Treasury, Payment, User, CompanySettings, SmartAlert, NavPage, Theme, Itinerary, Task, AuditLogEntry, Language, InventoryItem } from '../types';
import { MOCK_BOOKINGS, MOCK_TRANSACTIONS, MOCK_AGENTS, MOCK_CLIENTS, MOCK_TREASURY, MOCK_USERS, TRANSLATIONS, MOCK_INVENTORY } from '../constants';

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Default Exchange Rates (Base: JOD)
const DEFAULT_RATES: Record<Currency, number> = {
    'JOD': 1,
    'USD': 1.41,
    'EUR': 1.32,
    'ILS': 5.25,
    'SAR': 5.29
};

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  nameAr: 'هوانا للسياحة والسفر',
  nameEn: 'HAWANA Travel & Tourism',
  logoText: 'HAWANA',
  address: 'Amman, Jordan',
  phone: '+962 79 000 0000',
  email: 'info@hawana.com',
  logoUrl: '',
  logoVisibility: 'both'
};

const PAGE_SIZE = 25;

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- AUTH STATE ---
  const [users, setUsers] = useState<User[]>(MOCK_USERS); 
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data State (Initialized with Mock Data for Offline Mode)
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotal, setBookingsTotal] = useState(MOCK_BOOKINGS.length);

  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotal, setTransactionsTotal] = useState(MOCK_TRANSACTIONS.length);

  // Full Data State (For Calculations/Reports) - Synced with main state in offline mode
  const [allBookings, setAllBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [treasury, setTreasury] = useState<Treasury[]>(MOCK_TREASURY);
  
  // New Feature States
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY); 
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Always false in offline mode
  const [isDbConnected, setIsDbConnected] = useState(false);

  // Smart Alerts State
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);

  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('hawana_theme') as Theme;
    return savedTheme || 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('hawana_theme', newTheme);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- LANGUAGE STATE ---
  const [language, setLanguage] = useState<Language>(() => {
      const savedLang = localStorage.getItem('hawana_language') as Language;
      return savedLang || 'ar';
  });

  const toggleLanguage = (lang: Language) => {
      setLanguage(lang);
      localStorage.setItem('hawana_language', lang);
  };

  const t = (key: string): string => {
      return TRANSLATIONS[language]?.[key] || key;
  };

  useEffect(() => {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Company Settings
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('hawana_company_settings');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_SETTINGS;
  });

  const updateCompanySettings = (settings: CompanySettings) => {
    setCompanySettings(settings);
    localStorage.setItem('hawana_company_settings', JSON.stringify(settings));
    addAuditLog('UPDATE_SETTINGS', 'تم تحديث إعدادات النظام', 'System');
  };

  // Currency State
  const [systemCurrency, setSystemCurrency] = useState<Currency>(() => {
    return (localStorage.getItem('hawana_system_currency') as Currency) || 'JOD';
  });

  const [exchangeRates, setExchangeRates] = useState<Record<Currency, number>>(() => {
    const savedRates = localStorage.getItem('hawana_exchange_rates');
    return savedRates ? JSON.parse(savedRates) : DEFAULT_RATES;
  });

  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setNotification({ id, message, type });
    setTimeout(() => {
        setNotification(prev => prev?.id === id ? null : prev);
    }, 3000);
  };

  // --- SMART ALERTS LOGIC ---
  const generateSmartAlerts = (bookingsData: Booking[]) => {
      const alerts: SmartAlert[] = [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const after3Days = new Date(today);
      after3Days.setDate(after3Days.getDate() + 3);

      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      bookingsData.forEach(booking => {
          const travelDate = new Date(booking.date);
          const isUpcoming = travelDate >= today;

          // 1. URGENT FINANCIAL CHECK
          const remaining = booking.amount - booking.paidAmount;
          if (isUpcoming && travelDate <= after3Days && remaining > 0.01 && booking.status === BookingStatus.CONFIRMED) {
              alerts.push({
                  id: `fin-urgent-${booking.id}`,
                  title: 'تنبيه مالي عاجل',
                  message: `العميل ${booking.clientName} يسافر بتاريخ ${travelDate.toLocaleDateString('en-GB')} وعليه ذمة ${remaining.toFixed(2)} ${systemCurrency}.`,
                  type: 'critical',
                  date: new Date().toISOString(),
                  category: 'Finance',
                  linkPage: NavPage.BOOKINGS
              });
          }
          else if (remaining > 0.01 && booking.status !== BookingStatus.CANCELLED && booking.status !== BookingStatus.VOIDED) {
               if (isUpcoming) {
                   alerts.push({
                      id: `fin-${booking.id}`,
                      title: 'ذمم مالية',
                      message: `متبقي ${remaining.toFixed(2)} ${systemCurrency} على العميل ${booking.clientName} (ملف ${booking.fileNo || booking.id}).`,
                      type: 'warning',
                      date: new Date().toISOString(),
                      category: 'Finance',
                      linkPage: NavPage.BOOKINGS
                  });
               }
          }

          // 2. PASSPORT CHECK
          if (booking.status === BookingStatus.CONFIRMED && isUpcoming && travelDate <= nextWeek) {
              const missingPassports = booking.passengers.filter(p => !p.passportSubmitted).length;
              if (missingPassports > 0) {
                   alerts.push({
                      id: `pp-${booking.id}`,
                      title: 'جوازات سفر ناقصة',
                      message: `يوجد ${missingPassports} جوازات غير مستلمة لرحلة ${booking.clientName} المغادرة في ${travelDate.toLocaleDateString('en-GB')}.`,
                      type: 'warning',
                      date: new Date().toISOString(),
                      category: 'Booking',
                      linkPage: NavPage.BOOKINGS
                  });
              }
          }
      });

      const sortedAlerts = alerts.sort((a, b) => {
          const priority = { 'critical': 0, 'warning': 1, 'info': 2 };
          return priority[a.type] - priority[b.type];
      });

      setSmartAlerts(sortedAlerts.slice(0, 20));
  };

  // --- INITIALIZATION ---
  useEffect(() => {
      // Check for saved user
      const savedUser = localStorage.getItem('hawana_current_user');
      if (savedUser) {
          try {
              setCurrentUser(JSON.parse(savedUser));
          } catch (e) {
              localStorage.removeItem('hawana_current_user');
          }
      }
      // Generate alerts from mock data initially
      generateSmartAlerts(bookings);
  }, []); 

  useEffect(() => { 
      localStorage.setItem('hawana_system_currency', systemCurrency); 
  }, [systemCurrency]);

  useEffect(() => {
      localStorage.setItem('hawana_exchange_rates', JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  // Sync "All" states with "Paginated" states in offline mode
  useEffect(() => {
      setAllBookings(bookings);
      generateSmartAlerts(bookings);
  }, [bookings]);

  useEffect(() => {
      setAllTransactions(transactions);
  }, [transactions]);


  // --- FUNCTIONS IMPLEMENTATION (OFFLINE) ---

  const addAuditLog = (action: string, details: string, entityType: AuditLogEntry['entityType']) => {
      const newLog: AuditLogEntry = {
          id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          action,
          details,
          entityType,
          performedBy: currentUser ? currentUser.username : 'System',
          timestamp: new Date().toISOString()
      };
      setAuditLogs(prev => [newLog, ...prev]);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    // Check against local/mock users
    const user = users.find(u => u.username === username && u.password === password && u.isActive);
    if (user) {
        setCurrentUser(user);
        localStorage.setItem('hawana_current_user', JSON.stringify(user));
        addAuditLog('LOGIN', `تسجيل دخول ناجح: ${username}`, 'System');
        return true;
    }
    return false;
  };

  const logout = () => {
    addAuditLog('LOGOUT', `تسجيل خروج: ${currentUser?.username}`, 'System');
    setCurrentUser(null);
    localStorage.removeItem('hawana_current_user');
  };

  // --- BOOKING OPERATIONS ---
  const fetchBookings = (page: number, search = '', filters: any = {}) => {
      // Client-side pagination and filtering
      setBookingsPage(page);
      let filtered = [...allBookings]; // Use full dataset source

      if (search) {
          const lowerSearch = search.toLowerCase();
          filtered = filtered.filter(b => 
              b.clientName.toLowerCase().includes(lowerSearch) || 
              (b.fileNo && b.fileNo.toLowerCase().includes(lowerSearch)) ||
              b.destination.toLowerCase().includes(lowerSearch)
          );
      }
      if (filters.type) filtered = filtered.filter(b => b.type === filters.type);
      if (filters.dateFrom) filtered = filtered.filter(b => b.date >= filters.dateFrom);
      if (filters.dateTo) filtered = filtered.filter(b => b.date <= filters.dateTo);

      setBookingsTotal(filtered.length);
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      setBookings(filtered.slice(start, end));
  };

  const addBooking = (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const tempId = `B${Date.now()}`;
    const newBooking: Booking = {
      ...bookingData,
      id: tempId,
      paidAmount: bookingData.paidAmount || 0,
      createdAt: new Date().toISOString(),
      createdBy: currentUser ? currentUser.name : 'System', 
    };
    
    setBookings(prev => [newBooking, ...prev]);
    setAllBookings(prev => [newBooking, ...prev]);

    // Update Client Balance
    const client = clients.find(c => c.name === newBooking.clientName);
    if (client) {
        updateClient(client.id, { balance: client.balance + newBooking.amount });
    } else {
        addClient({
            name: newBooking.clientName,
            type: 'Individual',
            balance: newBooking.amount,
            phone: newBooking.clientPhone, 
            email: ''
        });
    }
    addAuditLog('ADD_BOOKING', `إنشاء ملف حجز جديد: ${newBooking.fileNo || tempId}`, 'Booking');
  };

  const updateBooking = (id: string, updatedData: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } : b));
    setAllBookings(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } : b));
    addAuditLog('UPDATE_BOOKING', `تحديث بيانات الحجز: ${id}`, 'Booking');
  };

  const deleteBooking = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    setAllBookings(prev => prev.filter(b => b.id !== id));
    addAuditLog('DELETE_BOOKING', `حذف ملف حجز: ${id}`, 'Booking');
  };

  const updateBookingStatus = (id: string, status: BookingStatus) => {
    updateBooking(id, { status });
    addAuditLog('UPDATE_STATUS', `تغيير حالة الحجز ${id} إلى ${status}`, 'Booking');
  };

  const addBookingPayment = (bookingId: string, payment: Payment) => {
      const booking = bookings.find(b => b.id === bookingId);
      if(!booking) return;

      const updatedPayments = [...(booking.payments || []), payment];
      const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.finalAmount, 0);
      const newStatus = newTotalPaid >= (booking.amount - 0.01) ? 'Paid' : newTotalPaid > 0 ? 'Partial' : 'Unpaid';

      updateBooking(bookingId, {
          paidAmount: newTotalPaid,
          paymentStatus: newStatus,
          payments: updatedPayments
      });

      const client = clients.find(c => c.name === booking.clientName);
      if (client) {
          updateClient(client.id, { balance: client.balance - payment.finalAmount });
      }

      if(payment.treasuryId) {
          updateTreasuryBalance(payment.treasuryId, payment.finalAmount, TransactionType.INCOME);
      }

      addTransaction({
          description: `دفعة حجز من: ${booking.clientName} - ملف ${booking.fileNo || booking.id}`,
          amount: payment.finalAmount,
          date: payment.date,
          type: TransactionType.INCOME,
          category: 'مقبوضات حجوزات',
          referenceNo: payment.id,
          treasuryId: payment.treasuryId
      }, false); // don't double update treasury
  };

  // --- TRANSACTION OPERATIONS ---
  const fetchTransactions = (page: number, search = '', filters: any = {}) => {
      setTransactionsPage(page);
      let filtered = [...allTransactions];

      if (search) {
          const lowerSearch = search.toLowerCase();
          filtered = filtered.filter(t => t.description.toLowerCase().includes(lowerSearch));
      }
      if (filters.treasuryId && filters.treasuryId !== 'ALL') {
          filtered = filtered.filter(t => t.treasuryId === filters.treasuryId);
      }

      setTransactionsTotal(filtered.length);
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      setTransactions(filtered.slice(start, end));
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id'>, updateTreasury: boolean = true) => {
    const tempId = `T${Date.now()}`;
    const newTransaction: Transaction = {
      ...transactionData,
      id: tempId,
      createdBy: currentUser ? currentUser.name : 'System', 
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    setAllTransactions(prev => [newTransaction, ...prev]);

    if(updateTreasury && transactionData.treasuryId) {
         updateTreasuryBalance(transactionData.treasuryId, transactionData.amount, transactionData.type);
    }
    addAuditLog('ADD_TRANSACTION', `تسجيل حركة مالية: ${newTransaction.description} - ${newTransaction.amount}`, 'Transaction');
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      setAllTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      addAuditLog('UPDATE_TRANSACTION', `تعديل حركة مالية: ${id}`, 'Transaction');
  };

  const deleteTransaction = (id: string) => {
    const trans = transactions.find(t => t.id === id);
    if (trans && trans.treasuryId) {
        // Reverse Balance logic
        const reverseType = trans.type === TransactionType.INCOME ? TransactionType.EXPENSE : TransactionType.INCOME;
        updateTreasuryBalance(trans.treasuryId, trans.amount, reverseType);
        
        // Reverse Client/Agent balance if applicable
        if ((trans.category === 'مقبوضات عملاء' || trans.category === 'مقبوضات حجوزات') && trans.type === TransactionType.INCOME) {
            const clientMatch = clients.find(c => trans.description.includes(c.name));
            if (clientMatch) updateClient(clientMatch.id, { balance: clientMatch.balance + trans.amount });
        }
        if (trans.category === 'دفعات موردين' && trans.type === TransactionType.EXPENSE) {
            const agentMatch = agents.find(a => trans.description.includes(a.name));
            if (agentMatch) updateAgent(agentMatch.id, { balance: agentMatch.balance + trans.amount });
        }
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
    setAllTransactions(prev => prev.filter(t => t.id !== id));
    addAuditLog('DELETE_TRANSACTION', `حذف حركة مالية: ${id}`, 'Transaction');
  };

  const transferTransaction = (transactionId: string, newTreasuryId: string) => {
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction || !transaction.treasuryId || transaction.treasuryId === newTreasuryId) return;

      const oldTreasuryId = transaction.treasuryId;
      const amount = transaction.amount;
      const type = transaction.type;

      // Update Balances
      const reverseType = type === TransactionType.INCOME ? TransactionType.EXPENSE : TransactionType.INCOME;
      updateTreasuryBalance(oldTreasuryId, amount, reverseType);
      updateTreasuryBalance(newTreasuryId, amount, type);

      // Update Transaction
      updateTransaction(transactionId, { treasuryId: newTreasuryId });
      addAuditLog('TRANSFER_TRANSACTION', `نقل حركة ${transactionId} من صندوق لآخر`, 'Transaction');
      showNotification('تم نقل الحركة وتحديث الأرصدة بنجاح', 'success');
  };

  // --- ENTITY OPERATIONS ---

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: `U${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('ADD_USER', `إضافة مستخدم جديد: ${userData.username}`, 'System');
  };
  const updateUser = (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    if (currentUser && currentUser.id === id) {
        setCurrentUser({ ...currentUser, ...data });
    }
    addAuditLog('UPDATE_USER', `تحديث بيانات مستخدم: ${id}`, 'System');
  };
  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    addAuditLog('DELETE_USER', `حذف مستخدم: ${id}`, 'System');
  };

  const updateTreasuryBalance = (treasuryId: string, amountJOD: number, type: TransactionType) => {
    setTreasury(prev => prev.map(t => {
        if (t.id !== treasuryId) return t;
        const newBalance = type === TransactionType.INCOME ? t.balance + amountJOD : t.balance - amountJOD;
        return { ...t, balance: newBalance };
    }));
  };

  const addAgent = (data: Omit<Agent, 'id'>) => {
    setAgents(prev => [...prev, { ...data, id: `A${Date.now()}` }]);
    addAuditLog('ADD_AGENT', `إضافة وكيل: ${data.name}`, 'Agent');
  };
  const updateAgent = (id: string, data: Partial<Agent>) => {
      setAgents(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };
  const deleteAgent = (id: string) => {
      setAgents(prev => prev.filter(a => a.id !== id));
  };
  const addAgentPayment = (agentId: string, amount: number, treasuryId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) { updateAgent(agentId, { balance: agent.balance - amount }); }
    updateTreasuryBalance(treasuryId, amount, TransactionType.EXPENSE);
    if(agent) {
      addTransaction({
        description: `دفعة للمورد: ${agent.name}`,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        type: TransactionType.EXPENSE,
        category: 'دفعات موردين',
        treasuryId: treasuryId
      }, false);
    }
  };

  const addClient = (data: Omit<Client, 'id'>) => {
    setClients(prev => [...prev, { ...data, id: `C${Date.now()}` }]);
    addAuditLog('ADD_CLIENT', `إضافة عميل: ${data.name}`, 'Client');
  };
  const updateClient = (id: string, data: Partial<Client>) => {
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };
  const deleteClient = (id: string) => {
      setClients(prev => prev.filter(c => c.id !== id));
  };
  const addClientPayment = (clientId: string, amount: number, treasuryId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) { updateClient(clientId, { balance: client.balance - amount }); }
    updateTreasuryBalance(treasuryId, amount, TransactionType.INCOME);
    if(client) {
      addTransaction({
        description: `سند قبض من العميل: ${client.name}`,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        type: TransactionType.INCOME,
        category: 'مقبوضات عملاء',
        treasuryId: treasuryId
      }, false);
    }
  };

  const addTreasury = (data: Omit<Treasury, 'id'>) => {
      setTreasury(prev => [...prev, { ...data, id: `TR${Date.now()}` }]);
  };
  const updateTreasury = (id: string, data: Partial<Treasury>) => {
      setTreasury(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  };
  const deleteTreasury = (id: string) => {
      setTreasury(prev => prev.filter(t => t.id !== id));
  };

  // Other features (Itineraries, Tasks, Inventory) - Simple CRUD
  const addItinerary = (data: any) => setItineraries(prev => [{...data, id:`I${Date.now()}`}, ...prev]);
  const deleteItinerary = (id: string) => setItineraries(prev => prev.filter(i => i.id !== id));
  
  const addTask = (data: any) => setTasks(prev => [{...data, id:`TSK${Date.now()}`}, ...prev]);
  const updateTask = (id: string, data: any) => setTasks(prev => prev.map(t => t.id === id ? {...t, ...data} : t));
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const addInventory = (data: any) => setInventory(prev => [{...data, id:`INV-${Date.now()}`}, ...prev]);
  const updateInventory = (id: string, data: any) => setInventory(prev => prev.map(i => i.id === id ? {...i, ...data} : i));
  const deleteInventory = (id: string) => setInventory(prev => prev.filter(i => i.id !== id));
  
  const getInventoryStats = (id: string) => {
      const item = inventory.find(i => i.id === id);
      if (!item) return { sold: 0, remaining: 0 };
      let sold = 0;
      allBookings.forEach(b => {
          if (b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.VOIDED) {
              b.services.forEach(s => {
                  if (s.inventoryId === id) {
                      if (item.type === 'Hotel' || s.type === 'Hotel') {
                          sold += (s.roomCount || 1);
                      } else {
                          sold += s.quantity;
                      }
                  }
              });
          }
      });
      return { sold, remaining: item.totalQuantity - sold };
  };

  const updateExchangeRate = (currency: Currency, rate: number) => {
      setExchangeRates(prev => ({ ...prev, [currency]: rate }));
  };

  const convertAmount = (amountInJOD: number) => {
      if (systemCurrency === 'JOD') return amountInJOD;
      const rate = exchangeRates[systemCurrency];
      return amountInJOD * rate;
  };

  const convertCurrency = (amount: number, from: Currency, to: Currency) => {
      if (from === to) return amount;
      const rateFrom = exchangeRates[from];
      const rateTo = exchangeRates[to];
      const amountInJOD = amount / rateFrom;
      return amountInJOD * rateTo;
  };

  const getExchangeRate = () => {
      return exchangeRates[systemCurrency] || 1;
  };

  // Stats calculation
  const stats = {
    totalSales: allBookings.reduce((acc, curr) => acc + curr.amount, 0),
    totalPaid: allBookings.reduce((acc, curr) => acc + curr.paidAmount, 0),
    totalPending: allBookings.reduce((acc, curr) => acc + (curr.amount - curr.paidAmount), 0),
    bookingsCount: allBookings.length,
    totalExpenses: allTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, curr) => acc + curr.amount, 0)
  };

  return (
    <DataContext.Provider value={{
      bookings, transactions, allBookings, allTransactions, agents, clients, treasury, users, currentUser, isDbConnected,
      bookingsPage, bookingsTotal, fetchBookings,
      transactionsPage, transactionsTotal, fetchTransactions,
      itineraries, tasks, inventory, auditLogs,
      companySettings, updateCompanySettings,
      theme, toggleTheme, language, toggleLanguage, t,
      login, logout,
      addUser, updateUser, deleteUser,
      addBooking, updateBooking, deleteBooking, updateBookingStatus, addBookingPayment,
      addTransaction, updateTransaction, deleteTransaction, transferTransaction,
      addAgent, updateAgent, deleteAgent, addAgentPayment,
      addClient, updateClient, deleteClient, addClientPayment,
      addTreasury, updateTreasury, deleteTreasury,
      addItinerary, deleteItinerary,
      addTask, updateTask, deleteTask,
      addInventory, updateInventory, deleteInventory, getInventoryStats,
      addAuditLog,
      systemCurrency, exchangeRates, setSystemCurrency, updateExchangeRate, convertAmount, getExchangeRate, convertCurrency,
      notification, showNotification, smartAlerts,
      stats
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
