
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import StatCard from './StatCard';
import { NavPage, Booking, TransactionType, Currency } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, Users, CreditCard, Plane, CalendarClock, X, FileText, User, CheckCircle2, CalendarRange, BadgeDollarSign, ChevronDown } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: NavPage) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { stats, bookings, transactions, systemCurrency, setSystemCurrency, exchangeRates, convertAmount, agents, t, language } = useData();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const recentBookings = bookings.slice(0, 5);

  // --- Calculate Financial Performance (Real Data) ---
  const financialData = useMemo(() => {
      const currentYear = new Date().getFullYear();
      
      // Initialize 12 months
      const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
          monthIndex: i,
          income: 0,
          expense: 0
      }));

      transactions.forEach(t => {
          const tDate = new Date(t.date);
          if (tDate.getFullYear() === currentYear) {
              const monthIndex = tDate.getMonth();
              const amount = convertAmount(t.amount); // Convert to selected system currency

              if (t.type === TransactionType.INCOME) {
                  monthlyStats[monthIndex].income += amount;
              } else if (t.type === TransactionType.EXPENSE) {
                  monthlyStats[monthIndex].expense += amount;
              }
          }
      });

      // Format for Chart (Always English Month names for consistency with digits)
      return monthlyStats.map(stat => {
          const date = new Date(currentYear, stat.monthIndex, 1);
          const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
          return {
              name: monthName,
              income: Number(stat.income.toFixed(2)),
              expense: Number(stat.expense.toFixed(2))
          };
      });
  }, [transactions, language, convertAmount]);

  // Calculate Most Active Agents
  const agentActivity = useMemo(() => {
      const counts: Record<string, number> = {};
      let totalServices = 0;
      bookings.forEach(b => {
          b.services.forEach(s => {
              if(s.supplier) {
                  counts[s.supplier] = (counts[s.supplier] || 0) + 1;
                  totalServices++;
              }
          });
      });

      return Object.entries(counts)
          .map(([name, count]) => ({ name, count, percentage: totalServices ? Math.round((count / totalServices) * 100) : 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);
  }, [bookings]);

  // Calculate Weekly Bookings (Current Week: Saturday to Friday) based on Travel Date
  const weeklyServices = useMemo(() => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Mon, ..., 6 = Sat
      
      // Logic: Week starts on Saturday
      const daysSinceSaturday = (currentDay + 1) % 7;
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - daysSinceSaturday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Friday
      endOfWeek.setHours(23, 59, 59, 999);

      const bookingsInWeek: any[] = [];

      bookings.forEach(booking => {
          // Link to Booking Travel Date (booking.date)
          const travelDate = new Date(booking.date);
          
          if (travelDate >= startOfWeek && travelDate <= endOfWeek) {
              bookingsInWeek.push({
                  id: booking.id,
                  bookingFileNo: booking.fileNo || booking.id,
                  clientName: booking.clientName,
                  type: booking.type,
                  date: travelDate,
                  details: booking.destination,
                  status: booking.status
              });
          }
      });

      return bookingsInWeek.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [bookings]);

  const getDayName = (date: Date) => {
      return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('dashboard')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Overview of company performance</p>
        </div>
        
        {/* Header Controls (Date & Currency) */}
        <div className="flex items-center gap-3 hidden md:flex">
           {/* Currency Selector */}
           <div className="relative">
               <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-cyan-600 dark:text-cyan-400">
                   <BadgeDollarSign size={14} />
               </div>
               <select 
                   value={systemCurrency} 
                   onChange={(e) => setSystemCurrency(e.target.value as Currency)}
                   className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-1.5 pl-8 pr-8 rounded-lg focus:outline-none focus:border-cyan-500 cursor-pointer shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
               >
                   {Object.keys(exchangeRates).map(c => (
                       <option key={c} value={c}>{c}</option>
                   ))}
               </select>
               <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
                   <ChevronDown size={12} />
               </div>
           </div>

           <div className={`bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700`}>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-bold flex items-center gap-2">
                 <CalendarClock size={14} className="text-cyan-600 dark:text-cyan-400"/>
                 {new Date().toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
               </p>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('total_sales')}
          value={`${convertAmount(stats.totalSales).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${systemCurrency}`}
          trend={12}
          icon={<Wallet size={24} className="text-white" />}
          color="blue"
          currencyLabel="Total Sales"
        />
        <StatCard
          title={t('collected')}
          value={`${convertAmount(stats.totalPaid).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${systemCurrency}`}
          trend={8}
          icon={<CreditCard size={24} className="text-white" />}
          color="green"
          currencyLabel="Collected"
        />
        <StatCard
          title={t('pending')}
          value={`${convertAmount(stats.totalPending).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${systemCurrency}`}
          trend={-5}
          icon={<Users size={24} className="text-white" />}
          color="yellow"
          currencyLabel="Pending"
        />
        <StatCard
          title={t('total_expenses')}
          value={`${convertAmount(stats.totalExpenses).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${systemCurrency}`}
          trend={2}
          icon={<TrendingUp size={24} className="text-white" />}
          color="red"
          currencyLabel="Expenses"
        />
      </div>

      {/* Charts & Recent Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('financial_performance')}</h3>
                <span className="text-xs text-slate-500 font-mono">{new Date().getFullYear()}</span>
             </div>
             <div className="h-80 w-full dir-ltr">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} vertical={false} />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                          cursor={{ fill: 'transparent' }}
                       />
                       <Legend wrapperStyle={{ paddingTop: '20px' }} />
                       <Bar dataKey="income" name={t('income')} fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                       <Bar dataKey="expense" name={t('expense')} fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                 </ResponsiveContainer>
             </div>
          </div>

          {/* Indicators & Recent */}
          <div className="space-y-6">
              {/* Indicators */}
              <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">{t('most_active_agents')}</h3>
                  <div className="space-y-4">
                      {agentActivity.length > 0 ? agentActivity.map((agent, idx) => (
                          <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                  <span className="text-slate-600 dark:text-slate-300">{agent.name}</span>
                                  <span className="text-slate-500">{agent.percentage}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                  <div 
                                      className={`h-1.5 rounded-full ${idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-cyan-500' : 'bg-purple-500'}`} 
                                      style={{ width: `${agent.percentage}%` }}
                                  ></div>
                              </div>
                          </div>
                      )) : (
                          <p className="text-xs text-slate-500 text-center py-4">No data</p>
                      )}
                  </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t('recent_bookings')}</h3>
                      <button onClick={() => onNavigate(NavPage.BOOKINGS)} className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">{t('view_all')}</button>
                  </div>
                  <div className="overflow-x-auto">
                      <table className={`w-full text-${language === 'ar' ? 'right' : 'left'}`}>
                          <thead className="text-[10px] uppercase text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                              <tr>
                                  <th className="px-2 py-2">#</th>
                                  <th className="px-2 py-2">Client</th>
                                  <th className="px-2 py-2">Type</th>
                                  <th className="px-2 py-2">Date</th>
                                  <th className="px-2 py-2 text-center">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                              {recentBookings.map((booking, idx) => (
                                  <tr key={booking.id}>
                                      <td className="px-2 py-2 font-mono">{idx + 1}</td>
                                      <td className="px-2 py-2 font-bold text-slate-700 dark:text-slate-200">{booking.clientName}</td>
                                      <td className="px-2 py-2">{booking.type}</td>
                                      <td className="px-2 py-2 text-slate-500 font-mono">{new Date(booking.createdAt || booking.date).toLocaleDateString('en-GB')}</td>
                                      <td className="px-2 py-2 text-center">
                                          <button onClick={() => setSelectedBooking(booking)} className="px-2 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-500">{t('view')}</button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      </div>

      {/* Weekly Schedule Widget */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-lg text-cyan-600 dark:text-cyan-400">
                  <CalendarRange size={24} />
              </div>
              <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('current_week_bookings')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('current_week_desc')}</p>
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className={`w-full text-${language === 'ar' ? 'right' : 'left'}`}>
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs uppercase font-bold">
                      <tr>
                          <th className="px-4 py-3 rounded-r-lg">Day</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Client / File</th>
                          <th className="px-4 py-3">Destination</th>
                          <th className="px-4 py-3 rounded-l-lg text-center">Status</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                      {weeklyServices.length > 0 ? weeklyServices.map((item, idx) => (
                          <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{getDayName(item.date)}</td>
                              <td className="px-4 py-3 font-mono text-slate-500 text-xs">{item.date.toLocaleDateString('en-GB')}</td>
                              <td className="px-4 py-3">
                                  <span className={`px-2 py-1 rounded text-[10px] border ${
                                      item.type === 'Flight' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
                                      item.type === 'Tourism' ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' :
                                      item.type === 'Umrah' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                                      'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                  }`}>
                                      {item.type}
                                  </span>
                              </td>
                              <td className="px-4 py-3">
                                  <div className="font-bold text-slate-700 dark:text-slate-300">{item.clientName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{item.bookingFileNo}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">{item.details}</td>
                              <td className="px-4 py-3 text-center">
                                  <span className={`text-[10px] px-2 py-1 rounded-full ${item.status === 'مؤكد' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {item.status}
                                  </span>
                              </td>
                          </tr>
                      )) : (
                          <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-500">No scheduled bookings for this week</td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* View Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 z-10">
                    <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                        <FileText className="text-cyan-600 dark:text-cyan-400" size={20} />
                        {t('details')}: {selectedBooking.fileNo || selectedBooking.id}
                    </h3>
                    <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Client</p>
                            <p className="font-bold text-slate-800 dark:text-white">{selectedBooking.clientName}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Destination</p>
                            <p className="font-bold text-slate-800 dark:text-white">{selectedBooking.destination}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Date</p>
                            <p className="font-bold text-slate-800 dark:text-white font-mono">{new Date(selectedBooking.date).toLocaleDateString('en-GB')}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Status</p>
                            <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded text-xs font-bold">{selectedBooking.status}</span>
                        </div>
                    </div>

                    {/* Financials */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3 flex items-center gap-2"><Wallet size={16}/> Financial Summary</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800 rounded-lg">
                                <p className="text-xs text-emerald-600 mb-1">Total</p>
                                <p className="font-bold text-emerald-700 dark:text-emerald-400 dir-ltr">{convertAmount(selectedBooking.amount).toFixed(2)} {systemCurrency}</p>
                            </div>
                            <div className="p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 rounded-lg">
                                <p className="text-xs text-blue-600 mb-1">Paid</p>
                                <p className="font-bold text-blue-700 dark:text-blue-400 dir-ltr">{convertAmount(selectedBooking.paidAmount).toFixed(2)} {systemCurrency}</p>
                            </div>
                            <div className="p-3 border border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-800 rounded-lg">
                                <p className="text-xs text-rose-600 mb-1">Due</p>
                                <p className="font-bold text-rose-700 dark:text-rose-400 dir-ltr">{convertAmount(selectedBooking.amount - selectedBooking.paidAmount).toFixed(2)} {systemCurrency}</p>
                            </div>
                        </div>
                    </div>

                    {/* Passengers */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3 flex items-center gap-2"><User size={16}/> Passengers ({selectedBooking.passengers.length})</h4>
                        <div className="space-y-2">
                            {selectedBooking.passengers.map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">{i+1}</span>
                                        <span className="text-slate-700 dark:text-slate-300">{p.title} {p.fullName}</span>
                                    </div>
                                    <span className="text-xs text-slate-500">{p.passportNo || 'No Passport'}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Services */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-3 flex items-center gap-2"><CheckCircle2 size={16}/> Services ({selectedBooking.services.length})</h4>
                        <div className="space-y-2">
                            {selectedBooking.services.map((s, i) => (
                                <div key={i} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{s.type}</span>
                                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{s.supplier}</span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {s.airline ? `${s.airline} - ${s.route}` : 
                                         s.hotelName ? `${s.hotelName} - ${s.roomType}` : 
                                         s.details || s.country}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-700 text-center">
                    <button onClick={() => setSelectedBooking(null)} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">Close</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;