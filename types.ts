
import React from 'react';

export type Theme = 'light' | 'dark';
export type Language = 'ar' | 'en';

export enum BookingStatus {
  CONFIRMED = 'مؤكد',
  PENDING = 'قيد الانتظار',
  CANCELLED = 'ملغي',
  COMPLETED = 'مكتمل',
  ON_REQUEST = 'تحت الطلب',
  VOIDED = 'لاغي (Void)'
}

export enum TransactionType {
  INCOME = 'دخل',
  EXPENSE = 'صرف'
}

export type ServiceType = 'Visa' | 'Hotel' | 'Flight' | 'Transport' | 'Insurance' | 'Tour' | 'Other';

export type PaxType = 'Adult' | 'Child' | 'Infant';

export type Currency = 'JOD' | 'USD' | 'EUR' | 'ILS' | 'SAR';

export type UserRole = 'Admin' | 'Employee';

export enum NavPage {
  DASHBOARD = 'dashboard',
  CALENDAR = 'calendar', // NEW: Operations Calendar
  BOOKINGS = 'bookings',
  INVOICES = 'invoices', // Clients
  AGENTS = 'agents',
  EXPENSES = 'expenses',
  TREASURY = 'treasury',
  ITINERARIES = 'itineraries', 
  TASKS = 'tasks', 
  AUDIT_LOG = 'audit_log', 
  INVENTORY = 'inventory', 
  REPORTS = 'reports', 
  USERS = 'users', 
  AI_ADVISOR = 'ai_advisor',
  EXCHANGE_RATES = 'exchange_rates',
  PROFILE = 'profile', 
  GUIDE = 'guide', 
  SETTINGS = 'settings' 
}

export interface User {
  id: string;
  username: string;
  password?: string; 
  name: string;
  role: UserRole;
  permissions: NavPage[]; 
  isActive: boolean;
}

export interface AlertSettings {
  enableFinancialAlerts: boolean; 
  financialAlertDays: number; 
  enablePassportAlerts: boolean;  
  passportAlertDays: number;  
  enableFlightAlerts: boolean;    
  flightAlertDays: number;    
  enableHotelAlerts: boolean;     
  hotelAlertDays: number;     
}

export interface CompanySettings {
  nameAr: string;
  nameEn: string;
  logoText: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  logoVisibility: 'both' | 'system' | 'print';
  alertSettings?: AlertSettings; 
  whatsappTemplate?: string; // NEW: Custom WhatsApp Message Template
  contractTemplate?: string; // NEW: Terms and Conditions Contract Template
}

export interface Treasury {
  id: string;
  name: string;
  type: 'Cash' | 'Bank' | 'Checks';
  balance: number; 
  currency?: Currency;
  accountNumber?: string;
}

export interface Payment {
  id: string;
  amount: number; 
  currency: Currency; 
  exchangeRate: number; 
  finalAmount: number; 
  date: string;
  notes?: string;
  treasuryId?: string; 
}

export interface Agent {
  id: string;
  name: string;
  type: 'Airline' | 'Hotel' | 'Visa' | 'General' | 'Umrah' | 'Transport' | 'Insurance' | 'Tour' | string;
  phone?: string;
  balance: number; 
  currency?: Currency;
  email?: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  type: 'Individual' | 'Company';
  phone?: string;
  email?: string;
  balance: number; 
  limit?: number; 
  notes?: string;
}

export interface Passenger {
  id: string;
  fullName: string;
  passportNo?: string;
  nationality?: string;
  type: PaxType;
  title?: string; 
  birthDate?: string;
  passportSubmitted?: boolean; 
}

// NEW: Inventory Item Interface
export interface InventoryItem {
  id: string;
  name: string; 
  type: ServiceType;
  supplier: string;
  totalQuantity: number;
  costPrice: number;
  sellingPrice: number;
  currency: Currency;
  description?: string;
  expiryDate?: string;
  // Specific Fields based on Type
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  airline?: string;
  flightDate?: string;
  returnDate?: string;
  departureTime?: string; 
  arrivalTime?: string; 
  route?: string;
  country?: string;
  visaType?: string;
  vehicleType?: string;
}

// NEW: Route Segment for Transport & Flight
export interface RouteSegment {
    id: string;
    from: string;
    to: string;
    // Optional details for Flight Segments
    date?: string;
    departureTime?: string;
    arrivalTime?: string;
    flightNumber?: string;
    airline?: string;
}

export interface ServiceItem {
  id: string;
  type: ServiceType;
  quantity: number; 
  costPrice: number; 
  costCurrency?: string; 
  sellingPrice: number; 
  tax?: number;
  supplier?: string; 
  inventoryId?: string; 
  date?: string;
  country?: string;
  visaType?: string; 
  hotelName?: string;
  hotelAddress?: string; // NEW: Hotel Address
  roomType?: string; 
  roomCount?: number; 
  boardType?: string; 
  checkIn?: string;
  checkOut?: string;
  confirmationNo?: string; 
  airline?: string;
  pnr?: string; 
  ticketNumber?: string; 
  flightClass?: string; 
  route?: string; 
  flightDate?: string;
  returnDate?: string;
  departureTime?: string; 
  arrivalTime?: string; 
  vehicleType?: string; 
  driverName?: string;
  transportDate?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  routes?: RouteSegment[]; 
  details?: string;
  status?: string; 
}

export interface Booking {
  id: string;
  fileNo?: string; 
  clientName: string; 
  clientPhone?: string; 
  passengers: Passenger[]; 
  destination: string;
  date: string;
  createdAt: string;
  createdBy?: string; 
  amount: number; 
  paidAmount: number; 
  payments?: Payment[]; 
  cost: number;   
  profit: number; 
  type: 'Tourism' | 'Umrah' | 'Flight' | 'General' | string; 
  status: BookingStatus;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  serviceCount: number;
  services: ServiceItem[];
  notes?: string;
}

export interface CheckDetails {
  checkNumber: string;
  dueDate: string; 
  bankName: string;
  clientName: string;
  status: 'Pending' | 'Cleared' | 'Returned';
}

export interface Transaction {
  id: string;
  referenceNo?: string; 
  description: string;
  amount: number; 
  date: string;
  type: TransactionType;
  category: string;
  currency?: Currency; 
  exchangeRate?: number;
  treasuryId?: string; 
  checkDetails?: CheckDetails; 
  createdBy?: string; 
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface SmartAlert {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  date: string;
  category: 'Flight' | 'Finance' | 'Booking' | 'Treasury';
  linkPage?: NavPage;
}

export interface ItineraryDay {
    day: number;
    title: string;
    description: string;
    imageUrl?: string;
}

export interface Itinerary {
    id: string;
    title: string;
    clientName: string;
    destination: string;
    duration: number; // Days
    startDate?: string;
    price?: number;
    currency: Currency;
    days: ItineraryDay[];
    inclusions: string; // Text block
    exclusions: string; // Text block
    createdAt: string;
    createdBy: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    dueDate: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Pending' | 'Completed';
    assignedTo?: string; // Username
    relatedClient?: string;
}

export interface AuditLogEntry {
    id: string;
    action: string;
    details: string;
    performedBy: string;
    timestamp: string;
    entityType: 'Booking' | 'Transaction' | 'Agent' | 'Client' | 'System' | 'Task' | 'Itinerary' | 'Inventory';
}

export interface StatCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  currencyLabel?: string;
}

export interface DataContextType {
  bookings: Booking[]; 
  transactions: Transaction[]; 
  
  allBookings: Booking[]; 
  allTransactions: Transaction[]; 

  agents: Agent[];
  clients: Client[];
  treasury: Treasury[];
  users: User[]; 
  currentUser: User | null; 
  isDbConnected: boolean; 
  
  bookingsPage: number;
  bookingsTotal: number;
  fetchBookings: (page: number, search?: string, filters?: any) => void;
  
  transactionsPage: number;
  transactionsTotal: number;
  fetchTransactions: (page: number, search?: string, filters?: any) => void;

  itineraries: Itinerary[];
  tasks: Task[];
  inventory: InventoryItem[]; 
  auditLogs: AuditLogEntry[];

  companySettings: CompanySettings;
  updateCompanySettings: (settings: CompanySettings) => void;

  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: (lang: Language) => void;
  t: (key: string) => string;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;

  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  updateBooking: (id: string, updatedData: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  addBookingPayment: (bookingId: string, payment: Payment) => void; 
  
  addTransaction: (transaction: Omit<Transaction, 'id'>, updateTreasury?: boolean) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  transferTransaction: (transactionId: string, newTreasuryId: string) => void; 
  
  addAgent: (agent: Omit<Agent, 'id'>) => void;
  updateAgent: (id: string, data: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  addAgentPayment: (agentId: string, amount: number, treasuryId: string) => void;

  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addClientPayment: (clientId: string, amount: number, treasuryId: string, date?: string) => void;

  addTreasury: (treasury: Omit<Treasury, 'id'>) => void;
  updateTreasury: (id: string, data: Partial<Treasury>) => void;
  deleteTreasury: (id: string) => void;

  addItinerary: (data: Omit<Itinerary, 'id' | 'createdAt' | 'createdBy'>) => void;
  deleteItinerary: (id: string) => void;
  
  addTask: (data: Omit<Task, 'id'>) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addInventory: (data: Omit<InventoryItem, 'id'>) => void;
  updateInventory: (id: string, data: Partial<InventoryItem>) => void;
  deleteInventory: (id: string) => void;
  getInventoryStats: (id: string) => { sold: number, remaining: number };

  addAuditLog: (action: string, details: string, entityType: AuditLogEntry['entityType']) => void;

  systemCurrency: Currency;
  exchangeRates: Record<string, number>; 
  setSystemCurrency: (currency: Currency) => void;
  updateExchangeRate: (currency: Currency, rate: number) => void; 
  convertAmount: (amountInJOD: number) => number;
  getExchangeRate: () => number;
  convertCurrency: (amount: number, from: Currency, to: Currency) => number;

  notification: Notification | null;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  smartAlerts: SmartAlert[]; 

  stats: {
    totalSales: number;
    totalPaid: number;
    totalPending: number;
    bookingsCount: number;
    totalExpenses: number;
  };
}
