
import React from 'react';
import { NavPage } from '../types';
import { LayoutDashboard, Ticket, FileText, BrainCircuit, LogOut, Globe, Building2, WalletCards, Landmark, Users, BookOpen, BadgeDollarSign, Map, CheckSquare, ShieldAlert, Package, X, BarChart3, CalendarDays } from 'lucide-react';
import { useData } from '../context/DataContext';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const { currentUser, logout, isDbConnected, companySettings, t, language } = useData();

  const allNavItems = [
    { id: NavPage.DASHBOARD, label: t('dashboard'), icon: <LayoutDashboard size={20} /> },
    { id: NavPage.CALENDAR, label: t('calendar'), icon: <CalendarDays size={20} /> }, // NEW
    { id: NavPage.BOOKINGS, label: t('bookings'), icon: <Ticket size={20} /> },
    { id: NavPage.ITINERARIES, label: t('itineraries'), icon: <Map size={20} /> },
    { id: NavPage.TASKS, label: t('tasks'), icon: <CheckSquare size={20} /> },
    { id: NavPage.INVENTORY, label: t('inventory'), icon: <Package size={20} /> },
    { id: NavPage.REPORTS, label: t('reports'), icon: <BarChart3 size={20} /> },
    { id: NavPage.AGENTS, label: t('agents'), icon: <Building2 size={20} /> },
    { id: NavPage.INVOICES, label: t('invoices'), icon: <FileText size={20} /> },
    { id: NavPage.EXPENSES, label: t('expenses'), icon: <WalletCards size={20} /> },
    { id: NavPage.TREASURY, label: t('treasury'), icon: <Landmark size={20} /> },
    { id: NavPage.EXCHANGE_RATES, label: t('exchange_rates'), icon: <BadgeDollarSign size={20} /> },
    { id: NavPage.AI_ADVISOR, label: t('ai_advisor'), icon: <BrainCircuit size={20} /> },
    { id: NavPage.USERS, label: t('users'), icon: <Users size={20} /> },
    { id: NavPage.AUDIT_LOG, label: t('audit_log'), icon: <ShieldAlert size={20} /> },
    { id: NavPage.GUIDE, label: t('guide'), icon: <BookOpen size={20} /> },
  ];

  // Filter items based on user permissions
  const visibleNavItems = allNavItems.filter(item => 
      item.id === NavPage.GUIDE || currentUser?.permissions.includes(item.id)
  );

  // Only show Audit Log for Admin
  const finalNavItems = visibleNavItems.filter(item => 
      item.id !== NavPage.AUDIT_LOG || currentUser?.role === 'Admin'
  );

  const showLogo = companySettings.logoUrl && (companySettings.logoVisibility === 'both' || companySettings.logoVisibility === 'system');

  // Determine transform class based on language and open state
  const getTransformClass = () => {
      // Desktop: Always show (translate-0)
      // Mobile: If open -> translate-0. If closed -> translate-x-full (or negative based on dir)
      if (isOpen) return 'translate-x-0';
      return language === 'ar' ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0';
  };

  const handleItemClick = (id: NavPage) => {
      onNavigate(id);
      onClose(); // Close sidebar on mobile when item clicked
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`w-64 bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white h-screen flex flex-col fixed ${language === 'ar' ? 'right-0 border-l' : 'left-0 border-r'} top-0 shadow-2xl border-slate-200 dark:border-slate-800 z-50 transition-transform duration-300 ease-in-out ${getTransformClass()}`}>
        
        <div className="p-6 flex flex-col items-center border-b border-slate-200 dark:border-slate-800 relative">
          {/* Close Button (Mobile Only) */}
          <button onClick={onClose} className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-red-500">
              <X size={24} />
          </button>

          {showLogo ? (
              <img src={companySettings.logoUrl} alt="Logo" className="h-12 w-auto mb-2 object-contain" />
          ) : (
              <h1 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 tracking-widest uppercase">{companySettings.logoText}</h1>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400 tracking-wider mt-1 text-center">{language === 'ar' ? companySettings.nameAr : companySettings.nameEn}</p>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {finalNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-3.5 transition-all duration-200 group relative ${
                currentPage === item.id
                  ? 'text-cyan-600 dark:text-cyan-400 bg-slate-50 dark:bg-transparent'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {currentPage === item.id && (
                  <div className={`absolute ${language === 'ar' ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'} top-0 bottom-0 w-1 bg-cyan-600 dark:bg-cyan-400`}></div>
              )}
              <span className={`${currentPage === item.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white'}`}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800">
           <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-center mb-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isDbConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  <p className={`text-xs font-bold ${isDbConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {isDbConnected ? 'Online' : 'Offline'}
                  </p>
              </div>
              <p className="text-[10px] text-slate-500">V 2.5 (Stable)</p>
           </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm transition-colors">
            <LogOut size={16} className={language === 'ar' ? 'rotate-180' : ''} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
