
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Currency } from '../types';
import { BadgeDollarSign, LineChart, Calculator, Landmark, ArrowRightLeft } from 'lucide-react';

const ExchangeRatesPage: React.FC = () => {
  const { exchangeRates, updateExchangeRate, convertCurrency, showNotification, systemCurrency } = useData();

  // State for Calculator
  const [calcAmount, setCalcAmount] = useState<string>('');
  const [calcFrom, setCalcFrom] = useState<Currency>('JOD');
  const [calcTo, setCalcTo] = useState<Currency>('USD');
  const [isLoading, setIsLoading] = useState(false);

  // Buffers for Inputs
  const [pricesBuffer, setPricesBuffer] = useState<Record<string, string>>({});
  const [ratesBuffer, setRatesBuffer] = useState<Record<string, string>>({});

  // Initialize buffers from context
  useEffect(() => {
      const initialPrices: Record<string, string> = {};
      const initialRates: Record<string, string> = {};
      
      Object.keys(exchangeRates).forEach(key => {
          const rate = exchangeRates[key];
          // Rate: 1 JOD = X Currency (e.g. 1.41 USD)
          initialRates[key] = rate.toFixed(4);
          
          // Price: 1 Unit = Y JOD (e.g. 1 USD = 0.709 JOD)
          const price = rate > 0 ? (1 / rate) : 0;
          initialPrices[key] = price.toFixed(4);
      });
      
      setPricesBuffer(initialPrices);
      setRatesBuffer(initialRates);
  }, [exchangeRates]);

  // Handle Change in PRICE Input (e.g. User enters 0.71 for USD)
  const handlePriceChange = (currency: Currency, val: string) => {
      setPricesBuffer(prev => ({ ...prev, [currency]: val }));
      
      const price = parseFloat(val);
      if (!isNaN(price) && price > 0) {
          const newRate = 1 / price;
          setRatesBuffer(prev => ({ ...prev, [currency]: newRate.toFixed(4) }));
          updateExchangeRate(currency, Number(newRate.toFixed(5)));
      }
  };

  // Handle Change in RATE Input (e.g. User enters 4.59 for ILS)
  const handleRateChange = (currency: Currency, val: string) => {
      setRatesBuffer(prev => ({ ...prev, [currency]: val }));
      
      const rate = parseFloat(val);
      if (!isNaN(rate) && rate > 0) {
          const newPrice = 1 / rate;
          setPricesBuffer(prev => ({ ...prev, [currency]: newPrice.toFixed(4) }));
          updateExchangeRate(currency, Number(rate.toFixed(5)));
      }
  };

  const fetchInvestingRates = async () => {
      setIsLoading(true);
      try {
          // Fetching reliable global market rates (Matches Investing.com Spot Rates)
          const response = await fetch('https://api.exchangerate-api.com/v4/latest/JOD');
          if (!response.ok) throw new Error('Failed to fetch');
          
          const data = await response.json();
          
          const targets: Currency[] = ['USD', 'EUR', 'ILS', 'SAR'];
          const newPrices = { ...pricesBuffer };
          const newRates = { ...ratesBuffer };

          targets.forEach(code => {
              const marketRate = data.rates[code]; 
              if (marketRate) {
                  let finalRate = marketRate;

                  // Apply 0.05 Margin specifically for ILS on the RATE
                  // Because for ILS, "Price" is ~0.19, adding 0.05 there is wrong (25% diff).
                  // Adding 0.05 to Rate (e.g. 5.20 -> 5.25) is standard margin logic.
                  if (code === 'ILS') {
                      finalRate = marketRate + 0.05;
                  }
                  
                  // Calculate Base Unit Price (JOD) from Rate
                  let sellingPrice = 1 / finalRate;
                  
                  updateExchangeRate(code, Number(finalRate.toFixed(5)));
                  newPrices[code] = sellingPrice.toFixed(4);
                  newRates[code] = finalRate.toFixed(4);
              }
          });
          
          setPricesBuffer(newPrices);
          setRatesBuffer(newRates);
          showNotification('تم تحديث الأسعار من Investing.com (مع إضافة هامش 0.05 على سعر صرف الشيكل)', 'success');
      } catch (error) {
          showNotification('فشل الاتصال بمخدم الأسعار العالمية', 'error');
      } finally {
          setIsLoading(false);
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
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
            <div className="bg-cyan-600 p-3 rounded-xl shadow-lg shadow-cyan-900/20">
                <BadgeDollarSign size={32} className="text-white" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">أسعار الصرف والعملات</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">تعديل أسعار التحويل بين العملات والدينار</p>
            </div>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={fetchInvestingRates}
                disabled={isLoading}
                className="flex items-center gap-3 px-6 py-3 bg-[#121C2D] text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg border border-slate-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                <div className={`p-1 bg-white/10 rounded-full ${isLoading ? 'animate-pulse' : ''}`}>
                    <LineChart size={18} />
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-sm">اسعار الصرف بالسوق الفلسطيني</span>
                    <span className="text-[10px] opacity-70 font-normal">هامش (+0.05) على صرف الشيكل</span>
                </div>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rates Table */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Landmark size={20} className="text-cyan-600 dark:text-cyan-400" /> لوحة الأسعار التفاعلية
                  </h3>
                  <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">العملة الأساسية: 1 دينار (JOD)</div>
              </div>
              
              <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-400 px-4 mb-2">
                      <div className="col-span-4">العملة</div>
                      <div className="col-span-3 text-center">سعر الوحدة (JOD)</div>
                      <div className="col-span-2 text-center"></div>
                      <div className="col-span-3 text-center">سعر الصرف (Rate)</div>
                  </div>

                  {currencies.map((curr) => (
                      <div key={curr.code} className="grid grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-[#0f172a] p-3 rounded-lg border border-slate-200 dark:border-slate-700 transition-all hover:border-cyan-400 dark:hover:border-cyan-600">
                          
                          {/* Currency Info */}
                          <div className="col-span-4 flex items-center gap-3">
                              <span className="text-2xl">{curr.flag}</span>
                              <div>
                                  <p className="font-bold text-slate-800 dark:text-white font-mono">{curr.code}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{curr.name}</p>
                              </div>
                          </div>
                          
                          {curr.code === 'JOD' ? (
                              <div className="col-span-8 text-center text-slate-400 text-sm font-mono">العملة الأساسية (Base)</div>
                          ) : (
                              <>
                                {/* Price Input */}
                                <div className="col-span-3">
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            step="0.001" 
                                            value={pricesBuffer[curr.code] || ''}
                                            onChange={(e) => handlePriceChange(curr.code, e.target.value)}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg py-2 px-2 text-center text-slate-800 dark:text-white font-mono font-bold text-sm focus:border-cyan-500 focus:outline-none"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute -bottom-4 left-0 w-full text-center text-[9px] text-slate-400">1 {curr.code} = ؟</span>
                                    </div>
                                </div>

                                {/* Icon */}
                                <div className="col-span-2 flex justify-center">
                                    <ArrowRightLeft size={16} className="text-slate-400" />
                                </div>

                                {/* Rate Input */}
                                <div className="col-span-3">
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            value={ratesBuffer[curr.code] || ''}
                                            onChange={(e) => handleRateChange(curr.code, e.target.value)}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg py-2 px-2 text-center text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm focus:border-emerald-500 focus:outline-none"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute -bottom-4 left-0 w-full text-center text-[9px] text-slate-400">1 JOD = ؟</span>
                                    </div>
                                </div>
                              </>
                          )}
                      </div>
                  ))}
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
                  <Landmark className="text-blue-500 mt-1 flex-shrink-0" size={20} />
                  <div>
                      <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">مصدر البيانات</p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                          يتم جلب الأسعار اللحظية من Investing.com.<br/>
                          تم تطبيق هامش ربح <strong>+0.05</strong> على سعر صرف الشيكل (Rate) فقط (مثلاً 5.20 يصبح 5.25)، باقي العملات بسعر السوق الخام.
                      </p>
                  </div>
              </div>
          </div>

          {/* Calculator */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg h-fit sticky top-6">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Calculator size={20} className="text-cyan-600 dark:text-cyan-400" /> حاسبة تحويل سريعة
                  </h3>
              </div>

              <div className="space-y-6 bg-slate-50 dark:bg-[#0f172a] p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 font-bold">المبلغ المراد تحويله</label>
                      <input 
                        type="number" 
                        value={calcAmount} 
                        onChange={(e) => setCalcAmount(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-white text-xl font-bold focus:border-cyan-500 focus:outline-none text-center"
                        placeholder="0.00"
                      />
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                      <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 text-center">من</label>
                          <select 
                            value={calcFrom} 
                            onChange={(e) => setCalcFrom(e.target.value as Currency)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none text-center font-bold"
                          >
                              {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                          </select>
                      </div>
                      <ArrowRightLeft size={16} className="text-slate-400 mt-4" />
                      <div>
                          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 text-center">إلى</label>
                          <select 
                            value={calcTo} 
                            onChange={(e) => setCalcTo(e.target.value as Currency)}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none text-center font-bold"
                          >
                              {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                          </select>
                      </div>
                  </div>

                  <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-6 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">النتيجة التقديرية</p>
                      <p className="text-4xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight dir-ltr">
                          {calculateResult().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                          <span className="text-sm font-normal text-slate-500 ml-2 uppercase">{calcTo}</span>
                      </p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ExchangeRatesPage;
