
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { TransactionType, BookingStatus } from '../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { 
    BarChart3, TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, 
    Filter, Printer, ArrowDown
} from 'lucide-react';

const ReportsPage: React.FC = () => {
  const { allBookings, allTransactions, systemCurrency, convertAmount, companySettings } = useData();

  // --- State for Filters ---
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('All'); // 'All' or '0'...'11'
  const [selectedType, setSelectedType] = useState<string>('All'); // Booking Type

  // --- Helper: Get Unique Years from Data ---
  const availableYears = useMemo(() => {
      const years = new Set<number>();
      allBookings.forEach(b => years.add(new Date(b.date).getFullYear()));
      allTransactions.forEach(t => years.add(new Date(t.date).getFullYear()));
      years.add(currentYear);
      return Array.from(years).sort((a, b) => b - a);
  }, [allBookings, allTransactions, currentYear]);

  // --- Helper: Get Unique Booking Types ---
  const bookingTypes = useMemo(() => {
      return Array.from(new Set(allBookings.map(b => b.type))).filter(Boolean);
  }, [allBookings]);

  // --- MAIN CALCULATION LOGIC ---
  const reportData = useMemo(() => {
      // Filter Bookings
      const filteredBookings = allBookings.filter(b => {
          const d = new Date(b.date);
          const yearMatch = d.getFullYear() === selectedYear;
          const monthMatch = selectedMonth === 'All' || d.getMonth().toString() === selectedMonth;
          const typeMatch = selectedType === 'All' || b.type === selectedType;
          const validStatus = b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.VOIDED;
          return yearMatch && monthMatch && typeMatch && validStatus;
      });

      // Filter Expenses (Transactions)
      const filteredExpenses = allTransactions.filter(t => {
          const d = new Date(t.date);
          const yearMatch = d.getFullYear() === selectedYear;
          const monthMatch = selectedMonth === 'All' || d.getMonth().toString() === selectedMonth;
          return yearMatch && monthMatch && t.type === TransactionType.EXPENSE;
      });

      // 1. Totals
      const totalSales = filteredBookings.reduce((sum, b) => sum + b.amount, 0);
      const totalCost = filteredBookings.reduce((sum, b) => sum + b.cost, 0); // COGS
      const grossProfit = totalSales - totalCost;
      
      // Only include Operational Expenses if viewing ALL types, otherwise 0 (or could be allocated)
      const operationalExpenses = selectedType === 'All' 
          ? filteredExpenses.reduce((sum, t) => sum + t.amount, 0) 
          : 0; 

      const netProfit = grossProfit - operationalExpenses;

      // 2. Monthly Data for Charts
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
          // If a specific month is selected, we only populate that index, else all
          if (selectedMonth !== 'All' && i.toString() !== selectedMonth) return null;

          const monthName = new Date(selectedYear, i, 1).toLocaleString('en-US', { month: 'short' });
          
          // Bookings in this month
          const monthBookings = filteredBookings.filter(b => new Date(b.date).getMonth() === i);
          const mSales = monthBookings.reduce((sum, b) => sum + b.amount, 0);
          const mCost = monthBookings.reduce((sum, b) => sum + b.cost, 0);
          
          // Expenses in this month (Only if Type is All)
          const mExpenses = selectedType === 'All' 
              ? filteredExpenses.filter(t => new Date(t.date).getMonth() === i).reduce((sum, t) => sum + t.amount, 0)
              : 0;

          return {
              name: monthName,
              Sales: Number(convertAmount(mSales).toFixed(2)),
              Cost: Number(convertAmount(mCost).toFixed(2)),
              Expenses: Number(convertAmount(mExpenses).toFixed(2)),
              Profit: Number(convertAmount(mSales - mCost - mExpenses).toFixed(2))
          };
      }).filter(Boolean); // Remove nulls

      // 3. Pie Chart: Revenue by Type (If All selected)
      const salesByType = bookingTypes.map(type => {
          const typeSales = filteredBookings
              .filter(b => b.type === type)
              .reduce((sum, b) => sum + b.amount, 0);
          return { name: type, value: Number(convertAmount(typeSales).toFixed(2)) };
      }).filter(item => item.value > 0);

      // 4. Pie Chart: Expenses by Category (If All selected)
      const expensesByCategory: Record<string, number> = {};
      if (selectedType === 'All') {
          filteredExpenses.forEach(t => {
              expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
          });
      }
      const expenseChartData = Object.keys(expensesByCategory).map(cat => ({
          name: cat,
          value: Number(convertAmount(expensesByCategory[cat]).toFixed(2))
      }));

      return {
          totalSales,
          totalCost,
          grossProfit,
          operationalExpenses,
          netProfit,
          monthlyData,
          salesByType,
          expenseChartData
      };

  }, [allBookings, allTransactions, selectedYear, selectedMonth, selectedType, convertAmount, bookingTypes]);

  // --- Colors for Charts ---
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const handlePrintReport = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const showLogo = companySettings.logoUrl && (companySettings.logoVisibility === 'both' || companySettings.logoVisibility === 'print');
      const logoHtml = showLogo 
          ? `<img src="${companySettings.logoUrl}" style="max-height: 80px; max-width: 200px; object-fit: contain;" />`
          : `<div class="logo">${companySettings.logoText}</div>`;

      // Format numbers
      const fmt = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const html = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <title>التقرير المالي - ${selectedYear}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap" rel="stylesheet">
            <style>
                @page { size: A4; margin: 0; }
                body { 
                    font-family: 'Cairo', sans-serif; 
                    color: #1e293b; 
                    padding: 0;
                    margin: 0; 
                    width: 210mm; 
                    min-height: 297mm;
                    box-sizing: border-box; 
                    direction: rtl; 
                    background: white; 
                    -webkit-print-color-adjust: exact;
                }
                .print-container {
                    padding: 15mm;
                    width: 100%;
                    box-sizing: border-box;
                }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0ea5e9; padding-bottom: 15px; margin-bottom: 25px; }
                .logo { font-size: 24px; font-weight: 900; color: #0ea5e9; }
                .company-name { font-size: 14px; font-weight: bold; margin-top: 5px; }
                .meta { text-align: left; font-size: 11px; color: #64748b; }
                
                .report-title { text-align: center; font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 5px; }
                .report-subtitle { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 30px; }
                
                .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
                .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; }
                .card-label { font-size: 11px; color: #64748b; margin-bottom: 5px; }
                .card-value { font-size: 16px; font-weight: 800; color: #0f172a; direction: ltr; }
                .card-value.profit { color: #10b981; }
                .card-value.expense { color: #f43f5e; }

                table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
                thead { background: #f1f5f9; border-bottom: 2px solid #cbd5e1; }
                th { padding: 10px; text-align: right; color: #475569; font-weight: 700; }
                td { padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
                tr:last-child td { border-bottom: none; }
                .total-row { background: #f8fafc; font-weight: 800; border-top: 2px solid #cbd5e1; }
                
                .footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="header">
                    <div>
                        ${logoHtml}
                        <div class="company-name">${companySettings.nameAr}</div>
                    </div>
                    <div class="meta">
                        <div>تاريخ الطباعة: ${new Date().toLocaleDateString('en-GB')}</div>
                        <div>السنة المالية: ${selectedYear}</div>
                        <div>العملة: ${systemCurrency}</div>
                    </div>
                </div>

                <div class="report-title">التقرير المالي العام</div>
                <div class="report-subtitle">
                    الفترة: ${selectedMonth === 'All' ? 'كامل العام' : `شهر ${Number(selectedMonth) + 1}`} | 
                    القطاع: ${selectedType === 'All' ? 'جميع القطاعات' : selectedType}
                </div>

                <div class="summary-cards">
                    <div class="card">
                        <div class="card-label">إجمالي المبيعات</div>
                        <div class="card-value">${fmt(convertAmount(reportData.totalSales))}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">التكلفة المباشرة</div>
                        <div class="card-value">${fmt(convertAmount(reportData.totalCost))}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">مصاريف تشغيلية</div>
                        <div class="card-value expense">${fmt(convertAmount(reportData.operationalExpenses))}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">صافي الربح</div>
                        <div class="card-value profit">${fmt(convertAmount(reportData.netProfit))}</div>
                    </div>
                </div>

                <h3>تفاصيل الأداء الشهري</h3>
                <table>
                    <thead>
                        <tr>
                            <th>الشهر</th>
                            <th>المبيعات</th>
                            <th>التكلفة المباشرة</th>
                            ${selectedType === 'All' ? '<th>مصاريف تشغيلية</th>' : ''}
                            <th>صافي الربح</th>
                            <th>النسبة %</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.monthlyData.map(row => `
                            <tr>
                                <td><strong>${row.name}</strong></td>
                                <td>${row.Sales.toLocaleString('en-US')}</td>
                                <td>${row.Cost.toLocaleString('en-US')}</td>
                                ${selectedType === 'All' ? `<td style="color: #f43f5e;">${row.Expenses.toLocaleString('en-US')}</td>` : ''}
                                <td style="font-weight: bold; color: ${row.Profit >= 0 ? '#10b981' : '#f43f5e'}; direction: ltr; text-align: right;">${row.Profit.toLocaleString('en-US')}</td>
                                <td>${row.Sales > 0 ? Math.round((row.Profit / row.Sales) * 100) : 0}%</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td>المجموع الكلي</td>
                            <td>${fmt(convertAmount(reportData.totalSales))}</td>
                            <td>${fmt(convertAmount(reportData.totalCost))}</td>
                            ${selectedType === 'All' ? `<td style="color: #f43f5e;">${fmt(convertAmount(reportData.operationalExpenses))}</td>` : ''}
                            <td style="direction: ltr; text-align: right; color: ${reportData.netProfit >= 0 ? '#10b981' : '#f43f5e'};">${fmt(convertAmount(reportData.netProfit))}</td>
                            <td>-</td>
                        </tr>
                    </tbody>
                </table>

                <div class="footer">
                    تم إصدار هذا التقرير من نظام ${companySettings.logoText} | ${companySettings.phone}
                </div>
            </div>
            <script>window.print();</script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="text-cyan-600 dark:text-cyan-400" />
                التقارير المالية والتحليل
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">نظرة شاملة على أداء الشركة المالي والأرباح</p>
        </div>
        <button onClick={handlePrintReport} className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
            <Printer size={18} /> طباعة التقرير
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-4 print:hidden">
          <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-bold">
                  <Filter size={16} /> تصفية النتائج:
              </div>
              
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm dark:text-white focus:outline-none">
                  {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                  ))}
              </select>

              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm dark:text-white focus:outline-none">
                  <option value="All">كل الأشهر</option>
                  {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>{new Date(2000, i, 1).toLocaleString('ar-EG', { month: 'long' })}</option>
                  ))}
              </select>

              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm dark:text-white focus:outline-none">
                  <option value="All">جميع القطاعات</option>
                  {bookingTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                  ))}
              </select>
          </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">إجمالي المبيعات</p>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg"><DollarSign size={16}/></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white dir-ltr">{convertAmount(reportData.totalSales).toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-sm">{systemCurrency}</span></h3>
          </div>
          
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">التكلفة المباشرة (COGS)</p>
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-lg"><TrendingDown size={16}/></div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white dir-ltr">{convertAmount(reportData.totalCost).toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-sm">{systemCurrency}</span></h3>
          </div>

          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">مصاريف تشغيلية</p>
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/20 text-rose-600 rounded-lg"><TrendingDown size={16}/></div>
              </div>
              <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 dir-ltr">{convertAmount(reportData.operationalExpenses).toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-sm">{systemCurrency}</span></h3>
          </div>

          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="flex justify-between items-start mb-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">صافي الربح (Net Profit)</p>
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-lg"><TrendingUp size={16}/></div>
              </div>
              <h3 className={`text-3xl font-bold dir-ltr ${reportData.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'}`}>
                  {convertAmount(reportData.netProfit).toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-sm">{systemCurrency}</span>
              </h3>
          </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">الأداء الشهري (مبيعات vs أرباح)</h3>
             <div className="h-80 w-full dir-ltr">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                          cursor={{ fill: 'transparent' }}
                       />
                       <Legend wrapperStyle={{ paddingTop: '20px' }} />
                       <Bar dataKey="Sales" name="المبيعات" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                       <Bar dataKey="Profit" name="الربح" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                 </ResponsiveContainer>
             </div>
          </div>

          {/* Pie Charts */}
          <div className="space-y-6">
              <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 h-[240px]">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                      <PieChartIcon size={16} className="text-cyan-500"/> توزيع المبيعات حسب النوع
                  </h3>
                  <div className="h-full w-full -mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={reportData.salesByType}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                fill="#8884d8"
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {reportData.salesByType.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                  </div>
              </div>

              {selectedType === 'All' && (
                  <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 h-[240px]">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                          <PieChartIcon size={16} className="text-rose-500"/> توزيع المصروفات
                      </h3>
                      <div className="h-full w-full -mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={reportData.expenseChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {reportData.expenseChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default ReportsPage;
