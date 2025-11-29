import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking, Transaction, DataContextType, BookingStatus, TransactionType, Currency, Agent, Client, Notification, Treasury, Payment, User, CompanySettings, SmartAlert, NavPage, Theme, Itinerary, Task, AuditLogEntry, Language, InventoryItem } from '../types';
import { MOCK_BOOKINGS, MOCK_TRANSACTIONS, MOCK_AGENTS, MOCK_CLIENTS, MOCK_TREASURY, MOCK_USERS, TRANSLATIONS, MOCK_INVENTORY } from '../constants';
import { supabase } from '../services/supabaseClient';

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- DEMO MODE CONFIGURATION ---
// Set this to TRUE to run without Supabase (Local State Only)
const DEMO_MODE = true; 

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
  logoVisibility: 'both',
  alertSettings: {
      enableFinancialAlerts: true,
      financialAlertDays: 3,
      enablePassportAlerts: true,
      passportAlertDays: 7,
      enableFlightAlerts: true,
      flightAlertDays: 1,
      enableHotelAlerts: true,
      hotelAlertDays: 1
  }
};

const PAGE_SIZE = 25;

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- AUTH STATE ---
  const [users, setUsers] = useState<User[]>(MOCK_USERS); 
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Data State (Paginated for Table)
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsTotal, setBookingsTotal] = useState(0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotal, setTransactionsTotal] = useState(0);

  // Full Data State (For Calculations/Reports)
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [treasury, setTreasury] = useState<Treasury[]>([]);
  
  // New Feature States
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]); // NEW
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

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
    let settings = saved ? JSON.parse(saved) : DEFAULT_COMPANY_SETTINGS;
    if (!settings.alertSettings) settings.alertSettings = DEFAULT_COMPANY_SETTINGS.alertSettings;
    return settings;
  });

  const updateCompanySettings = (settings: CompanySettings) => {
    setCompanySettings(settings);
    localStorage.setItem('hawana_company_settings', JSON.stringify(settings));
    addAuditLog('UPDATE_SETTINGS', 'تم تحديث إعدادات النظام', 'System');
    generateSmartAlerts(allBookings, settings);
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
  const generateSmartAlerts = (bookingsData: Booking[], currentSettings: CompanySettings = companySettings) => {
      const alerts: SmartAlert[] = [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const alertPrefs = currentSettings.alertSettings || DEFAULT_COMPANY_SETTINGS.alertSettings!;

      const getTargetDate = (days: number) => {
          const d = new Date(today);
          d.setDate(today.getDate() + days);
          return d;
      };

      const financialThresholdDate = getTargetDate(alertPrefs.financialAlertDays || 3);
      const passportThresholdDate = getTargetDate(alertPrefs.passportAlertDays || 7);
      const flightThresholdDate = getTargetDate(alertPrefs.flightAlertDays || 1);
      const hotelThresholdDate = getTargetDate(alertPrefs.hotelAlertDays || 1);

      bookingsData.forEach(booking => {
          const travelDate = new Date(booking.date);
          const isUpcoming = travelDate >= today;

          // 1. URGENT FINANCIAL CHECK
          if (alertPrefs?.enableFinancialAlerts) {
              const remaining = booking.amount - booking.paidAmount;
              if (isUpcoming && travelDate <= financialThresholdDate && remaining > 0.01 && booking.status === BookingStatus.CONFIRMED) {
                  alerts.push({
                      id: `fin-urgent-${booking.id}`,
                      title: 'تنبيه مالي عاجل',
                      message: `العميل ${booking.clientName} يسافر خلال ${alertPrefs.financialAlertDays} أيام (${travelDate.toLocaleDateString('en-GB')}) وعليه ذمة ${remaining.toFixed(2)} ${systemCurrency}.`,
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
          }

          // 2. PASSPORT CHECK
          if (alertPrefs?.enablePassportAlerts && booking.status === BookingStatus.CONFIRMED && isUpcoming && travelDate <= passportThresholdDate) {
              const missingPassports = booking.passengers.filter(p => !p.passportSubmitted).length;
              if (missingPassports > 0) {
                   alerts.push({
                      id: `pp-${booking.id}`,
                      title: 'جوازات سفر ناقصة',
                      message: `يوجد ${missingPassports} جوازات غير مستلمة لرحلة ${booking.clientName} المغادرة خلال ${alertPrefs.passportAlertDays} أيام.`,
                      type: 'warning',
                      date: new Date().toISOString(),
                      category: 'Booking',
                      linkPage: NavPage.BOOKINGS
                  });
              }
          }

          // 3. SERVICE CHECKS
          booking.services.forEach(service => {
              if (alertPrefs?.enableFlightAlerts && service.type === 'Flight' && service.flightDate && booking.status === BookingStatus.CONFIRMED) {
                  const flightDate = new Date(service.flightDate);
                  const fDateOnly = new Date(flightDate.getFullYear(), flightDate.getMonth(), flightDate.getDate());
                  if (fDateOnly.getTime() === flightThresholdDate.getTime()) {
                       alerts.push({
                          id: `flight-${service.id}`,
                          title: 'تذكير موعد رحلة',
                          message: `رحلة ${service.airline || 'طيران'} (${service.route || '-'}) للعميل ${booking.clientName} بتاريخ ${service.flightDate} الساعة ${service.departureTime || 'غير محدد'}.`,
                          type: 'info',
                          date: new Date().toISOString(),
                          category: 'Flight',
                          linkPage: NavPage.BOOKINGS
                      });
                  }
              }
              if (alertPrefs?.enableHotelAlerts && service.type === 'Hotel' && service.checkIn && booking.status === BookingStatus.CONFIRMED) {
                  const checkInDate = new Date(service.checkIn);
                  const cDateOnly = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
                  if (cDateOnly.getTime() === hotelThresholdDate.getTime()) {
                       alerts.push({
                          id: `hotel-${service.id}`,
                          title: 'تذكير دخول فندق',
                          message: `موعد دخول فندق ${service.hotelName} للعميل ${booking.clientName} بتاريخ ${service.checkIn}.`,
                          type: 'info',
                          date: new Date().toISOString(),
                          category: 'Booking',
                          linkPage: NavPage.BOOKINGS
                      });
                  }
              }
          });
      });

      const sortedAlerts = alerts.sort((a, b) => {
          const priority = { 'critical': 0, 'warning': 1, 'info': 2 };
          return priority[a.type] - priority[b.type];
      });

      setSmartAlerts(sortedAlerts.slice(0, 20)); 
  };

  // --- MOCK DATA LOADER (For Demo Mode) ---
  const loadMockData = () => {
        setBookings(MOCK_BOOKINGS);
        setTransactions(MOCK_TRANSACTIONS);
        setAllBookings(MOCK_BOOKINGS);
        setAllTransactions(MOCK_TRANSACTIONS);
        setAgents(MOCK_AGENTS);
        setClients(MOCK_CLIENTS);
        setTreasury(MOCK_TREASURY);
        setUsers(MOCK_USERS);
        setInventory(MOCK_INVENTORY);
        
        setBookingsTotal(MOCK_BOOKINGS.length);
        setTransactionsTotal(MOCK_TRANSACTIONS.length);
        
        generateSmartAlerts(MOCK_BOOKINGS);
        setIsDbConnected(true); // Treat Demo Mode as "Connected"
  };

  // --- FETCH FUNCTIONS ---
  // In DEMO_MODE, these filter in-memory arrays instead of calling API
  
  const fetchBookings = async (page: number, search = '', filters: any = {}) => {
      setBookingsPage(page);
      
      if (DEMO_MODE) {
          let filtered = [...allBookings];
          if (search) {
              const s = search.toLowerCase();
              filtered = filtered.filter(b => 
                  b.clientName.toLowerCase().includes(s) || 
                  (b.fileNo && b.fileNo.toLowerCase().includes(s)) ||
                  b.destination.toLowerCase().includes(s)
              );
          }
          if (filters.dateFrom) filtered = filtered.filter(b => b.date >= filters.dateFrom);
          if (filters.dateTo) filtered = filtered.filter(b => b.date <= filters.dateTo);
          if (filters.type) filtered = filtered.filter(b => b.type === filters.type);

          setBookingsTotal(filtered.length);
          const from = (page - 1) * PAGE_SIZE;
          setBookings(filtered.slice(from, from + PAGE_SIZE));
          return;
      }

      // Real Supabase Fetching (Ignored in Demo Mode)
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
          .from('bookings')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

      if (search) query = query.or(`client_name.ilike.%${search}%,file_no.ilike.%${search}%,destination.ilike.%${search}%`);
      if (filters.dateFrom) query = query.gte('date', filters.dateFrom);
      if (filters.dateTo) query = query.lte('date', filters.dateTo);
      if (filters.type) query = query.eq('type', filters.type);

      const { data, count, error } = await query;
      if (!error && data) {
          const mappedBookings: Booking[] = data.map((b: any) => ({
                ...b,
                clientName: b.client_name,
                clientPhone: b.client_phone,
                fileNo: b.file_no,
                paidAmount: b.paid_amount,
                paymentStatus: b.payment_status,
                serviceCount: b.service_count,
                createdBy: b.created_by,
                createdAt: b.created_at,
                passengers: b.passengers || [],
                services: b.services || [],
                payments: b.payments || []
          }));
          setBookings(mappedBookings);
          if (count !== null) setBookingsTotal(count);
      }
  };

  const fetchTransactions = async (page: number, search = '', filters: any = {}) => {
      setTransactionsPage(page);

      if (DEMO_MODE) {
          let filtered = [...allTransactions];
          if (search) {
              const s = search.toLowerCase();
              filtered = filtered.filter(t => 
                  t.description.toLowerCase().includes(s) || 
                  (t.referenceNo && t.referenceNo.toLowerCase().includes(s))
              );
          }
          if (filters.treasuryId && filters.treasuryId !== 'ALL') {
              filtered = filtered.filter(t => t.treasuryId === filters.treasuryId);
          }
          if (filters.type) filtered = filtered.filter(t => t.type === filters.type);

          setTransactionsTotal(filtered.length);
          const from = (page - 1) * PAGE_SIZE;
          setTransactions(filtered.slice(from, from + PAGE_SIZE));
          return;
      }

      // Real Supabase Logic (Ignored in Demo)
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
          .from('transactions')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

      if (search) {
          query = query.or(`description.ilike.%${search}%,reference_no.ilike.%${search}%`);
      }
      
      if (filters.treasuryId && filters.treasuryId !== 'ALL') {
          query = query.eq('treasury_id', filters.treasuryId);
      }
      
      if (filters.type) {
          query = query.eq('type', filters.type);
      }

      const { data, count, error } = await query;

      if (!error && data) {
          const mappedTrans: Transaction[] = data.map((t: any) => ({
              ...t,
              referenceNo: t.reference_no,
              treasuryId: t.treasury_id,
              exchangeRate: t.exchange_rate,
              checkDetails: t.check_details,
              createdBy: t.created_by
          }));
          setTransactions(mappedTrans);
          if (count !== null) setTransactionsTotal(count);
      }
  };

  // INITIAL LOAD
  useEffect(() => {
      const savedUser = localStorage.getItem('hawana_current_user');
      if (savedUser) {
          try { setCurrentUser(JSON.parse(savedUser)); } catch (e) { localStorage.removeItem('hawana_current_user'); }
      }

      if (DEMO_MODE) {
          loadMockData();
      } else {
          // Attempt real DB connection logic would go here
          // For now, we fallback if DB fails inside existing logic
          fetchBookings(1);
          fetchTransactions(1);
      }
  }, []); 

  // Sync Currency/Rates to LocalStorage
  useEffect(() => { localStorage.setItem('hawana_system_currency', systemCurrency); }, [systemCurrency]);
  useEffect(() => { localStorage.setItem('hawana_exchange_rates', JSON.stringify(exchangeRates)); }, [exchangeRates]);

  const addAuditLog = (action: string, details: string, entityType: AuditLogEntry['entityType']) => {
      const newLog: AuditLogEntry = {
          id: `LOG-${Date.now()}`,
          action,
          details,
          entityType,
          performedBy: currentUser ? currentUser.username : 'System',
          timestamp: new Date().toISOString()
      };
      setAuditLogs(prev => [newLog, ...prev]);
      
      if (!DEMO_MODE) {
          supabase.from('audit_logs').insert([{
              id: newLog.id, action, details, entity_type: entityType, performed_by: newLog.performedBy, timestamp: newLog.timestamp
          }]);
      }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    if (DEMO_MODE) {
        const user = users.find(u => u.username === username && u.password === password && u.isActive);
        if (user) {
            setCurrentUser(user);
            localStorage.setItem('hawana_current_user', JSON.stringify(user));
            return true;
        }
        return false;
    }
    // ... Real Login Logic ...
    // Simplified for demo override
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hawana_current_user');
  };

  // --- CRUD WRAPPERS ---
  // All functions below handle Local State + (Supabase if !DEMO_MODE)

  const addUser = async (userData: Omit<User, 'id'>) => {
    const tempId = `U${Date.now()}`;
    const newUser: User = { ...userData, id: tempId };
    setUsers(prev => [...prev, newUser]);
    if (!DEMO_MODE) { /* supabase insert */ }
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    if (currentUser && currentUser.id === id) {
        const updatedUser = { ...currentUser, ...data };
        setCurrentUser(updatedUser);
        localStorage.setItem('hawana_current_user', JSON.stringify(updatedUser));
    }
    if (!DEMO_MODE) { /* supabase update */ }
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (!DEMO_MODE) { /* supabase delete */ }
  };

  const updateTreasuryBalance = async (treasuryId: string, amountJOD: number, type: TransactionType) => {
    const t = treasury.find(tr => tr.id === treasuryId);
    if (!t) return;
    const newBalance = type === TransactionType.INCOME ? t.balance + amountJOD : t.balance - amountJOD;
    setTreasury(prev => prev.map(tr => tr.id === treasuryId ? { ...tr, balance: newBalance } : tr));
    if (!DEMO_MODE) { /* supabase update */ }
  };

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const tempId = `B${Date.now()}`;
    const newBooking: Booking = {
      ...bookingData,
      id: tempId,
      paidAmount: bookingData.paidAmount || 0,
      createdAt: new Date().toISOString(),
      createdBy: currentUser ? currentUser.name : 'System', 
    };
    
    // Update Local State (Paginated & Full)
    setBookings(prev => [newBooking, ...prev]);
    setAllBookings(prev => [newBooking, ...prev]);
    setBookingsTotal(prev => prev + 1);

    // Update Client Balance Locally
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

    if (!DEMO_MODE) { 
        // Supabase Insert logic...
    }
  };

  const updateBooking = async (id: string, updatedData: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } : b));
    setAllBookings(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } : b));
    addAuditLog('UPDATE_BOOKING', `تحديث حجز: ${id}`, 'Booking');
    if (!DEMO_MODE) { /* supabase update */ }
  };

  const deleteBooking = async (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    setAllBookings(prev => prev.filter(b => b.id !== id));
    setBookingsTotal(prev => prev - 1);
    addAuditLog('DELETE_BOOKING', `حذف حجز: ${id}`, 'Booking');
    if (!DEMO_MODE) { /* supabase delete */ }
  };

  const updateBookingStatus = async (id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    setAllBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (!DEMO_MODE) { /* supabase update */ }
  };

  const addBookingPayment = (bookingId: string, payment: Payment) => {
      const booking = allBookings.find(b => b.id === bookingId);
      if(!booking) return;

      const existingPayments = booking.payments || [];
      const updatedPayments = [...existingPayments, payment];
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
      }, false);
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
    setTransactionsTotal(prev => prev + 1);

    if(updateTreasury && transactionData.treasuryId) {
         updateTreasuryBalance(transactionData.treasuryId, transactionData.amount, transactionData.type);
    }
    addAuditLog('ADD_TRANSACTION', `تسجيل حركة مالية: ${newTransaction.amount}`, 'Transaction');

    if (!DEMO_MODE) { /* supabase insert */ }
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      setAllTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      if (!DEMO_MODE) { /* supabase update */ }
  };

  const deleteTransaction = async (id: string) => {
    const trans = allTransactions.find(t => t.id === id);
    // Reverse Balance Logic (Local)
    if (trans) {
        if ((trans.category === 'مقبوضات عملاء' || trans.category === 'مقبوضات حجوزات') && trans.type === TransactionType.INCOME) {
            const clientMatch = clients.find(c => trans.description.includes(c.name));
            if (clientMatch) updateClient(clientMatch.id, { balance: clientMatch.balance + trans.amount });
        }
        if (trans.category === 'دفعات موردين' && trans.type === TransactionType.EXPENSE) {
            const agentMatch = agents.find(a => trans.description.includes(a.name));
            if (agentMatch) updateAgent(agentMatch.id, { balance: agentMatch.balance + trans.amount });
        }
        if (trans.treasuryId) {
            const reverseType = trans.type === TransactionType.INCOME ? TransactionType.EXPENSE : TransactionType.INCOME;
            updateTreasuryBalance(trans.treasuryId, trans.amount, reverseType);
        }
    }

    setTransactions(prev => prev.filter(t => t.id !== id));
    setAllTransactions(prev => prev.filter(t => t.id !== id));
    setTransactionsTotal(prev => prev - 1);
    
    if (!DEMO_MODE) { /* supabase delete */ }
  };

  const transferTransaction = async (transactionId: string, newTreasuryId: string) => {
      const transaction = allTransactions.find(t => t.id === transactionId);
      if (!transaction || !transaction.treasuryId || transaction.treasuryId === newTreasuryId) return;

      const oldTreasuryId = transaction.treasuryId;
      const amount = transaction.amount;
      const type = transaction.type;

      // Update Local Balances
      const reverseType = type === TransactionType.INCOME ? TransactionType.EXPENSE : TransactionType.INCOME;
      updateTreasuryBalance(oldTreasuryId, amount, reverseType);
      updateTreasuryBalance(newTreasuryId, amount, type);

      // Update Transaction Record
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, treasuryId: newTreasuryId } : t));
      setAllTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, treasuryId: newTreasuryId } : t));

      showNotification('تم نقل الحركة وتحديث الأرصدة بنجاح', 'success');
      if (!DEMO_MODE) { /* supabase update */ }
  };

  // Basic CRUD for Agents, Clients, Treasury, Itinerary, Tasks, Inventory
  const addAgent = async (agentData: Omit<Agent, 'id'>) => {
    const tempId = `A${Date.now()}`;
    setAgents(prev => [...prev, { ...agentData, id: tempId }]);
    if (!DEMO_MODE) { /* db insert */ }
  };
  const updateAgent = async (id: string, data: Partial<Agent>) => {
      setAgents(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
      if (!DEMO_MODE) { /* db update */ }
  };
  const deleteAgent = async (id: string) => {
      setAgents(prev => prev.filter(a => a.id !== id));
      if (!DEMO_MODE) { /* db delete */ }
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

  const addClient = async (clientData: Omit<Client, 'id'>) => {
    const tempId = `C${Date.now()}`;
    setClients(prev => [...prev, { ...clientData, id: tempId }]);
    if (!DEMO_MODE) { /* db insert */ }
  };
  const updateClient = async (id: string, data: Partial<Client>) => {
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      if (!DEMO_MODE) { /* db update */ }
  };
  const deleteClient = async (id: string) => {
      setClients(prev => prev.filter(c => c.id !== id));
      if (!DEMO_MODE) { /* db delete */ }
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

  const addTreasury = async (data: Omit<Treasury, 'id'>) => {
      const tempId = `TR${Date.now()}`;
      setTreasury(prev => [...prev, { ...data, id: tempId }]);
      if (!DEMO_MODE) { /* db insert */ }
  };
  const updateTreasury = async (id: string, data: Partial<Treasury>) => {
      setTreasury(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      if (!DEMO_MODE) { /* db update */ }
  };
  const deleteTreasury = async (id: string) => {
      setTreasury(prev => prev.filter(t => t.id !== id));
      if (!DEMO_MODE) { /* db delete */ }
  };

  const addItinerary = async (data: Omit<Itinerary, 'id' | 'createdAt' | 'createdBy'>) => {
      const tempId = `I${Date.now()}`;
      const newItinerary = { ...data, id: tempId, createdAt: new Date().toISOString(), createdBy: currentUser ? currentUser.username : 'System' };
      setItineraries(prev => [newItinerary, ...prev]);
      if (!DEMO_MODE) { /* db insert */ }
  };
  const deleteItinerary = async (id: string) => {
      setItineraries(prev => prev.filter(i => i.id !== id));
      if (!DEMO_MODE) { /* db delete */ }
  };

  const addTask = async (data: Omit<Task, 'id'>) => {
      const tempId = `TSK${Date.now()}`;
      setTasks(prev => [{ ...data, id: tempId }, ...prev]);
      if (!DEMO_MODE) { /* db insert */ }
  };
  const updateTask = async (id: string, data: Partial<Task>) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      if (!DEMO_MODE) { /* db update */ }
  };
  const deleteTask = async (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
      if (!DEMO_MODE) { /* db delete */ }
  };

  const addInventory = async (data: Omit<InventoryItem, 'id'>) => {
      const tempId = `inv-${Date.now()}`;
      setInventory(prev => [...prev, { ...data, id: tempId }]);
      if (!DEMO_MODE) { /* db insert */ }
  };
  const updateInventory = async (id: string, data: Partial<InventoryItem>) => {
      setInventory(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
      // Update linked bookings if prices changed (Local logic is complex, simplifying for Demo)
      if (data.costPrice !== undefined || data.sellingPrice !== undefined) {
          // Simplified: In demo mode we might skip retroactive price updates or implement basic mapping
      }
      if (!DEMO_MODE) { /* db update */ }
  };
  const deleteInventory = async (id: string) => {
      setInventory(prev => prev.filter(i => i.id !== id));
      if (!DEMO_MODE) { /* db delete */ }
  };

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

  // Stats now use ALL data
  const stats = {
    totalSales: allBookings.reduce((acc, curr) => acc + curr.amount, 0),
    totalPaid: allBookings.reduce((acc, curr) => acc + curr.paidAmount, 0),
    totalPending: allBookings.reduce((acc, curr) => acc + (curr.amount - curr.paidAmount), 0),
    bookingsCount: bookingsTotal, // Total count from DB
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