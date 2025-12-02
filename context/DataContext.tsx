
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking, Transaction, DataContextType, BookingStatus, TransactionType, Currency, Agent, Client, Notification, Treasury, Payment, User, CompanySettings, SmartAlert, NavPage, Theme, Itinerary, Task, AuditLogEntry, Language, InventoryItem } from '../types';
import { MOCK_BOOKINGS, MOCK_TRANSACTIONS, MOCK_AGENTS, MOCK_CLIENTS, MOCK_TREASURY, MOCK_USERS, MOCK_INVENTORY, TRANSLATIONS } from '../constants';
import { supabase } from '../services/supabaseClient';
import { supabaseConfig } from '../supabaseConfig';

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
  logoVisibility: 'both',
  alertSettings: {
      enableFinancialAlerts: true,
      financialAlertDays: 3, // Default 3 days
      enablePassportAlerts: true,
      passportAlertDays: 7,  // Default 7 days
      enableFlightAlerts: true,
      flightAlertDays: 1,    // Default 1 day
      enableHotelAlerts: true,
      hotelAlertDays: 1      // Default 1 day
  },
  whatsappTemplate: `مرحباً {client_name}،
إليك تفاصيل حجزك مع {company_name}:
رقم الملف: {file_no}
الوجهة: {destination}
التاريخ: {date}
المبلغ المتبقي: {remaining_amount}

للاستفسار: {company_phone}`,
  contractTemplate: `1. تعتبر تذاكر الطيران غير قابلة للاسترداد أو التغيير إلا وفقاً لشروط شركة الطيران، وقد يترتب على ذلك غرامات مالية.
2. الشركة غير مسؤولة عن رفض التأشيرات من قبل السفارات، ولا تسترد رسوم التأشيرة في حال الرفض.
3. مواعيد الدخول للفنادق (Check-in) الساعة 14:00 والمغادرة (Check-out) الساعة 12:00 ظهراً، ما لم يذكر خلاف ذلك.
4. يجب على العميل التأكد من صلاحية جواز السفر لمدة لا تقل عن 6 أشهر قبل السفر.
5. الشركة غير مسؤولة عن أي تأخير أو إلغاء للرحلات من قبل شركات الطيران أو ظروف قاهرة.
6. في حال إلغاء الحجز من قبل العميل، تطبق غرامات الإلغاء حسب سياسة الفندق أو المورد.
7. توقيع العميل على هذا المستند يعتبر إقراراً بالموافقة على كافة تفاصيل الحجز والشروط المذكورة أعلاه.`
};

const PAGE_SIZE = 25;

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- AUTH STATE ---
  const [users, setUsers] = useState<User[]>([]); 
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
    // Ensure alertSettings exists for backward compatibility
    if (!settings.alertSettings) {
        settings.alertSettings = DEFAULT_COMPANY_SETTINGS.alertSettings;
    }
    // Ensure alert settings have default days if migrated
    if (settings.alertSettings.financialAlertDays === undefined) settings.alertSettings.financialAlertDays = 3;
    if (settings.alertSettings.passportAlertDays === undefined) settings.alertSettings.passportAlertDays = 7;
    if (settings.alertSettings.flightAlertDays === undefined) settings.alertSettings.flightAlertDays = 1;
    if (settings.alertSettings.hotelAlertDays === undefined) settings.alertSettings.hotelAlertDays = 1;
    
    // Ensure whatsappTemplate exists
    if (!settings.whatsappTemplate) settings.whatsappTemplate = DEFAULT_COMPANY_SETTINGS.whatsappTemplate;
    // Ensure contractTemplate exists
    if (!settings.contractTemplate) settings.contractTemplate = DEFAULT_COMPANY_SETTINGS.contractTemplate;

    return settings;
  });

  const updateCompanySettings = (settings: CompanySettings) => {
    setCompanySettings(settings);
    localStorage.setItem('hawana_company_settings', JSON.stringify(settings));
    addAuditLog('UPDATE_SETTINGS', 'تم تحديث إعدادات النظام', 'System');
    // Re-generate alerts based on new settings
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

      // Helper to calculate target date based on user settings
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

          // 1. URGENT FINANCIAL CHECK (Travel soon + Unpaid)
          if (alertPrefs?.enableFinancialAlerts) {
              const remaining = booking.amount - booking.paidAmount;
              // Alert if travel date is within the configured threshold
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
              // General Debt Alert (if not urgent but unpaid) - Kept simple for general overview
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

          // 3. SERVICE-SPECIFIC CHECKS (Flights & Hotels)
          booking.services.forEach(service => {
              // Flight Alert
              if (alertPrefs?.enableFlightAlerts && service.type === 'Flight' && service.flightDate && booking.status === BookingStatus.CONFIRMED) {
                  const flightDate = new Date(service.flightDate);
                  const fDateOnly = new Date(flightDate.getFullYear(), flightDate.getMonth(), flightDate.getDate());
                  
                  // Exact match on the specific reminder day (e.g., exactly 1 day before)
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
              
              // Hotel Check-in Alert
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

      // Sort alerts: Critical first, then Warning, then Info
      const sortedAlerts = alerts.sort((a, b) => {
          const priority = { 'critical': 0, 'warning': 1, 'info': 2 };
          return priority[a.type] - priority[b.type];
      });

      setSmartAlerts(sortedAlerts.slice(0, 20)); // Show top 20 relevant alerts
  };

  // --- FETCH FUNCTIONS (FULL DATA FOR CALCULATIONS) ---
  const fetchAllData = async () => {
      if (!isDbConnected) return;

      // 1. Fetch All Bookings (For Reports & Inventory Stats)
      const { data: allB, error: bError } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });
      
      if (!bError && allB) {
          const mappedAllB: Booking[] = allB.map((b: any) => ({
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
          setAllBookings(mappedAllB);
          
          // Generate Alerts based on fresh data
          generateSmartAlerts(mappedAllB);
      }

      // 2. Fetch All Transactions (For Reports & Stats)
      const { data: allT, error: tError } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

      if (!tError && allT) {
          const mappedAllT: Transaction[] = allT.map((t: any) => ({
              ...t,
              referenceNo: t.reference_no,
              treasuryId: t.treasury_id,
              exchangeRate: t.exchange_rate,
              checkDetails: t.check_details,
              createdBy: t.created_by
          }));
          setAllTransactions(mappedAllT);
      }
  };

  // --- FETCH FUNCTIONS (PAGINATED) ---
  const isDemoMode = supabaseConfig.supabaseUrl === 'https://placeholder.supabase.co';

  const fetchBookings = async (page: number, search = '', filters: any = {}) => {
      setBookingsPage(page);
      
      if (isDemoMode) {
          // Handle Mock Data Pagination & Filtering
          let filtered = [...MOCK_BOOKINGS];
          
          if (search) {
              const lowerSearch = search.toLowerCase();
              filtered = filtered.filter(b => 
                  b.clientName.toLowerCase().includes(lowerSearch) || 
                  (b.fileNo && b.fileNo.toLowerCase().includes(lowerSearch)) ||
                  b.destination.toLowerCase().includes(lowerSearch)
              );
          }
          if (filters.dateFrom) filtered = filtered.filter(b => b.date >= filters.dateFrom);
          if (filters.dateTo) filtered = filtered.filter(b => b.date <= filters.dateTo);
          if (filters.type) filtered = filtered.filter(b => b.type === filters.type);

          // Pagination
          const from = (page - 1) * PAGE_SIZE;
          const to = from + PAGE_SIZE;
          const paginated = filtered.slice(from, to);

          setBookings(paginated);
          setBookingsTotal(filtered.length);
          return;
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
          .from('bookings')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

      if (search) {
          query = query.or(`client_name.ilike.%${search}%,file_no.ilike.%${search}%,destination.ilike.%${search}%`);
      }

      if (filters.dateFrom) {
          query = query.gte('date', filters.dateFrom);
      }
      if (filters.dateTo) {
          query = query.lte('date', filters.dateTo);
      }
      if (filters.type) {
          query = query.eq('type', filters.type);
      }

      const { data, count, error } = await query;

      if (error) {
          console.error('Error fetching bookings:', error);
      } else {
          if (data) {
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
          }
          if (count !== null) setBookingsTotal(count);
      }
  };

  const fetchTransactions = async (page: number, search = '', filters: any = {}) => {
      setTransactionsPage(page);

      if (isDemoMode) {
          // Handle Mock Data Pagination & Filtering
          let filtered = [...MOCK_TRANSACTIONS];

          if (search) {
              const lowerSearch = search.toLowerCase();
              filtered = filtered.filter(t => 
                  t.description.toLowerCase().includes(lowerSearch) || 
                  (t.referenceNo && t.referenceNo.toLowerCase().includes(lowerSearch))
              );
          }
          if (filters.treasuryId && filters.treasuryId !== 'ALL') {
              filtered = filtered.filter(t => t.treasuryId === filters.treasuryId);
          }
          if (filters.type) {
              filtered = filtered.filter(t => t.type === filters.type);
          }

          const from = (page - 1) * PAGE_SIZE;
          const to = from + PAGE_SIZE;
          const paginated = filtered.slice(from, to);

          setTransactions(paginated);
          setTransactionsTotal(filtered.length);
          return;
      }

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

      if (error) {
          console.error('Error fetching transactions:', error);
      } else {
          if (data) {
              const mappedTrans: Transaction[] = data.map((t: any) => ({
                  ...t,
                  referenceNo: t.reference_no,
                  treasuryId: t.treasury_id,
                  exchangeRate: t.exchange_rate,
                  checkDetails: t.check_details,
                  createdBy: t.created_by
              }));
              setTransactions(mappedTrans);
          }
          if (count !== null) setTransactionsTotal(count);
      }
  };

  useEffect(() => {
      const savedUser = localStorage.getItem('hawana_current_user');
      if (savedUser) {
          try {
              setCurrentUser(JSON.parse(savedUser));
          } catch (e) {
              localStorage.removeItem('hawana_current_user');
          }
      }

      const fetchData = async () => {
        if (isDemoMode) {
            setIsDbConnected(false);
            // Load Mocks directly
            setBookings(MOCK_BOOKINGS);
            setBookingsTotal(MOCK_BOOKINGS.length);
            
            setTransactions(MOCK_TRANSACTIONS);
            setTransactionsTotal(MOCK_TRANSACTIONS.length);
            
            setAllBookings(MOCK_BOOKINGS);
            setAllTransactions(MOCK_TRANSACTIONS);
            
            setAgents(MOCK_AGENTS);
            setClients(MOCK_CLIENTS);
            setTreasury(MOCK_TREASURY);
            setUsers(MOCK_USERS);
            setInventory(MOCK_INVENTORY || []);
            setTasks([]);
            setItineraries([]);
            
            generateSmartAlerts(MOCK_BOOKINGS);
            return;
        }

        try {
            // Fetch Lookups
            let { data: treasuryData } = await supabase.from('treasury').select('*');
            if (treasuryData) setTreasury(treasuryData);

            let { data: clientsData } = await supabase.from('clients').select('*');
            if (clientsData) setClients(clientsData);

            let { data: agentsData } = await supabase.from('agents').select('*');
            if (agentsData) setAgents(agentsData);
            
            // Fetch Paginated Data Initial Load
            await fetchBookings(1);
            await fetchTransactions(1);

            // Fetch All Data for Calculations
            const { data: allB } = await supabase.from('bookings').select('*');
            if(allB) {
                 const mappedAllB: Booking[] = allB.map((b: any) => ({
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
                setAllBookings(mappedAllB);
                // Generate Alerts for the first time
                generateSmartAlerts(mappedAllB);
            }

            const { data: allT } = await supabase.from('transactions').select('*');
            if(allT) {
                const mappedAllT: Transaction[] = allT.map((t: any) => ({
                    ...t,
                    referenceNo: t.reference_no,
                    treasuryId: t.treasury_id,
                    exchangeRate: t.exchange_rate,
                    checkDetails: t.check_details,
                    createdBy: t.created_by
                }));
                setAllTransactions(mappedAllT);
            }

            const { data: usersData } = await supabase.from('profiles').select('*');
            if (usersData) {
                const mappedUsers: User[] = usersData.map((u: any) => ({
                    id: u.id,
                    username: u.username,
                    name: u.full_name,
                    role: u.role,
                    isActive: u.is_active,
                    permissions: u.permissions || []
                }));
                setUsers(mappedUsers);
            }

            const { data: itinData } = await supabase.from('itineraries').select('*').order('created_at', { ascending: false });
            if (itinData) {
               const mappedItin: Itinerary[] = itinData.map((i: any) => ({
                   ...i,
                   clientName: i.client_name,
                   createdAt: i.created_at,
                   createdBy: i.created_by
               }));
               setItineraries(mappedItin);
            }

            const { data: taskData } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
            if (taskData) {
                const mappedTasks: Task[] = taskData.map((t: any) => ({
                    ...t,
                    dueDate: t.due_date,
                    assignedTo: t.assigned_to
                }));
                setTasks(mappedTasks);
            }

            const { data: invData } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
            if (invData) {
                const mappedInv: InventoryItem[] = invData.map((i: any) => ({
                    ...i,
                    totalQuantity: i.totalQuantity,
                    costPrice: i.costPrice,
                    sellingPrice: i.sellingPrice,
                    expiryDate: i.expiryDate,
                    roomType: i.roomType,
                    checkIn: i.checkIn,
                    checkOut: i.checkOut,
                    airline: i.airline,
                    flightDate: i.flightDate,
                    returnDate: i.returnDate,
                    departureTime: i.departureTime, 
                    arrivalTime: i.arrivalTime, 
                    route: i.route,
                    country: i.country,
                    visaType: i.visaType,
                    vehicleType: i.vehicleType
                }));
                setInventory(mappedInv);
            }

            setIsDbConnected(true);

        } catch (error: any) {
            console.error('Critical Error fetching data from Supabase:', error.message || error);
            setIsDbConnected(false);
            showNotification('فشل الاتصال بقاعدة البيانات - تم تفعيل الوضع التجريبي', 'error');
            
            setBookings(MOCK_BOOKINGS);
            setTransactions(MOCK_TRANSACTIONS);
            setAllBookings(MOCK_BOOKINGS); // Fallback
            setAllTransactions(MOCK_TRANSACTIONS); // Fallback
            setAgents(MOCK_AGENTS);
            setClients(MOCK_CLIENTS);
            setTreasury(MOCK_TREASURY);
            setUsers(MOCK_USERS);
            setTasks([]);
            setItineraries([]);
            
            // Mock alerts
            generateSmartAlerts(MOCK_BOOKINGS);
        }
      };

      fetchData();
  }, []); 

  useEffect(() => { 
      localStorage.setItem('hawana_system_currency', systemCurrency); 
  }, [systemCurrency]);

  useEffect(() => {
      localStorage.setItem('hawana_exchange_rates', JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  const addAuditLog = (action: string, details: string, entityType: AuditLogEntry['entityType']) => {
      const newLog: AuditLogEntry = {
          id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          action,
          details,
          entityType,
          performedBy: currentUser ? currentUser.username : 'System',
          timestamp: new Date().toISOString()
      };
      // Optimistic Update
      setAuditLogs(prev => [newLog, ...prev]);
      
      // Fire and Forget
      if (isDbConnected) {
          supabase.from('audit_logs').insert([{
              id: newLog.id,
              action, 
              details, 
              entity_type: entityType, 
              performed_by: newLog.performedBy, 
              timestamp: newLog.timestamp
          }]).then(({ error }) => {
              if(error) {
                  console.warn("Background Audit Log Failed:", error.message);
              }
          }).catch(err => {
              console.warn("Network error logging audit:", err);
          });
      }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
        if (isDbConnected) {
            const { data: usersData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .eq('password', password); 
            
            if (!error && usersData && usersData.length > 0) {
                const user = usersData[0];
                if (user.is_active) {
                    const mappedUser: User = {
                        id: user.id,
                        username: user.username,
                        name: user.full_name,
                        role: user.role,
                        isActive: user.is_active,
                        permissions: user.permissions || []
                    };
                    setCurrentUser(mappedUser);
                    localStorage.setItem('hawana_current_user', JSON.stringify(mappedUser));
                    addAuditLog('LOGIN', `تسجيل دخول ناجح للمستخدم: ${username}`, 'System');
                    return true;
                }
            }
        }
    } catch (e) {
        console.log("Supabase login failed, checking mocks...");
    }

    const user = users.find(u => u.username === username && u.password === password && u.isActive);
    if (user) {
        setCurrentUser(user);
        localStorage.setItem('hawana_current_user', JSON.stringify(user));
        addAuditLog('LOGIN', `تسجيل دخول ناجح (Mock): ${username}`, 'System');
        return true;
    }
    return false;
  };

  const logout = () => {
    addAuditLog('LOGOUT', `تسجيل خروج: ${currentUser?.username}`, 'System');
    setCurrentUser(null);
    localStorage.removeItem('hawana_current_user');
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    const tempId = `U${Date.now()}`;
    const newUser: User = { ...userData, id: tempId };
    setUsers(prev => [...prev, newUser]);

    if (isDbConnected) {
        const { data, error } = await supabase.from('profiles').insert([{
            id: tempId,
            username: userData.username,
            password: userData.password, 
            full_name: userData.name,
            role: userData.role,
            is_active: userData.isActive,
            permissions: userData.permissions
        }]).select();

        if (error) {
            console.error("DB Error:", JSON.stringify(error, null, 2));
            showNotification('فشل حفظ المستخدم في قاعدة البيانات (تحقق من الصلاحيات)', 'error');
        } else if (data) {
            setUsers(prev => prev.map(u => u.id === tempId ? { ...u, id: data[0].id } : u));
        }
    }
    addAuditLog('ADD_USER', `إضافة مستخدم جديد: ${userData.username}`, 'System');
  };

  const updateUser = async (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    if (currentUser && currentUser.id === id) {
        const updatedUser = { ...currentUser, ...data };
        setCurrentUser(updatedUser);
        localStorage.setItem('hawana_current_user', JSON.stringify(updatedUser));
    }
    
    if (isDbConnected) {
        const dbData: any = {};
        if (data.name) dbData.full_name = data.name;
        if (data.username) dbData.username = data.username;
        if (data.password) dbData.password = data.password; 
        if (data.role) dbData.role = data.role;
        if (data.isActive !== undefined) dbData.is_active = data.isActive;
        if (data.permissions) dbData.permissions = data.permissions;

        await supabase.from('profiles').update(dbData).eq('id', id);
    }
    addAuditLog('UPDATE_USER', `تحديث بيانات مستخدم: ${id}`, 'System');
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (isDbConnected) {
        await supabase.from('profiles').delete().eq('id', id);
    }
    addAuditLog('DELETE_USER', `حذف مستخدم: ${id}`, 'System');
  };

  const updateTreasuryBalance = async (treasuryId: string, amountJOD: number, type: TransactionType) => {
    const t = treasury.find(tr => tr.id === treasuryId);
    if (!t) return;

    const newBalance = type === TransactionType.INCOME 
        ? t.balance + amountJOD 
        : t.balance - amountJOD;

    setTreasury(prev => prev.map(tr => tr.id === treasuryId ? { ...tr, balance: newBalance } : tr));

    if (isDbConnected) {
        await supabase.from('treasury').update({ balance: newBalance }).eq('id', treasuryId);
    }
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
    
    setBookings(prev => [newBooking, ...prev]);
    // Also update allBookings for local state consistency
    setAllBookings(prev => [newBooking, ...prev]);

    if (isDbConnected) {
        const { error } = await supabase.from('bookings').insert([{
            id: tempId,
            file_no: newBooking.fileNo,
            client_name: newBooking.clientName,
            client_phone: newBooking.clientPhone,
            destination: newBooking.destination,
            date: newBooking.date,
            type: newBooking.type,
            status: newBooking.status,
            payment_status: newBooking.paymentStatus,
            amount: newBooking.amount,
            paid_amount: newBooking.paidAmount,
            cost: newBooking.cost,
            profit: newBooking.profit,
            service_count: newBooking.serviceCount,
            passengers: newBooking.passengers,
            services: newBooking.services,
            payments: newBooking.payments,
            notes: newBooking.notes,
            created_by: newBooking.createdBy
        }]);

        if (error) {
            console.error("Error adding booking", JSON.stringify(error, null, 2));
            showNotification('فشل حفظ الحجز في قاعدة البيانات. تحقق من الاتصال.', 'error');
            setBookings(prev => prev.filter(b => b.id !== tempId));
            setAllBookings(prev => prev.filter(b => b.id !== tempId));
        } else {
            fetchBookings(1);
            // fetchAllData() is expensive, avoid if possible or optimize
        }
    } else {
        // In Demo Mode, just update local state which is already done optimistically
        setBookingsTotal(prev => prev + 1);
    }

    const client = clients.find(c => c.name === newBooking.clientName);
    if (!client) {
        addClient({
            name: newBooking.clientName,
            type: 'Individual',
            balance: 0, 
            phone: newBooking.clientPhone,
            email: ''
        });
    }
    
    addAuditLog('ADD_BOOKING', `إنشاء ملف حجز جديد: ${newBooking.fileNo || tempId} للعميل ${newBooking.clientName}`, 'Booking');
  };

  const updateBooking = async (id: string, updatedData: Partial<Booking>) => {
    const oldBooking = bookings.find(b => b.id === id);
    const changes: string[] = [];
    if (oldBooking) {
        if (updatedData.amount !== undefined && Math.abs(updatedData.amount - oldBooking.amount) > 0.01) {
            changes.push(`تعديل إجمالي البيع من ${oldBooking.amount.toFixed(2)} إلى ${updatedData.amount.toFixed(2)}`);
        }
        if (updatedData.status && updatedData.status !== oldBooking.status) {
            changes.push(`تغيير الحالة من ${oldBooking.status} إلى ${updatedData.status}`);
        }
    }

    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } : b));
    setAllBookings(prev => prev.map(b => b.id === id ? { ...b, ...updatedData } : b));
    
    if (isDbConnected) {
        const dbData: any = {};
        if (updatedData.paidAmount !== undefined) dbData.paid_amount = updatedData.paidAmount;
        if (updatedData.paymentStatus) dbData.payment_status = updatedData.paymentStatus;
        if (updatedData.payments) dbData.payments = updatedData.payments;
        if (updatedData.amount) dbData.amount = updatedData.amount;
        if (updatedData.cost !== undefined) dbData.cost = updatedData.cost; 
        if (updatedData.profit !== undefined) dbData.profit = updatedData.profit; 
        if (updatedData.passengers) dbData.passengers = updatedData.passengers;
        if (updatedData.services) dbData.services = updatedData.services;
        if (updatedData.status) dbData.status = updatedData.status;
        if (updatedData.date) dbData.date = updatedData.date;
        if (updatedData.clientName) dbData.client_name = updatedData.clientName;
        if (updatedData.clientPhone) dbData.client_phone = updatedData.clientPhone;
        if (updatedData.destination) dbData.destination = updatedData.destination;
        if (updatedData.fileNo) dbData.file_no = updatedData.fileNo;
        if (updatedData.type) dbData.type = updatedData.type;
        if (updatedData.notes) dbData.notes = updatedData.notes;
        if (updatedData.serviceCount !== undefined) dbData.service_count = updatedData.serviceCount;
        
        const { error } = await supabase.from('bookings').update(dbData).eq('id', id);
        if (error) {
            showNotification('فشل تحديث الحجز في قاعدة البيانات', 'error');
            console.error(error);
        }
    }
    
    const logDetail = changes.length > 0 ? changes.join(' | ') : `تحديث بيانات الحجز: ${id}`;
    addAuditLog('UPDATE_BOOKING', logDetail, 'Booking');
  };

  const deleteBooking = async (id: string) => {
    const deletedBooking = bookings.find(b => b.id === id);
    setBookings(prev => prev.filter(b => b.id !== id));
    setAllBookings(prev => prev.filter(b => b.id !== id));
    if (isDbConnected) {
        await supabase.from('bookings').delete().eq('id', id);
    } else {
        setBookingsTotal(prev => prev - 1);
    }
    addAuditLog('DELETE_BOOKING', `حذف ملف حجز رقم: ${deletedBooking?.fileNo || id}`, 'Booking');
  };

  const updateBookingStatus = async (id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    setAllBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    if (isDbConnected) {
        await supabase.from('bookings').update({ status }).eq('id', id);
    }
    addAuditLog('UPDATE_STATUS', `تغيير حالة الحجز ${id} إلى ${status}`, 'Booking');
  };

  const addBookingPayment = (bookingId: string, payment: Payment) => {
      const booking = bookings.find(b => b.id === bookingId);
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

      addAuditLog('ADD_PAYMENT', `إضافة دفعة مالية للحجز ${bookingId} بقيمة ${payment.finalAmount}`, 'Booking');
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
    
    if (isDbConnected) {
        const { error } = await supabase.from('transactions').insert([{
            id: tempId,
            reference_no: newTransaction.referenceNo,
            description: newTransaction.description,
            amount: newTransaction.amount,
            date: newTransaction.date,
            type: newTransaction.type,
            category: newTransaction.category,
            currency: newTransaction.currency,
            exchange_rate: newTransaction.exchangeRate,
            treasury_id: newTransaction.treasuryId,
            check_details: newTransaction.checkDetails,
            created_by: newTransaction.createdBy
        }]);

        if (error) {
            console.error(error);
            showNotification('فشل حفظ المعاملة المالية', 'error');
            setTransactions(prev => prev.filter(t => t.id !== tempId));
            setAllTransactions(prev => prev.filter(t => t.id !== tempId));
        } else {
            fetchTransactions(1);
        }
    } else {
        setTransactionsTotal(prev => prev + 1);
    }

    if(updateTreasury && transactionData.treasuryId) {
            updateTreasuryBalance(transactionData.treasuryId, transactionData.amount, transactionData.type);
    }
    addAuditLog('ADD_TRANSACTION', `تسجيل حركة مالية: ${newTransaction.description} - ${newTransaction.amount}`, 'Transaction');
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
      const oldTrans = transactions.find(t => t.id === id);
      if (!oldTrans) return;

      const newTrans = { ...oldTrans, ...data };
      
      const oldTid = oldTrans.treasuryId;
      const newTid = newTrans.treasuryId;
      const oldAmt = oldTrans.amount;
      const newAmt = newTrans.amount;
      const oldType = oldTrans.type;
      const newType = newTrans.type;

      // Check if critical financial fields changed
      const isFinancialChange = 
          oldTid !== newTid || 
          Math.abs(oldAmt - newAmt) > 0.001 || 
          oldType !== newType;

      if (isFinancialChange) {
          setTreasury(prevTreasury => {
              // Create a map for easier updates
              const treasuryMap = new Map<string, Treasury>(prevTreasury.map(t => [t.id, { ...t }]));

              // 1. Revert Old Effect
              if (oldTid && treasuryMap.has(oldTid)) {
                  const t = treasuryMap.get(oldTid)!;
                  if (oldType === TransactionType.INCOME) {
                      t.balance -= oldAmt;
                  } else {
                      t.balance += oldAmt;
                  }
              }

              // 2. Apply New Effect
              if (newTid && treasuryMap.has(newTid)) {
                  const t = treasuryMap.get(newTid)!;
                  if (newType === TransactionType.INCOME) {
                      t.balance += newAmt;
                  } else {
                      t.balance -= newAmt;
                  }
              }

              // Convert back to array
              return Array.from(treasuryMap.values());
          });

          // Sync Treasury changes to DB
          if (isDbConnected) {
              const currentTreasuryMap = new Map<string, number>(treasury.map(t => [t.id, t.balance]));
              
              if (oldTid && currentTreasuryMap.has(oldTid)) {
                  let b = currentTreasuryMap.get(oldTid)!;
                  b = oldType === TransactionType.INCOME ? b - oldAmt : b + oldAmt;
                  currentTreasuryMap.set(oldTid, b);
              }
              
              if (newTid && currentTreasuryMap.has(newTid)) {
                  let b = currentTreasuryMap.get(newTid)!;
                  b = newType === TransactionType.INCOME ? b + newAmt : b - newAmt;
                  currentTreasuryMap.set(newTid, b);
              }

              const affectedTreasuries = new Set([oldTid, newTid].filter(Boolean));
              for (const tid of affectedTreasuries) {
                  if (tid) {
                      const newBal = currentTreasuryMap.get(tid);
                      if (newBal !== undefined) {
                          await supabase.from('treasury').update({ balance: newBal }).eq('id', tid);
                      }
                  }
              }
          }
      }

      setTransactions(prev => prev.map(t => t.id === id ? newTrans : t));
      setAllTransactions(prev => prev.map(t => t.id === id ? newTrans : t));
      
      if (isDbConnected) {
          const dbData: any = {
              description: newTrans.description,
              category: newTrans.category,
              amount: newTrans.amount,
              date: newTrans.date,
              reference_no: newTrans.referenceNo,
              treasury_id: newTrans.treasuryId,
              type: newTrans.type,
              currency: newTrans.currency,
              exchange_rate: newTrans.exchangeRate
          };

          await supabase.from('transactions').update(dbData).eq('id', id);
      }

      addAuditLog('UPDATE_TRANSACTION', `تعديل حركة مالية: ${id}`, 'Transaction');
  };

  const deleteTransaction = async (id: string) => {
    const trans = transactions.find(t => t.id === id);
    
    setTransactions(prev => prev.filter(t => t.id !== id));
    setAllTransactions(prev => prev.filter(t => t.id !== id));
    
    if (isDbConnected) {
        await supabase.from('transactions').delete().eq('id', id);
    } else {
        setTransactionsTotal(prev => prev - 1);
    }

    if (trans && trans.treasuryId) {
        const reverseType = trans.type === TransactionType.INCOME ? TransactionType.EXPENSE : TransactionType.INCOME;
        updateTreasuryBalance(trans.treasuryId, trans.amount, reverseType);
    }
    addAuditLog('DELETE_TRANSACTION', `حذف حركة مالية: ${id} (${trans?.amount || 0})`, 'Transaction');
  };

  const transferTransaction = async (transactionId: string, newTreasuryId: string) => {
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction || !transaction.treasuryId || transaction.treasuryId === newTreasuryId) return;

      const oldTreasuryId = transaction.treasuryId;
      const amount = transaction.amount;
      const type = transaction.type;

      const reverseType = type === TransactionType.INCOME ? TransactionType.EXPENSE : TransactionType.INCOME;
      updateTreasuryBalance(oldTreasuryId, amount, reverseType);
      
      updateTreasuryBalance(newTreasuryId, amount, type);

      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, treasuryId: newTreasuryId } : t));
      setAllTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, treasuryId: newTreasuryId } : t));

      if (isDbConnected) {
          await supabase.from('transactions').update({ treasury_id: newTreasuryId }).eq('id', transactionId);
      }

      const oldName = treasury.find(t => t.id === oldTreasuryId)?.name;
      const newName = treasury.find(t => t.id === newTreasuryId)?.name;
      addAuditLog('TRANSFER_TRANSACTION', `نقل حركة ${transactionId} من [${oldName}] إلى [${newName}]`, 'Transaction');
      
      showNotification('تم نقل الحركة وتحديث الأرصدة بنجاح', 'success');
  };

  const addAgent = async (agentData: Omit<Agent, 'id'>) => {
    const tempId = `A${Date.now()}`;
    const newAgent: Agent = { ...agentData, id: tempId };
    setAgents(prev => [...prev, newAgent]);
    
    if (isDbConnected) {
        const { error } = await supabase.from('agents').insert([{
            id: tempId,
            name: newAgent.name,
            type: newAgent.type,
            phone: newAgent.phone,
            email: newAgent.email,
            balance: newAgent.balance,
            notes: newAgent.notes,
            currency: newAgent.currency
        }]);
        if(error) { showNotification('فشل حفظ الوكيل', 'error'); setAgents(prev => prev.filter(a => a.id !== tempId)); } 
    }
    addAuditLog('ADD_AGENT', `إضافة وكيل جديد: ${newAgent.name}`, 'Agent'); 
  };
  const updateAgent = async (id: string, data: Partial<Agent>) => {
      setAgents(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
      if (isDbConnected) {
          await supabase.from('agents').update(data).eq('id', id);
      }
      addAuditLog('UPDATE_AGENT', `تحديث بيانات وكيل: ${id}`, 'Agent');
  };
  const deleteAgent = async (id: string) => {
      setAgents(prev => prev.filter(a => a.id !== id));
      if (isDbConnected) {
          await supabase.from('agents').delete().eq('id', id);
      }
      addAuditLog('DELETE_AGENT', `حذف وكيل: ${id}`, 'Agent');
  };
  const addAgentPayment = (agentId: string, amount: number, treasuryId: string) => {
    const agent = agents.find(a => a.id === agentId);
    
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
    const newClient: Client = { ...clientData, id: tempId };
    setClients(prev => [...prev, newClient]);
    
    if (isDbConnected) {
        const { error } = await supabase.from('clients').insert([{
            id: tempId,
            name: newClient.name,
            type: newClient.type,
            phone: newClient.phone,
            email: newClient.email,
            balance: newClient.balance,
            limit: newClient.limit,
            notes: newClient.notes
        }]);
        if(error) { showNotification('فشل حفظ العميل', 'error'); setClients(prev => prev.filter(c => c.id !== tempId)); }
    }
    addAuditLog('ADD_CLIENT', `إضافة عميل جديد: ${newClient.name}`, 'Client');
  };
  const updateClient = async (id: string, data: Partial<Client>) => {
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      if (isDbConnected) {
          await supabase.from('clients').update({ name: data.name, balance: data.balance, phone: data.phone, email: data.email, limit: data.limit }).eq('id', id);
      }
      addAuditLog('UPDATE_CLIENT', `تحديث بيانات عميل: ${id}`, 'Client');
  };
  const deleteClient = async (id: string) => {
      setClients(prev => prev.filter(c => c.id !== id));
      if (isDbConnected) {
          await supabase.from('clients').delete().eq('id', id);
      }
      addAuditLog('DELETE_CLIENT', `حذف عميل: ${id}`, 'Client');
  };
  const addClientPayment = (clientId: string, amount: number, treasuryId: string, date?: string) => {
    const client = clients.find(c => c.id === clientId);
    const paymentDate = date || new Date().toISOString().split('T')[0];
    
    updateTreasuryBalance(treasuryId, amount, TransactionType.INCOME);
    if(client) {
      addTransaction({
        description: `سند قبض من العميل: ${client.name}`,
        amount: amount,
        date: paymentDate,
        type: TransactionType.INCOME,
        category: 'مقبوضات عملاء',
        treasuryId: treasuryId
      }, false);
    }
  };

  const addTreasury = async (data: Omit<Treasury, 'id'>) => {
      const tempId = `TR${Date.now()}`;
      const newTreasury: Treasury = { ...data, id: tempId };
      setTreasury(prev => [...prev, newTreasury]);
      
      if (isDbConnected) {
          const { error } = await supabase.from('treasury').insert([{ id: tempId, name: newTreasury.name, type: newTreasury.type, balance: newTreasury.balance, currency: newTreasury.currency, account_number: newTreasury.accountNumber }]);
          if (error) { showNotification('فشل حفظ الحساب المالي', 'error'); setTreasury(prev => prev.filter(t => t.id !== tempId)); }
      }
      addAuditLog('ADD_TREASURY', `إضافة حساب خزينة: ${newTreasury.name}`, 'System');
  };
  const updateTreasury = async (id: string, data: Partial<Treasury>) => {
      setTreasury(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      if (isDbConnected) {
          await supabase.from('treasury').update({ name: data.name, balance: data.balance, account_number: data.accountNumber }).eq('id', id);
      }
      addAuditLog('UPDATE_TREASURY', `تحديث حساب خزينة: ${id}`, 'System');
  };
  const deleteTreasury = async (id: string) => {
      setTreasury(prev => prev.filter(t => t.id !== id));
      if (isDbConnected) {
          await supabase.from('treasury').delete().eq('id', id);
      }
      addAuditLog('DELETE_TREASURY', `حذف حساب خزينة: ${id}`, 'System');
  };

  const addItinerary = async (data: Omit<Itinerary, 'id' | 'createdAt' | 'createdBy'>) => {
      const tempId = `I${Date.now()}`;
      const newItinerary: Itinerary = { ...data, id: tempId, createdAt: new Date().toISOString(), createdBy: currentUser ? currentUser.username : 'System' };
      setItineraries(prev => [newItinerary, ...prev]);
      if (isDbConnected) {
          await supabase.from('itineraries').insert([{ id: tempId, title: newItinerary.title, client_name: newItinerary.clientName, destination: newItinerary.destination, duration: newItinerary.duration, price: newItinerary.price, currency: newItinerary.currency, days: newItinerary.days, inclusions: newItinerary.inclusions, exclusions: newItinerary.exclusions, created_by: newItinerary.createdBy }]);
      }
      addAuditLog('ADD_ITINERARY', `إنشاء عرض سعر سياحي: ${newItinerary.title}`, 'Itinerary');
  };
  const deleteItinerary = async (id: string) => {
      setItineraries(prev => prev.filter(i => i.id !== id));
      if (isDbConnected) {
          await supabase.from('itineraries').delete().eq('id', id);
      }
      addAuditLog('DELETE_ITINERARY', `حذف عرض سعر: ${id}`, 'Itinerary');
  };

  const addTask = async (data: Omit<Task, 'id'>) => {
      const tempId = `TSK${Date.now()}`;
      const newTask: Task = { ...data, id: tempId };
      setTasks(prev => [newTask, ...prev]);
      if (isDbConnected) {
          await supabase.from('tasks').insert([{ id: tempId, title: newTask.title, description: newTask.description, due_date: newTask.dueDate, priority: newTask.priority, status: newTask.status, assigned_to: newTask.assignedTo }]);
      }
      addAuditLog('ADD_TASK', `إضافة مهمة جديدة: ${newTask.title}`, 'Task');
  };
  const updateTask = async (id: string, data: Partial<Task>) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      if (isDbConnected) {
          await supabase.from('tasks').update({ title: data.title, description: data.description, due_date: data.dueDate, priority: data.priority, status: data.status, assigned_to: data.assignedTo }).eq('id', id);
      }
      addAuditLog('UPDATE_TASK', `تحديث مهمة: ${id}`, 'Task');
  };
  const deleteTask = async (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
      if (isDbConnected) {
          await supabase.from('tasks').delete().eq('id', id);
      }
      addAuditLog('DELETE_TASK', `حذف مهمة: ${id}`, 'Task');
  };

  const addInventory = async (data: Omit<InventoryItem, 'id'>) => {
      const tempId = `inv-${Date.now()}`;
      const newItem: InventoryItem = { ...data, id: tempId };
      setInventory(prev => [...prev, newItem]);
      
      if (isDbConnected) {
          const { error } = await supabase.from('inventory').insert([newItem]); 
          if(error) { console.error("Inventory Add Error:", error); showNotification("فشل إضافة المخزون", "error"); } 
      }
      addAuditLog('ADD_INVENTORY', `إضافة عنصر مخزون: ${newItem.name}`, 'Inventory');
  };

  const updateInventory = async (id: string, data: Partial<InventoryItem>) => {
      setInventory(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
      if (isDbConnected) {
          await supabase.from('inventory').update(data).eq('id', id);
      }
      addAuditLog('UPDATE_INVENTORY', `تحديث عنصر مخزون: ${id}`, 'Inventory');

      if (data.costPrice !== undefined || data.sellingPrice !== undefined) {
          const bookingsToUpdate = allBookings.filter(b => 
              b.services.some(s => s.inventoryId === id)
          );

          if (bookingsToUpdate.length > 0) {
              for (const booking of bookingsToUpdate) {
                  const updatedServices = booking.services.map(s => {
                      if (s.inventoryId === id) {
                          return {
                              ...s,
                              costPrice: data.costPrice !== undefined ? Number(data.costPrice) : s.costPrice,
                              sellingPrice: data.sellingPrice !== undefined ? Number(data.sellingPrice) : s.sellingPrice
                          };
                      }
                      return s;
                  });

                  let newTotalCostJOD = 0;
                  updatedServices.forEach(s => {
                      const qty = s.quantity || 0;
                      const costRate = exchangeRates[s.costCurrency || 'JOD'] || 1;
                      const itemCostJOD = (Number(s.costPrice) * qty) / costRate;
                      newTotalCostJOD += itemCostJOD;
                  });

                  const newProfit = booking.amount - newTotalCostJOD;

                  await updateBooking(booking.id, {
                      services: updatedServices,
                      cost: newTotalCostJOD,
                      profit: newProfit
                  });
              }
              showNotification(`تم تحديث التكاليف في ${bookingsToUpdate.length} حجز مرتبط بهذا الصنف`, 'info');
          }
      }
  };

  const deleteInventory = async (id: string) => {
      setInventory(prev => prev.filter(i => i.id !== id));
      if (isDbConnected) {
          await supabase.from('inventory').delete().eq('id', id);
      }
      addAuditLog('DELETE_INVENTORY', `حذف عنصر مخزون: ${id}`, 'Inventory');
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

  const stats = {
    totalSales: allBookings.reduce((acc, curr) => acc + curr.amount, 0),
    totalPaid: allBookings.reduce((acc, curr) => acc + curr.paidAmount, 0),
    totalPending: allBookings.reduce((acc, curr) => acc + (curr.amount - curr.paidAmount), 0),
    bookingsCount: bookingsTotal, 
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
