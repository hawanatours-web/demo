
import React, { useState } from 'react';
import { User, Lock, LogIn, Globe, Loader2 } from 'lucide-react';
import { useData } from '../context/DataContext';

const LoginScreen: React.FC = () => {
  const { login, companySettings } = useData();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(username, password);
      if (!success) {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالنظام');
    } finally {
      setLoading(false);
    }
  };

  // Determine if logo should be shown based on settings
  const showLogo = companySettings.logoUrl && (companySettings.logoVisibility === 'both' || companySettings.logoVisibility === 'system');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center p-4 font-cairo text-slate-800 dark:text-slate-200 transition-colors duration-300" dir="rtl">
      <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>

        {/* Header Section */}
        <div className="bg-slate-50 dark:bg-[#0f172a]/50 p-8 text-center border-b border-slate-200 dark:border-slate-800 relative z-10">
            {showLogo ? (
                <img src={companySettings.logoUrl} alt="Logo" className="h-20 w-auto mx-auto mb-4 object-contain" />
            ) : (
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-slate-800 mb-4 shadow-lg border border-slate-200 dark:border-slate-700 group hover:border-cyan-500/50 transition-colors">
                    <Globe className="text-cyan-600 dark:text-cyan-400 group-hover:animate-pulse" size={36} />
                </div>
            )}
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 tracking-wide">
                {companySettings.logoText || 'HAWANA'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">نظام إدارة السياحة والسفر المتكامل</p>
        </div>

        {/* Form Section */}
        <div className="p-8 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm text-center flex items-center justify-center gap-2 animate-fade-in">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mr-1">اسم المستخدم</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors">
                            <User size={20} />
                        </div>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-400 dark:placeholder-slate-600"
                            placeholder="أدخل اسم المستخدم"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mr-1">كلمة المرور</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors">
                            <Lock size={20} />
                        </div>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl py-3 pr-10 pl-4 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-400 dark:placeholder-slate-600"
                            placeholder="أدخل كلمة المرور"
                            disabled={loading}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                    {loading ? 'جارٍ الاتصال...' : 'تسجيل الدخول'}
                </button>

                <div className="text-center mt-4">
                    <p className="text-xs text-slate-500">
                        هل نسيت كلمة المرور؟ <a href="#" className="text-cyan-600 dark:text-cyan-400 hover:underline">تواصل مع الدعم الفني</a>
                    </p>
                </div>
            </form>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 dark:bg-[#0f172a] p-3 text-center border-t border-slate-200 dark:border-slate-800">
            <p className="text-[10px] text-slate-500 dark:text-slate-600">جميع الحقوق محفوظة © 2025 - نظام {companySettings.logoText}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;