
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BookingsList from './components/BookingsList';
import AgentsList from './components/AgentsList';
import ClientsList from './components/ClientsList';
import ExpensesList from './components/ExpensesList';
import TreasuryList from './components/TreasuryList';
import AIFinancialAdvisor from './components/AIFinancialAdvisor';
import NotificationToast from './components/NotificationToast';
import LoginScreen from './components/LoginScreen';
import UsersList from './components/UsersList';
import ProfilePage from './components/ProfilePage';
import SystemGuide from './components/SystemGuide'; 
import ExchangeRatesPage from './components/ExchangeRatesPage';
import SettingsPage from './components/SettingsPage';
import ItineraryBuilder from './components/ItineraryBuilder';
import TasksManager from './components/TasksManager';
import AuditLogPage from './components/AuditLogPage';
import InventoryPage from './components/InventoryPage';
import ReportsPage from './components/ReportsPage';
import OperationsCalendar from './components/OperationsCalendar';

import { NavPage } from './types';
import { Bell, LogOut, User, ChevronDown, Users, Settings, Globe, Languages, Menu } from 'lucide-react';
import { DataProvider, useData } from './context/DataContext';

const AppContent: React.FC = () => {
  const { currentUser, logout, companySettings, smartAlerts, t, language, toggleLanguage } = useData();
  const [currentPage, setCurrentPage] = useState<NavPage>(NavPage.DASHBOARD);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If not authenticated, show Login Screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  const renderContent = () => {
    // Basic security check
    if (currentPage !== NavPage.PROFILE && currentPage !== NavPage.GUIDE && currentPage !== NavPage.SETTINGS && !currentUser.permissions.includes(currentPage) && currentPage !== NavPage.DASHBOARD) {
         if (currentPage === NavPage.AUDIT_LOG && currentUser.role !== 'Admin') {
            return <Dashboard onNavigate={setCurrentPage} />;
         }
    }

    switch (currentPage) {
      case NavPage.DASHBOARD:
        return <Dashboard onNavigate={setCurrentPage} />;
      case NavPage.CALENDAR:
        return <OperationsCalendar />;
      case NavPage.BOOKINGS:
        return <BookingsList />;
      case NavPage.ITINERARIES:
        return <ItineraryBuilder />;
      case NavPage.TASKS:
        return <TasksManager />;
      case NavPage.INVENTORY:
        return <InventoryPage />;
      case NavPage.REPORTS:
        return <ReportsPage />;
      case NavPage.AGENTS:
        return <AgentsList />;
      case NavPage.INVOICES:
        return <ClientsList />;
      case NavPage.EXPENSES:
        return <ExpensesList />;
      case NavPage.TREASURY:
        return <TreasuryList />;
      case NavPage.USERS:
        return <UsersList />;
      case NavPage.AUDIT_LOG:
        return <AuditLogPage />;
      case NavPage.AI_ADVISOR:
        return <AIFinancialAdvisor />;
      case NavPage.EXCHANGE_RATES:
        return <ExchangeRatesPage />;
      case NavPage.PROFILE:
        return <ProfilePage />;
      case NavPage.GUIDE: 
        return <SystemGuide />;
      case NavPage.SETTINGS:
        return <SettingsPage onNavigate={setCurrentPage} />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  // Navigation Links Configuration (Top Bar - Hidden on Mobile)
  const navLinks = [
      { id: NavPage.CALENDAR, label: t('calendar') },
      { id: NavPage.BOOKINGS, label: t('bookings') },
      { id: NavPage.INVOICES, label: t('invoices') },
      { id: NavPage.AGENTS, label: t('agents') },
      { id: NavPage.ITINERARIES, label: t('itineraries') },
      { id: NavPage.TASKS, label: t('tasks') },
      { id: NavPage.EXCHANGE_RATES, label: t('exchange_rates') },
      { id: NavPage.AI_ADVISOR, label: t('ai_advisor') },
  ];

  return (
      <div className={`min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-200 flex font-cairo transition-colors duration-300`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Sidebar - Passed state to control visibility on mobile */}
        <Sidebar 
            currentPage={currentPage} 
            onNavigate={setCurrentPage} 
            isOpen={isMobileMenuOpen} 
            onClose={() => setIsMobileMenuOpen(false)} 
        />

        {/* Notification Toast */}
        <NotificationToast />

        {/* Main Content Wrapper - Margin applied only on Desktop (lg) */}
        <main className={`flex-1 ${language === 'ar' ? 'lg:mr-64' : 'lg:ml-64'} transition-all duration-300 min-h-screen flex flex-col relative`}>
          
          {/* Top Header */}
          <header className="h-16 lg:h-20 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex justify-between items-center transition-colors duration-300">
            
            {/* Right Side (Start) - Branding & Mobile Toggle */}
            <div className="flex items-center gap-4">
                
                {/* Mobile Menu Toggle */}
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                    <Menu size={24} />
                </button>

                <div className="flex flex-col">
                    <h2 className="text-cyan-600 dark:text-cyan-400 font-bold text-base lg:text-lg truncate max-w-[200px]">
                        {language === 'ar' ? companySettings.nameAr : companySettings.nameEn}
                    </h2>
                    <p className="text-xs text-slate-500 hidden md:block">{t('dashboard')}</p>
                </div>

                {/* Divider (Desktop) */}
                <div className="hidden xl:block h-8 w-px bg-slate-200 dark:bg-slate-700 mx-4"></div>

                {/* Navigation Links (Desktop Only) */}
                <div className="hidden xl:flex items-center gap-2">
                    {navLinks.map(link => (
                        currentUser.permissions.includes(link.id) && (
                            <button 
                                key={link.id}
                                onClick={() => setCurrentPage(link.id)}
                                className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                                    currentPage === link.id 
                                    ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 font-bold shadow-sm ring-1 ring-cyan-100 dark:ring-cyan-800' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                {link.label}
                            </button>
                        )
                    ))}
                </div>
            </div>

            {/* Left Side (End) - User Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
                
                {/* Language Toggle */}
                <button 
                    onClick={() => toggleLanguage(language === 'ar' ? 'en' : 'ar')}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all flex items-center gap-1"
                >
                    <Languages size={20} />
                    <span className="text-xs font-bold uppercase hidden md:inline">{language === 'ar' ? 'EN' : 'عربي'}</span>
                </button>

                {/* Smart Notification Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                    >
                      <Bell size={20} />
                      {smartAlerts.length > 0 && (
                          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-[#0f172a] rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse"></span>
                      )}
                    </button>

                    {isNotificationsOpen && (
                        <div className={`absolute top-full ${language === 'ar' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'} mt-2 w-80 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in`}>
                            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t('notifications')}</h3>
                                <span className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 text-[10px] px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-500/30">{smartAlerts.length}</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                                {smartAlerts.length > 0 ? (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {smartAlerts.map(alert => (
                                            <div key={alert.id} onClick={() => { if(alert.linkPage) setCurrentPage(alert.linkPage); setIsNotificationsOpen(false); }} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                                        alert.type === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 
                                                        alert.type === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 
                                                        'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                                                    }`}></div>
                                                    <div>
                                                        <p className={`text-xs font-bold mb-1 ${
                                                            alert.type === 'critical' ? 'text-red-500 dark:text-red-400' : 
                                                            alert.type === 'warning' ? 'text-amber-500 dark:text-amber-400' : 
                                                            'text-blue-500 dark:text-blue-400'
                                                        }`}>{alert.title}</p>
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{alert.message}</p>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-left dir-ltr">
                                                            {new Date(alert.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                                        <Bell size={24} className="opacity-20" />
                                        <p>{t('no_notifications')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

                {/* User Dropdown */}
                <div className="relative">
                    <div 
                        className="flex items-center gap-2 lg:gap-3 cursor-pointer group"
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{currentUser.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{currentUser.role}</p>
                        </div>
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-900/20 border-2 border-white dark:border-slate-700 group-hover:scale-105 transition-transform">
                            {currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <ChevronDown size={14} className="text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors hidden md:block" />
                    </div>
                    
                    {isUserMenuOpen && (
                        <div className={`absolute top-full ${language === 'ar' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'} mt-2 w-56 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 z-50 animate-fade-in`}>
                            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 mb-1 bg-slate-50 dark:bg-[#0f172a]">
                                <p className="text-xs text-slate-500">Signed in as</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{currentUser.username}</p>
                            </div>
                            
                            {currentUser.permissions.includes(NavPage.USERS) && (
                                <button 
                                    onClick={() => {
                                        setCurrentPage(NavPage.USERS);
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="w-full text-start px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                                >
                                    <Users size={16} />
                                    <span>{t('users')}</span>
                                </button>
                            )}
                             
                             {currentUser.permissions.includes(NavPage.SETTINGS) && (
                                <button
                                    onClick={() => {
                                        setCurrentPage(NavPage.SETTINGS);
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="w-full text-start px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                                >
                                    <Settings size={16} />
                                    <span>{t('settings')}</span>
                                </button>
                             )}

                            <button 
                                onClick={() => {
                                    setCurrentPage(NavPage.PROFILE);
                                    setIsUserMenuOpen(false);
                                }}
                                className="w-full text-start px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 transition-colors"
                            >
                                <User size={16} />
                                <span>{t('profile')}</span>
                            </button>
                            
                            <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                            
                            <button 
                                onClick={() => {
                                    logout();
                                    setIsUserMenuOpen(false);
                                }}
                                className="w-full text-start px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-2 transition-colors"
                            >
                                <LogOut size={16} />
                                <span>{t('logout')}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 lg:p-8 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
             <div className="max-w-7xl mx-auto">
                {renderContent()}
             </div>
          </div>
        </main>
      </div>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;
