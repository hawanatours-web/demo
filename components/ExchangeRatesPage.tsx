import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Currency } from '../types';
import { BadgeDollarSign, RefreshCw, Coins, Calculator } from 'lucide-react';

const ExchangeRatesPage: React.FC = () => {
  const { exchangeRates, updateExchangeRate, convertCurrency, showNotification } = useData();

  // State for Calculator - Using string to allow decimal input (e.g. "10.")
  const [calcAmount, setCalcAmount] = useState<string>('');
  const [calcFrom, setCalcFrom] = useState<Currency>('JOD');
  const [calcTo, setCalcTo] = useState<Currency>('USD');

  // Buffer for rate inputs to allow formatting (decimals) while typing
  const [ratesBuffer, setRatesBuffer] = useState<Record<string, string>>({});

  const handleRateChange = (currency: Currency, newVal: string) => {
      // Update local buffer (UI) to show exactly what user types
      setRatesBuffer(prev => ({ ...prev, [currency]: newVal }));
      
      // Update Context (Logic) only if valid number
      const newRate = parseFloat(newVal);
      if (!isNaN(newRate) && newRate > 0) {
          updateExchangeRate(currency, newRate);
      }
  };

  const currencies: { code: Currency; name: string; flag: string }[] = [
      { code: 'JOD', name: 'الدينار الأردني', flag: '🇯🇴' },
      { code: 'USD', name: 'الدولار الأمريكي', flag: '🇺🇸' },
      { code: 'EUR', name: 'اليورو الأوروبي', flag: '🇪🇺' },
      { code: 'ILS', name: 'الشيكل الإسرائيلي', flag: '🇵🇸' },
      { code: 'SAR', name: 'الريال السعودي', flag: '🇸🇦' },
  ];

  const calculateResult = () => {
      const amount = parseFloat(calcAmount);
      if (isNaN(amount)) return 0;
      return convertCurrency(amount, calcFrom, calcTo);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-cyan-600 p-3 rounded-xl shadow-lg shadow-cyan-900/20">
            <BadgeDollarSign size={32} className="text-white" />
        </div>
        <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">أسعار الصرف</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">تحديث أسعار العملات المعتمدة في النظام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Rates Table */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <RefreshCw size={20} className="text-emerald-600 dark:text-emerald-400" /> أسعار التحويل (مقابل الدينار)
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">1 JOD = X</span>
              </div>
              
              <div className="space-y-4">
                  {currencies.map((curr) => (
                      <div key={curr.code} className="flex items-center justify-between bg-slate-50 dark:bg-[#0f172a] p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                              <span className="text-2xl">{curr.flag}</span>
                              <div>
                                  <p className="font-bold text-slate-800 dark:text-white">{curr.code}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{curr.name}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              {curr.code === 'JOD' ? (
                                  <span className="text-slate-500 font-mono font-bold px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded">1.000</span>
                              ) : (
                                  <input 
                                    type="number" 
                                    step="0.001" 
                                    // Use buffer if exists (user typing), otherwise fallback to actual value
                                    value={ratesBuffer[curr.code] !== undefined ? ratesBuffer[curr.code] : exchangeRates[curr.code]} 
                                    onChange={(e) => handleRateChange(curr.code, e.target.value)}
                                    className="w-24 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-slate-800 dark:text-white font-mono font-bold text-center focus:border-cyan-500 focus:outline-none"
                                  />
                              )}
                          </div>
                      </div>
                  ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                  * يتم تحديث الأسعار فورياً في جميع العمليات الحسابية للنظام.
              </p>
          </div>

          {/* Calculator */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Calculator size={20} className="text-cyan-600 dark:text-cyan-400" /> حاسبة تحويل سريعة
                  </h3>
              </div>

              <div className="space-y-6 bg-slate-50 dark:bg-[#0f172a] p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">المبلغ</label>
                      <input 
                        type="number" 
                        value={calcAmount} 
                        onChange={(e) => setCalcAmount(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-white text-xl font-bold focus:border-cyan-500 focus:outline-none"
                        placeholder="0.00"
                      />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">من</label>
                          <select 
                            value={calcFrom} 
                            onChange={(e) => setCalcFrom(e.target.value as Currency)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none"
                          >
                              {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">إلى</label>
                          <select 
                            value={calcTo} 
                            onChange={(e) => setCalcTo(e.target.value as Currency)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none"
                          >
                              {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                          </select>
                      </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">النتيجة التقديرية</p>
                      <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                          {calculateResult().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                          <span className="text-sm text-slate-500 ml-2">{calcTo}</span>
                      </p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ExchangeRatesPage;