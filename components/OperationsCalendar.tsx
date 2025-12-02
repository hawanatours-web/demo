
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ChevronLeft, ChevronRight, Plane, Wallet, AlertCircle, CheckSquare, X, Calendar as CalendarIcon, Ticket } from 'lucide-react';
import { Booking, Task } from '../types';

const OperationsCalendar: React.FC = () => {
  const { allBookings, tasks, systemCurrency, convertAmount, t, language } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: Date; events: CalendarEvent[] } | null>(null);

  // Helper types for internal use
  type EventType = 'travel' | 'payment' | 'task';
  
  interface CalendarEvent {
    id: string;
    date: Date;
    title: string;
    type: EventType;
    details?: string;
    amount?: number;
    status?: string;
  }

  // Generate Events from Data
  const events = useMemo(() => {
    const evts: CalendarEvent[] = [];

    // 1. Bookings (Travel Dates) - GREEN
    allBookings.forEach(booking => {
        if (booking.status !== 'ملغي' && booking.status !== 'لاغي (Void)') {
            evts.push({
                id: booking.id,
                date: new Date(booking.date),
                title: `${booking.clientName} - ${booking.destination}`,
                type: 'travel',
                details: `رقم الملف: ${booking.fileNo || booking.id} | الحالة: ${booking.status}`,
                status: booking.status
            });

            // 2. Unpaid/Partial Payment Alerts - RED
            // If booking is confirmed but not paid fully, show alert on travel date
            if (booking.paymentStatus !== 'Paid' && booking.amount > booking.paidAmount) {
                evts.push({
                    id: `pay-${booking.id}`,
                    date: new Date(booking.date),
                    title: `تحصيل ذمة: ${booking.clientName}`,
                    type: 'payment',
                    amount: booking.amount - booking.paidAmount,
                    details: `المتبقي: ${convertAmount(booking.amount - booking.paidAmount).toFixed(2)} ${systemCurrency}`
                });
            }
        }
    });

    // 3. Tasks - YELLOW
    tasks.forEach(task => {
        if (task.status !== 'Completed') {
            evts.push({
                id: task.id,
                date: new Date(task.dueDate),
                title: `مهمة: ${task.title}`,
                type: 'task',
                details: `${task.description || ''} (المسؤول: ${task.assignedTo || 'غير محدد'})`,
                status: task.priority
            });
        }
    });

    return evts;
  }, [allBookings, tasks, systemCurrency, convertAmount]);

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sun
  
  // Adjust for Saturday start (since many Arab countries start week on Saturday)
  // Standard JS: 0=Sun, 1=Mon... 6=Sat. 
  // We want grid: Sat, Sun, Mon, Tue, Wed, Thu, Fri
  // Shift: Sat=0, Sun=1...
  const startDayOffset = (firstDayOfMonth + 1) % 7; 

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startDayOffset }, (_, i) => i);

  const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const weekDaysAr = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  const weekDaysEn = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

  const currentMonthName = language === 'ar' ? monthNamesAr[currentDate.getMonth()] : monthNamesEn[currentDate.getMonth()];
  const weekDays = language === 'ar' ? weekDaysAr : weekDaysEn;

  const prevMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDayEvents = (day: number) => {
      return events.filter(e => 
          e.date.getDate() === day && 
          e.date.getMonth() === currentDate.getMonth() && 
          e.date.getFullYear() === currentDate.getFullYear()
      );
  };

  const handleDayClick = (day: number) => {
      const dayEvents = getDayEvents(day);
      if (dayEvents.length > 0) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          setSelectedDayEvents({ date, events: dayEvents });
      }
  };

  const getEventColor = (type: EventType) => {
      switch(type) {
          case 'travel': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
          case 'payment': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
          case 'task': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
          default: return 'bg-slate-100 text-slate-700';
      }
  };

  const getEventIcon = (type: EventType) => {
      switch(type) {
          case 'travel': return <Plane size={12} />;
          case 'payment': return <Wallet size={12} />;
          case 'task': return <CheckSquare size={12} />;
      }
  };

  // Determine chevron direction based on language (RTL vs LTR)
  const PrevIcon = language === 'ar' ? ChevronRight : ChevronLeft;
  const NextIcon = language === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <CalendarIcon className="text-cyan-600 dark:text-cyan-400" />
                    {t('calendar')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">متابعة الرحلات، التحصيلات المالية، والمهام اليومية</p>
            </div>
            
            <div className="flex items-center gap-4 bg-white dark:bg-[#1e293b] p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"><PrevIcon size={20}/></button>
                <div className="text-center w-40">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{currentMonthName} {currentDate.getFullYear()}</h3>
                </div>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"><NextIcon size={20}/></button>
            </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 dark:text-slate-300">سفر / رحلات (Travel)</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="text-slate-600 dark:text-slate-300">تحصيل مالي / دفعات (Payments)</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-slate-600 dark:text-slate-300">مهام ومتابعة (Tasks)</span>
            </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a]">
                {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-sm font-bold text-slate-600 dark:text-slate-400">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 dark:bg-slate-800 gap-[1px]">
                {/* Empty slots for start of month */}
                {emptyDays.map(i => (
                    <div key={`empty-${i}`} className="bg-white dark:bg-[#1e293b] min-h-[120px]"></div>
                ))}

                {/* Actual Days */}
                {daysArray.map(day => {
                    const dayEvents = getDayEvents(day);
                    const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

                    return (
                        <div 
                            key={day} 
                            onClick={() => handleDayClick(day)}
                            className={`bg-white dark:bg-[#1e293b] min-h-[120px] p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group flex flex-col gap-1 ${isToday ? 'bg-cyan-50/30 dark:bg-cyan-900/10' : ''}`}
                        >
                            <span className={`text-sm font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-cyan-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                {day}
                            </span>
                            
                            {/* Events List (Max 3 visible) */}
                            {dayEvents.slice(0, 3).map((evt, idx) => (
                                <div key={`${evt.id}-${idx}`} className={`text-[10px] px-1.5 py-1 rounded border truncate flex items-center gap-1 ${getEventColor(evt.type)}`}>
                                    {getEventIcon(evt.type)}
                                    <span className="truncate">{evt.title}</span>
                                </div>
                            ))}
                            
                            {dayEvents.length > 3 && (
                                <div className="text-[10px] text-slate-400 text-center mt-1">
                                    +{dayEvents.length - 3} المزيد
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Event Details Modal */}
        {selectedDayEvents && (
            <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
                <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                    <div className="bg-slate-50 dark:bg-[#0f172a] p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                            <CalendarIcon size={20} className="text-cyan-600" />
                            أحداث {selectedDayEvents.date.toLocaleDateString('en-GB')}
                        </h3>
                        <button onClick={() => setSelectedDayEvents(null)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20}/></button>
                    </div>
                    <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                        {selectedDayEvents.events.map((evt, idx) => (
                            <div key={`${evt.id}-${idx}`} className={`p-3 rounded-lg border ${getEventColor(evt.type)}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 font-bold mb-1">
                                        {getEventIcon(evt.type)}
                                        {evt.title}
                                    </div>
                                    <span className="text-[10px] font-bold opacity-70 px-2 py-0.5 rounded bg-white/50">{evt.status}</span>
                                </div>
                                <p className="text-xs opacity-80 mt-1">{evt.details}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-700 text-center">
                        <button onClick={() => setSelectedDayEvents(null)} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-300 transition-colors">إغلاق</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default OperationsCalendar;
