
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { User, Lock, Shield, Save, CheckCircle2, UserCircle, Moon, Sun } from 'lucide-react';
import { NavPage } from '../types';

const ProfilePage: React.FC = () => {
  const { currentUser, updateUser, showNotification, theme, toggleTheme } = useData();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setUsername(currentUser.username);
    }
  }, [currentUser]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    updateUser(currentUser.id, { name, username });
    showNotification('تم تحديث المعلومات الشخصية بنجاح', 'success');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (password !== confirmPassword) {
        showNotification('كلمات المرور غير متطابقة', 'error');
        return;
    }
    
    if (password.length < 3) {
        showNotification('كلمة المرور قصيرة جداً', 'error');
        return;
    }

    updateUser(currentUser.id, { password });
    showNotification('تم تغيير كلمة المرور بنجاح', 'success');
    setPassword('');
    setConfirmPassword('');
  };

  if (!currentUser) return null;

  const PAGE_LABELS: Record<NavPage, string> = {
      [NavPage.DASHBOARD]: 'لوحة التحكم',
      [NavPage.BOOKINGS]: 'إدارة الحجوزات',
      [NavPage.ITINERARIES]: 'عروض الأسعار',
      [NavPage.TASKS]: 'المهام والمتابعة',
      [NavPage.REPORTS]: 'التقارير المالية',
      [NavPage.AGENTS]: 'الوكلاء والموردين',
      [NavPage.INVOICES]: 'العملاء والديون',
      [NavPage.EXPENSES]: 'المصروفات',
      [NavPage.TREASURY]: 'الخزينة والبنوك',
      [NavPage.INVENTORY]: 'المخزون',
      [NavPage.AI_ADVISOR]: 'المساعد المالي الذكي', 
      [NavPage.EXCHANGE_RATES]: 'أسعار الصرف', 
      [NavPage.USERS]: 'إدارة المستخدمين',
      [NavPage.AUDIT_LOG]: 'سجل الحركات',
      [NavPage.PROFILE]: 'الملف الشخصي',
      [NavPage.GUIDE]: 'دليل الاستخدام',
      [NavPage.SETTINGS]: 'إعدادات النظام'
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
          <UserCircle size={32} className="text-cyan-400" />
          <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">الملف الشخصي</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm">إدارة بيانات حسابك الشخصي وتغيير كلمة المرور</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appearance Settings */}
          <div className="md:col-span-2 bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] flex items-center gap-2">
                  {theme === 'dark' ? <Moon size={18} className="text-purple-400" /> : <Sun size={18} className="text-orange-400" />}
                  <h3 className="font-bold text-slate-800 dark:text-white">المظهر وتفضيلات العرض</h3>
              </div>
              <div className="p-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm font-bold text-slate-700 dark:text-white mb-1">وضع النظام</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">التبديل بين الوضع الداكن والفاتح</p>
                      </div>
                      <button 
                        onClick={toggleTheme}
                        className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none ${theme === 'dark' ? 'bg-purple-600' : 'bg-slate-300'}`}
                      >
                          <span className={`${theme === 'dark' ? 'translate-x-1' : 'translate-x-9'} inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md flex items-center justify-center`}>
                              {theme === 'dark' ? <Moon size={14} className="text-purple-600" /> : <Sun size={14} className="text-orange-500" />}
                          </span>
                      </button>
                  </div>
              </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] flex items-center gap-2">
                  <User size={18} className="text-cyan-400" />
                  <h3 className="font-bold text-slate-800 dark:text-white">المعلومات الأساسية</h3>
              </div>
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                  <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">اسم المستخدم (للدخول)</label>
                      <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none font-mono" 
                      />
                  </div>
                   <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الصلاحية (Role)</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-3 py-1 rounded text-xs border ${currentUser.role === 'Admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}>
                            {currentUser.role}
                        </span>
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الاسم الظاهر</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                      <Save size={16} /> حفظ التعديلات
                  </button>
              </form>
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
               <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] flex items-center gap-2">
                  <Lock size={18} className="text-rose-400" />
                  <h3 className="font-bold text-slate-800 dark:text-white">الأمان وكلمة المرور</h3>
              </div>
              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                  <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">كلمة المرور الجديدة</label>
                      <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2.5 text-slate-800 dark:text-white focus:border-rose-500 focus:outline-none" 
                        placeholder="••••••"
                      />
                  </div>
                   <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تأكيد كلمة المرور</label>
                      <input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2.5 text-slate-800 dark:text-white focus:border-rose-500 focus:outline-none" 
                        placeholder="••••••"
                      />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!password || !confirmPassword}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                      <Lock size={16} /> تغيير كلمة المرور
                  </button>
              </form>
          </div>
      </div>

       {/* Permissions View */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
           <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] flex items-center gap-2">
              <Shield size={18} className="text-emerald-400" />
              <h3 className="font-bold text-slate-800 dark:text-white">صلاحيات الوصول الخاصة بك</h3>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(NavPage).filter(p => p !== NavPage.PROFILE).map((page) => {
                const hasAccess = currentUser.permissions.includes(page);
                return (
                    <div key={page} className={`flex items-center gap-2 p-3 rounded border ${hasAccess ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60'}`}>
                        <CheckCircle2 size={16} className={hasAccess ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'} />
                        <span className="text-xs font-medium">{PAGE_LABELS[page]}</span>
                    </div>
                );
            })}
          </div>
      </div>

    </div>
  );
};

export default ProfilePage;
