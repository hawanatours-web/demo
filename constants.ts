
import { Booking, BookingStatus, Transaction, TransactionType, Agent, Client, Treasury, User, NavPage, InventoryItem } from './types';

export const APP_NAME = "HAWANA Travel System";

export const TRANSLATIONS: Record<string, Record<string, string>> = {
    ar: {
        dashboard: 'لوحة التحكم',
        bookings: 'الحجوزات',
        itineraries: 'عروض الأسعار',
        tasks: 'المهام والمتابعة',
        agents: 'الوكلاء والموردين',
        invoices: 'العملاء',
        expenses: 'المصروفات',
        treasury: 'الخزينة والبنوك',
        exchange_rates: 'أسعار الصرف',
        ai_advisor: 'المساعد الذكي',
        users: 'إدارة المستخدمين',
        audit_log: 'سجل الحركات',
        inventory: 'المخزون',
        reports: 'التقارير المالية',
        guide: 'دليل الاستخدام',
        logout: 'تسجيل الخروج',
        settings: 'إعدادات النظام',
        profile: 'الملف الشخصي',
        notifications: 'التنبيهات',
        no_notifications: 'لا توجد تنبيهات جديدة',
        search: 'بحث...',
        view: 'عرض',
        details: 'التفاصيل',
        total_sales: 'إجمالي المبيعات',
        collected: 'المبالغ المحصلة',
        pending: 'الذمم (غير مدفوع)',
        total_expenses: 'إجمالي المصروفات',
        financial_performance: 'الأداء المالي (الشهري)',
        income: 'الدخل',
        expense: 'المصروف',
        most_active_agents: 'أكثر الوكلاء نشاطاً',
        recent_bookings: 'آخر الحجوزات',
        view_all: 'عرض الكل',
        current_week_bookings: 'حجوزات الأسبوع الحالي',
        current_week_desc: 'الحجوزات والرحلات المجدولة (من السبت إلى الجمعة)',
        add_new: 'إضافة جديد',
        edit: 'تعديل',
        delete: 'حذف',
        save: 'حفظ',
        cancel: 'إلغاء',
        item_name: 'اسم الصنف',
        total_quantity: 'الكمية الكلية',
        sold_quantity: 'المباع',
        remaining_quantity: 'المتبقي',
        cost_price: 'سعر التكلفة',
        selling_price: 'سعر البيع',
        expiry_date: 'تاريخ الانتهاء'
    },
    en: {
        dashboard: 'Dashboard',
        bookings: 'Bookings',
        itineraries: 'Itineraries',
        tasks: 'Task Manager',
        agents: 'Agents & Suppliers',
        invoices: 'Clients',
        expenses: 'Expenses',
        treasury: 'Treasury & Banks',
        exchange_rates: 'Exchange Rates',
        ai_advisor: 'AI Advisor',
        users: 'User Management',
        audit_log: 'Audit Log',
        inventory: 'Inventory',
        reports: 'Financial Reports',
        guide: 'System Guide',
        logout: 'Logout',
        settings: 'System Settings',
        profile: 'Profile',
        notifications: 'Notifications',
        no_notifications: 'No new notifications',
        search: 'Search...',
        view: 'View',
        details: 'Details',
        total_sales: 'Total Sales',
        collected: 'Collected',
        pending: 'Pending (Due)',
        total_expenses: 'Total Expenses',
        financial_performance: 'Financial Performance (Monthly)',
        income: 'Income',
        expense: 'Expense',
        most_active_agents: 'Top Agents',
        recent_bookings: 'Recent Bookings',
        view_all: 'View All',
        current_week_bookings: 'Current Week Bookings',
        current_week_desc: 'Scheduled bookings and trips (Sat - Fri)',
        add_new: 'Add New',
        edit: 'Edit',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        item_name: 'Item Name',
        total_quantity: 'Total Qty',
        sold_quantity: 'Sold',
        remaining_quantity: 'Remaining',
        cost_price: 'Cost Price',
        selling_price: 'Selling Price',
        expiry_date: 'Expiry Date'
    }
};

export const MOCK_USERS: User[] = [
  { 
    id: 'U1', 
    username: 'admin', 
    password: '123', 
    name: 'Admin User', 
    role: 'Admin', 
    isActive: true,
    permissions: [
        NavPage.DASHBOARD, 
        NavPage.BOOKINGS, 
        NavPage.AGENTS, 
        NavPage.INVOICES, 
        NavPage.EXPENSES, 
        NavPage.TREASURY, 
        NavPage.ITINERARIES,
        NavPage.TASKS,
        NavPage.INVENTORY,
        NavPage.REPORTS,
        NavPage.USERS, 
        NavPage.AI_ADVISOR, 
        NavPage.EXCHANGE_RATES, 
        NavPage.GUIDE,
        NavPage.SETTINGS
    ]
  },
  { 
    id: 'U2', 
    username: 'sales', 
    password: '123', 
    name: 'موظف مبيعات', 
    role: 'Employee', 
    isActive: true,
    permissions: [
        NavPage.DASHBOARD, 
        NavPage.BOOKINGS, 
        NavPage.INVOICES, 
        NavPage.AGENTS,
        NavPage.ITINERARIES,
        NavPage.INVENTORY,
        NavPage.GUIDE
    ]
  },
];

export const MOCK_TREASURY: Treasury[] = [
  { id: 'TR1', name: 'الصندوق الرئيسي (Main Cash)', type: 'Cash', balance: 5000, currency: 'JOD' },
  { id: 'TR2', name: 'البنك العربي - JOD', type: 'Bank', balance: 12500, currency: 'JOD', accountNumber: 'JO123456789' },
  { id: 'TR3', name: 'البنك العربي - USD', type: 'Bank', balance: 3200, currency: 'USD', accountNumber: 'JO987654321' },
  { id: 'TR4', name: 'صندوق الشيكات (برسم التحصيل)', type: 'Checks', balance: 4500, currency: 'JOD' }, 
];

export const MOCK_AGENTS: Agent[] = [
  { id: 'A1', name: 'Booking.com', type: 'Hotel', balance: 1500, phone: 'Online', notes: 'حجوزات فنادق عالمية' },
  { id: 'A2', name: 'وكيل جدة (Jeddah Agent)', type: 'Visa', balance: 500, phone: '+9665000000', notes: 'تأشيرات عمرة' },
  { id: 'A3', name: 'الملكية الأردنية (RJ)', type: 'Airline', balance: 0, phone: '065000000', notes: 'تذاكر طيران' },
  { id: 'A4', name: 'وكيل إسطنبول', type: 'General', balance: 250, phone: '+905555555', notes: 'باكيجات تركيا' },
];

export const MOCK_CLIENTS: Client[] = [
  { id: 'C1', name: 'أحمد محمد', type: 'Individual', balance: 5400, phone: '0790000000', email: 'ahmed@example.com' },
  { id: 'C2', name: 'شركة الأفق', type: 'Company', balance: 350, phone: '065555555', limit: 10000 },
  { id: 'C3', name: 'سارة علي', type: 'Individual', balance: 1000, phone: '0788888888' },
];

// NEW: MOCK INVENTORY to ensure page isn't empty on fallback
export const MOCK_INVENTORY: InventoryItem[] = [
    {
        id: 'INV1',
        name: 'تذاكر حفل عمرو دياب',
        type: 'Tour',
        supplier: 'Global Events',
        totalQuantity: 100,
        costPrice: 50,
        sellingPrice: 80,
        currency: 'JOD',
        description: 'تذاكر VIP لحفل العقبة'
    },
    {
        id: 'INV2',
        name: 'مقاعد طيران (شرم الشيخ)',
        type: 'Flight',
        supplier: 'الملكية الأردنية (RJ)',
        totalQuantity: 20,
        costPrice: 200,
        sellingPrice: 250,
        currency: 'JOD',
        airline: 'RJ',
        flightDate: '2023-12-25',
        route: 'AMM-SSH-AMM'
    },
    {
        id: 'INV3',
        name: 'فندق موفنبيك العقبة (غرف ديلوكس)',
        type: 'Hotel',
        supplier: 'Movenpick',
        totalQuantity: 10,
        costPrice: 90,
        sellingPrice: 120,
        currency: 'JOD',
        roomType: 'Deluxe Sea View',
        checkIn: '2023-11-15',
        checkOut: '2023-11-20'
    }
];

export const MOCK_BOOKINGS: Booking[] = [
  { 
    id: 'B001', 
    fileNo: '2310-001',
    clientName: 'أحمد محمد', 
    passengers: [
        { id: 'p1', fullName: 'أحمد محمد', type: 'Adult', passportNo: 'N123456' },
        { id: 'p2', fullName: 'منى علي', type: 'Adult', passportNo: 'N654321' }
    ],
    destination: 'دبي - 5 ليالي', 
    type: 'Tourism', 
    createdAt: '2023-10-25T10:00:00',
    createdBy: 'Admin User',
    date: '2023-10-25', 
    amount: 5400, 
    paidAmount: 5400,
    payments: [
      { id: 'pay1', amount: 5400, currency: 'JOD', exchangeRate: 1, finalAmount: 5400, date: '2023-10-25', notes: 'دفعة كاملة نقداً', treasuryId: 'TR1' }
    ],
    cost: 4000,
    profit: 1400,
    status: BookingStatus.CONFIRMED, 
    paymentStatus: 'Paid', 
    serviceCount: 1,
    services: [
        { 
            id: 's1', 
            type: 'Hotel', 
            country: 'UAE', 
            hotelName: 'Rixos Premium', 
            quantity: 2, 
            sellingPrice: 2700, 
            costPrice: 2000, 
            supplier: 'Booking.com',
            roomType: 'Double Sea View',
            boardType: 'BB'
        }
    ] 
  },
  { 
    id: 'B002', 
    fileNo: '2310-002',
    clientName: 'شركة الأفق', 
    passengers: [
        { id: 'p3', fullName: 'خالد سعيد', type: 'Adult' }
    ],
    destination: 'القاهرة - مؤتمر', 
    type: 'Flight', 
    createdAt: '2023-10-28T14:30:00',
    createdBy: 'موظف مبيعات',
    date: '2023-10-28', 
    amount: 350,
    paidAmount: 0,
    payments: [],
    cost: 300,
    profit: 50,
    status: BookingStatus.PENDING, 
    paymentStatus: 'Unpaid', 
    serviceCount: 1,
    services: [
        {
            id: 's2', 
            type: 'Flight',
            quantity: 1,
            sellingPrice: 350,
            costPrice: 300,
            supplier: 'الملكية الأردنية (RJ)',
            airline: 'RJ',
            route: 'AMM-CAI-AMM',
            pnr: 'XJ5KLM',
            ticketNumber: '071-44556677'
        }
    ] 
  },
  { 
    id: 'B003', 
    fileNo: '2311-005',
    clientName: 'سارة علي', 
    passengers: [
        { id: 'p4', fullName: 'سارة علي', type: 'Adult' },
        { id: 'p5', fullName: 'كريم أحمد', type: 'Child' }
    ],
    destination: 'اسطنبول', 
    type: 'Tourism', 
    createdAt: '2023-11-02T09:15:00', 
    createdBy: 'Admin User',
    date: '2023-11-02', 
    amount: 1200,
    paidAmount: 200,
    payments: [
       { id: 'pay2', amount: 200, currency: 'JOD', exchangeRate: 1, finalAmount: 200, date: '2023-11-02', notes: 'دفعة مقدمة', treasuryId: 'TR1' }
    ],
    cost: 1000,
    profit: 200,
    status: BookingStatus.CONFIRMED, 
    paymentStatus: 'Partial', 
    serviceCount: 2,
    services: [] 
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'T001', description: 'حجز طيران - الخطوط السعودية', amount: 2500, date: '2023-10-20', type: TransactionType.EXPENSE, category: 'تذاكر', treasuryId: 'TR2', createdBy: 'Admin User' },
  { id: 'T002', description: 'دفعة مقدمة - أحمد محمد', amount: 5400, date: '2023-10-21', type: TransactionType.INCOME, category: 'مبيعات', treasuryId: 'TR1', createdBy: 'Admin User' },
  { id: 'T003', description: 'إيجار المكتب - شهر أكتوبر', amount: 3000, date: '2023-10-22', type: TransactionType.EXPENSE, category: 'تشغيل', treasuryId: 'TR2', createdBy: 'Admin User' },
  { id: 'T004', description: 'دفعة شركة الأفق', amount: 5000, date: '2023-10-24', type: TransactionType.INCOME, category: 'مبيعات', treasuryId: 'TR2', createdBy: 'موظف مبيعات' },
  { 
      id: 'T005', 
      description: 'شيك ضمان - مجموعة الهيثم', 
      amount: 4500, 
      date: '2023-10-26', 
      type: TransactionType.INCOME, 
      category: 'شيكات', 
      treasuryId: 'TR4',
      createdBy: 'Admin User',
      checkDetails: {
          checkNumber: 'CHK-9090',
          dueDate: '2023-12-01',
          bankName: 'Housing Bank',
          clientName: 'مجموعة الهيثم',
          status: 'Pending'
      }
  },
];

export const CHART_DATA = [
  { name: 'يناير', income: 4000, expense: 2400 },
  { name: 'فبراير', income: 3000, expense: 1398 },
  { name: 'مارس', income: 2000, expense: 9800 },
  { name: 'أبريل', income: 2780, expense: 3908 },
  { name: 'مايو', income: 1890, expense: 4800 },
  { name: 'يونيو', income: 2390, expense: 3800 },
  { name: 'يوليو', income: 3490, expense: 4300 },
];
