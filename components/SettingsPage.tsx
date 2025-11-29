
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Settings, Save, Building2, Phone, Mail, MapPin, Upload, Eye, Trash2, BellRing } from 'lucide-react';
import { NavPage } from '../types';

interface SettingsPageProps {
  onNavigate: (page: NavPage) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { companySettings, updateCompanySettings, showNotification } = useData();
  
  const [formData, setFormData] = useState(companySettings);

  useEffect(() => {
      setFormData(companySettings);
  }, [companySettings]);

  const handleChange = (field: keyof typeof companySettings, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAlertSettingChange = (field: keyof typeof companySettings.alertSettings, value: any) => {
      setFormData(prev => ({
          ...prev,
          alertSettings: {
              ...(prev.alertSettings || {
                  enableFinancialAlerts: true,
                  financialAlertDays: 3,
                  enablePassportAlerts: true,
                  passportAlertDays: 7,
                  enableFlightAlerts: true,
                  flightAlertDays: 1,
                  enableHotelAlerts: true,
                  hotelAlertDays: 1
              }),
              [field]: value
          }
      }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Validation: 5MB limit (5 * 1024 * 1024)
        if (file.size > 5242880) {
             showNotification('حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)', 'error');
             return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            handleChange('logoUrl', reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = () => {
      handleChange('logoUrl', '');
      showNotification('تم حذف الشعار (يرجى حفظ الإعدادات لتثبيت التغيير)', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      try {
        updateCompanySettings(formData);
        showNotification('تم تحديث بيانات الشركة بنجاح', 'success');
        onNavigate(NavPage.DASHBOARD);
      } catch (error) {
        console.error("Storage Error:", error);
        showNotification('فشل حفظ الشعار: حجم البيانات كبير جداً للمتصفح. حاول استخدام صورة أصغر.', 'error');
      }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
         <div className="bg-cyan-600 p-3 rounded-xl shadow-lg shadow-cyan-900/20">
            <Settings size={32} className="text-white" />
         </div>
         <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إعدادات الشركة والنظام</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm">تخصيص اسم الشركة، الشعار النصي، إعدادات التنبيهات ومعلومات الاتصال.</p>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Company Info Section */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] flex items-center gap-2">
                <Building2 size={20} className="text-cyan-600 dark:text-cyan-400" />
                <h3 className="font-bold text-slate-800 dark:text-white">بيانات الشركة الأساسية</h3>
            </div>
            
            <div className="p-6 space-y-6">
                {/* Logo Upload Section */}
                <div className="flex justify-center mb-6">
                    <div className="text-center">
                        <div className="relative inline-block group">
                            {formData.logoUrl ? (
                                <img src={formData.logoUrl} alt="Company Logo" className="h-32 w-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-2" />
                            ) : (
                                <div className="h-32 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                                    لا يوجد شعار
                                </div>
                            )}
                            
                            {/* Upload Button */}
                            <label htmlFor="logo-upload" className="absolute bottom-0 right-0 bg-cyan-600 p-2 rounded-full text-white cursor-pointer hover:bg-cyan-500 shadow-lg transform translate-x-1/3 translate-y-1/3 transition-transform hover:scale-110 z-10">
                                <Upload size={16} />
                            </label>
                            <input 
                                id="logo-upload" 
                                type="file" 
                                accept="image/png, image/jpeg" 
                                className="hidden" 
                                onChange={handleLogoUpload}
                            />

                            {/* Delete Button - Only if logo exists */}
                            {formData.logoUrl && (
                                <button 
                                    type="button"
                                    onClick={handleDeleteLogo}
                                    title="حذف الشعار"
                                    className="absolute top-0 right-0 bg-red-600 p-2 rounded-full text-white cursor-pointer hover:bg-red-500 shadow-lg transform translate-x-1/3 -translate-y-1/3 transition-transform hover:scale-110 z-10"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">تحميل شعار (PNG/JPG - Max 5MB)</p>
                    </div>
                </div>

                {/* Logo Visibility Selector */}
                <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1"><Eye size={12} /> مكان ظهور الشعار</label>
                    <div className="flex flex-wrap gap-4 bg-slate-50 dark:bg-[#0f172a] p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="logoVisibility" 
                                checked={formData.logoVisibility === 'both'} 
                                onChange={() => handleChange('logoVisibility', 'both')} 
                                className="accent-cyan-500 w-4 h-4"
                            />
                            <span className="text-slate-700 dark:text-white text-sm">النظام والطباعة (كلاهما)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="logoVisibility" 
                                checked={formData.logoVisibility === 'system'} 
                                onChange={() => handleChange('logoVisibility', 'system')} 
                                className="accent-cyan-500 w-4 h-4"
                            />
                            <span className="text-slate-700 dark:text-white text-sm">واجهة النظام فقط</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name="logoVisibility" 
                                checked={formData.logoVisibility === 'print'} 
                                onChange={() => handleChange('logoVisibility', 'print')} 
                                className="accent-cyan-500 w-4 h-4"
                            />
                            <span className="text-slate-700 dark:text-white text-sm">المطبوعات فقط</span>
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">اسم الشركة (بالعربية)</label>
                        <input 
                            type="text" 
                            required
                            value={formData.nameAr}
                            onChange={(e) => handleChange('nameAr', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none"
                            placeholder="مثال: هوانا للسياحة والسفر"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Company Name (English)</label>
                        <input 
                            type="text" 
                            required
                            value={formData.nameEn}
                            onChange={(e) => handleChange('nameEn', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none dir-ltr text-left"
                            placeholder="Ex: HAWANA Travel & Tourism"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">نص الشعار (Logo Text) - بديل للصورة</label>
                    <input 
                        type="text" 
                        required
                        value={formData.logoText}
                        onChange={(e) => handleChange('logoText', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-white font-bold text-xl focus:border-cyan-500 focus:outline-none text-center"
                        placeholder="HAWANA"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">هذا النص يظهر في حال عدم وجود شعار صورة.</p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <MapPin size={16} className="text-emerald-600 dark:text-emerald-400" /> بيانات الاتصال والعنوان
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Phone size={12}/> رقم الهاتف</label>
                            <input 
                                type="text" 
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none dir-ltr"
                                placeholder="+962 79 000 0000"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Mail size={12}/> البريد الإلكتروني</label>
                            <input 
                                type="email" 
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none dir-ltr"
                                placeholder="info@company.com"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><MapPin size={12}/> العنوان</label>
                            <input 
                                type="text" 
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none"
                                placeholder="العنوان الكامل (يظهر في الفواتير)"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Alerts Settings Section */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] flex items-center gap-2">
                <BellRing size={20} className="text-amber-500" />
                <h3 className="font-bold text-slate-800 dark:text-white">إعدادات التنبيهات والمتابعة</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Financial Alerts */}
                <div className="flex flex-col p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">تنبيهات مالية عاجلة</p>
                            <p className="text-xs text-slate-500">تنبيه عند وجود ذمم قبل السفر.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={formData.alertSettings?.enableFinancialAlerts ?? true}
                                onChange={(e) => handleAlertSettingChange('enableFinancialAlerts', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                    </div>
                    {formData.alertSettings?.enableFinancialAlerts && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-600 dark:text-slate-400">تنبيه قبل موعد السفر بـ:</span>
                            <input 
                                type="number" 
                                min="1" max="30"
                                value={formData.alertSettings?.financialAlertDays ?? 3}
                                onChange={(e) => handleAlertSettingChange('financialAlertDays', Number(e.target.value))}
                                className="w-16 p-1 text-center text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white font-bold"
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-400">أيام</span>
                        </div>
                    )}
                </div>

                {/* Passport Alerts */}
                <div className="flex flex-col p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">تنبيهات الجوازات</p>
                            <p className="text-xs text-slate-500">تنبيه عند عدم استلام الجوازات.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={formData.alertSettings?.enablePassportAlerts ?? true}
                                onChange={(e) => handleAlertSettingChange('enablePassportAlerts', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                    </div>
                    {formData.alertSettings?.enablePassportAlerts && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-600 dark:text-slate-400">تنبيه قبل الرحلة بـ:</span>
                            <input 
                                type="number" 
                                min="1" max="30"
                                value={formData.alertSettings?.passportAlertDays ?? 7}
                                onChange={(e) => handleAlertSettingChange('passportAlertDays', Number(e.target.value))}
                                className="w-16 p-1 text-center text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white font-bold"
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-400">أيام</span>
                        </div>
                    )}
                </div>

                {/* Flight Alerts */}
                <div className="flex flex-col p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">تذكير بمواعيد الطيران</p>
                            <p className="text-xs text-slate-500">تنبيه بقرب موعد إقلاع الرحلة.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={formData.alertSettings?.enableFlightAlerts ?? true}
                                onChange={(e) => handleAlertSettingChange('enableFlightAlerts', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                    </div>
                    {formData.alertSettings?.enableFlightAlerts && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-600 dark:text-slate-400">تنبيه قبل الإقلاع بـ:</span>
                            <input 
                                type="number" 
                                min="0" max="7"
                                value={formData.alertSettings?.flightAlertDays ?? 1}
                                onChange={(e) => handleAlertSettingChange('flightAlertDays', Number(e.target.value))}
                                className="w-16 p-1 text-center text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white font-bold"
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-400">أيام</span>
                        </div>
                    )}
                </div>

                {/* Hotel Alerts */}
                <div className="flex flex-col p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-sm text-slate-800 dark:text-white">تذكير بدخول الفنادق</p>
                            <p className="text-xs text-slate-500">تنبيه بقرب موعد الـ Check-in.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={formData.alertSettings?.enableHotelAlerts ?? true}
                                onChange={(e) => handleAlertSettingChange('enableHotelAlerts', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                    </div>
                    {formData.alertSettings?.enableHotelAlerts && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-600 dark:text-slate-400">تنبيه قبل الدخول بـ:</span>
                            <input 
                                type="number" 
                                min="0" max="7"
                                value={formData.alertSettings?.hotelAlertDays ?? 1}
                                onChange={(e) => handleAlertSettingChange('hotelAlertDays', Number(e.target.value))}
                                className="w-16 p-1 text-center text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 dark:text-white font-bold"
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-400">أيام</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="pt-4 flex justify-end">
            <button 
            type="submit"
            className="w-full md:w-auto px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
            >
                <Save size={20} /> حفظ كافة الإعدادات
            </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;