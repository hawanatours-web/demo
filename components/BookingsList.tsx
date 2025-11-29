
import React, { useState, useEffect, useMemo } from 'react';
import { BookingStatus, Booking, Payment, Currency, TransactionType } from '../types';
import { Search, Plus, X, Trash2, Plane, FileText, Edit, Coins, Users, Filter, Wallet, Landmark, Calendar, CheckCircle2, FileCheck, MessageCircle, Phone, Copy, Send, ChevronLeft, ChevronRight, AlertTriangle, Printer } from 'lucide-react';
import { useData } from '../context/DataContext';
import BookingFormModal from './BookingFormModal';

const BookingsList: React.FC = () => {
  const { bookings, clients, treasury, deleteBooking, addBookingPayment, systemCurrency, convertAmount, showNotification, currentUser, exchangeRates, companySettings, fetchBookings, bookingsPage, bookingsTotal } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // --- Filtering State ---
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState('');

  // --- Edit / View Mode State ---
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Payment Modal State ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>(''); 
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>('JOD');
  const [exchangeRate, setExchangeRate] = useState<string>('1'); 
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [selectedTreasuryId, setSelectedTreasuryId] = useState<string>('');
  
  // --- WhatsApp Modal State ---
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [whatsAppPhone, setWhatsAppPhone] = useState('');

  // --- Delete Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookingToDeleteId, setBookingToDeleteId] = useState<string | null>(null);

  // Trigger server-side fetch when filters change (with debounce for search)
  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
          fetchBookings(1, searchTerm, { dateFrom, dateTo, type: filterType });
      }, 500);

      return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, dateFrom, dateTo, filterType]);

  const handlePageChange = (newPage: number) => {
      fetchBookings(newPage, searchTerm, { dateFrom, dateTo, type: filterType });
  };

  const totalPages = Math.ceil(bookingsTotal / 25); // 25 is PAGE_SIZE

  // Helper to get translated label
  const getTypeLabel = (type: any) => {
      const t = String(type);
      const map: Record<string, string> = {
          'Tourism': 'سياحة',
          'Flight': 'طيران',
          'General': 'عام',
          'Umrah': 'عمرة',
          'Hotel': 'فندق',
          'Visa': 'تأشيرة'
      };
      return map[t] || t;
  };

  // Dynamic Unique Types based on existing bookings + defaults
  const uniqueTypes = useMemo(() => {
      const defaults = ['Tourism', 'Flight', 'General', 'Umrah', 'Hotel', 'Visa'];
      const existingTypes = bookings.map(b => b.type).filter(Boolean);
      return Array.from(new Set([...defaults, ...existingTypes]));
  }, [bookings]);

  // Effect for Exchange Rate in Payment Modal
  useEffect(() => {
      if (exchangeRates[paymentCurrency]) {
          setExchangeRate(exchangeRates[paymentCurrency].toString());
      }
  }, [paymentCurrency, exchangeRates]);

  // --- Handlers ---

  const handleOpenCreate = () => {
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (booking: Booking) => {
    setEditingId(booking.id);
    setIsModalOpen(true);
  };

  const handleOpenPayment = (booking: Booking) => {
      setSelectedBookingForPayment(booking);
      setPaymentAmount('');
      setPaymentCurrency('JOD');
      setExchangeRate('1');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentNotes('');
      setSelectedTreasuryId(treasury.length > 0 ? treasury[0].id : '');
      setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBookingForPayment || !paymentAmount) return;

      const numericAmount = parseFloat(paymentAmount);
      const rateValue = parseFloat(exchangeRate);

      if (isNaN(numericAmount) || numericAmount <= 0 || isNaN(rateValue)) {
           showNotification('يرجى إدخال مبلغ وسعر صرف صحيح', 'error');
           return;
      }

      const finalAmountJOD = numericAmount * rateValue;

      const payment: Payment = {
          id: `pay-${Date.now()}`,
          amount: numericAmount,
          currency: paymentCurrency,
          exchangeRate: rateValue,
          finalAmount: finalAmountJOD,
          date: paymentDate,
          notes: paymentNotes,
          treasuryId: selectedTreasuryId
      };

      addBookingPayment(selectedBookingForPayment.id, payment);
      showNotification('تم تسجيل الدفعة بنجاح', 'success');
      setIsPaymentModalOpen(false);
  };

  const handleDelete = (id: string) => {
      setBookingToDeleteId(id);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if (bookingToDeleteId) {
          deleteBooking(bookingToDeleteId);
          showNotification('تم حذف الحجز بنجاح', 'success');
          setIsDeleteModalOpen(false);
      }
  };

  // --- Voucher Logic ---
  const handleBookingVoucher = (booking: Booking) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const showLogo = companySettings.logoUrl && (companySettings.logoVisibility === 'both' || companySettings.logoVisibility === 'print');
      const logoHtml = showLogo 
          ? `<img src="${companySettings.logoUrl}" style="max-height: 100px; max-width: 250px; object-fit: contain; border: 1px solid #cbd5e1; padding: 4px; border-radius: 4px;" />`
          : `<div class="logo">${companySettings.logoText}</div>`;

      const servicesHtml = booking.services.map((s, i) => {
          let details = '';
          let dates = s.date || '-';

          if (s.type === 'Flight') {
              details = `
                <div><strong>Airline:</strong> ${s.airline || '-'}</div>
                <div><strong>Route:</strong> ${s.route || '-'}</div>
                ${s.ticketNumber ? `<div><strong>Ticket:</strong> ${s.ticketNumber}</div>` : ''}
                ${s.pnr ? `<div><strong>PNR:</strong> ${s.pnr}</div>` : ''}
              `;
              dates = `Dep: ${s.flightDate || '-'} ${s.departureTime ? `@ ${s.departureTime}` : ''}<br/>Ret: ${s.returnDate || '-'} ${s.arrivalTime ? `@ ${s.arrivalTime}` : ''}`;
          } 
          else if (s.type === 'Hotel') {
              details = `
                <div><strong>Hotel:</strong> ${s.hotelName || '-'}</div>
                ${s.hotelAddress ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">📍 ${s.hotelAddress}</div>` : ''}
                <div><strong>Room:</strong> ${s.roomType || '-'}</div>
              `;
              dates = `In: ${s.checkIn || '-'}<br/>Out: ${s.checkOut || '-'}`;
          } 
          else if (s.type === 'Visa') {
              details = `
                <div><strong>Country:</strong> ${s.country || '-'}</div>
                <div><strong>Type:</strong> ${s.visaType || '-'}</div>
                ${s.details ? `<div>${s.details}</div>` : ''}
              `;
          } 
          else if (s.type === 'Transport') {
              const routesHtml = s.routes && s.routes.length > 0 
                  ? s.routes.map(r => `<div>• ${r.from} ➝ ${r.to}</div>`).join('') 
                  : `<div><strong>From:</strong> ${s.pickupLocation || '-'}</div><div><strong>To:</strong> ${s.dropoffLocation || '-'}</div>`;
              
              details = `
                <div><strong>Vehicle:</strong> ${s.vehicleType || '-'}</div>
                <div style="margin-top:4px;">${routesHtml}</div>
              `;
              dates = s.transportDate || '-';
          } 
          else {
              details = s.details || '-';
          }

          return `
            <tr>
                <td style="text-align: center;">${i + 1}</td>
                <td style="font-weight: bold;">${s.type}</td>
                <td>${details}</td>
                <td style="text-align: center;">${s.quantity}</td>
                <td style="font-family: monospace; font-size: 11px;">${dates}</td>
            </tr>
          `;
      }).join('');

      const voucherHTML = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <title>Booking Voucher - ${booking.fileNo}</title>
            <style>
                @page { size: A4; margin: 15mm; }
                body { font-family: system-ui, sans-serif; color: #1e293b; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0ea5e9; padding-bottom: 15px; margin-bottom: 20px; }
                .title { text-align: center; font-size: 24px; font-weight: bold; color: #0f172a; margin: 20px 0; text-transform: uppercase; letter-spacing: 2px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 8px; }
                .label { font-size: 12px; color: #64748b; font-weight: bold; }
                .value { font-size: 14px; font-weight: bold; color: #0f172a; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: #0ea5e9; color: white; padding: 10px; text-align: right; font-size: 12px; }
                td { border-bottom: 1px solid #e2e8f0; padding: 10px; font-size: 12px; vertical-align: top; }
                .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div style="text-align: right;">
                    ${logoHtml}
                    <h2 style="margin: 5px 0; font-size: 16px;">${companySettings.nameAr}</h2>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">${companySettings.address}</p>
                </div>
                <div style="text-align: left;">
                    <h3 style="margin: 0; color: #0ea5e9;">BOOKING VOUCHER</h3>
                    <p style="margin: 5px 0; font-size: 12px;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
                    <p style="margin: 0; font-size: 12px;"><strong>Ref:</strong> ${booking.fileNo || booking.id}</p>
                </div>
            </div>

            <div class="title">CONFIRMATION</div>

            <div class="info-grid">
                <div>
                    <div class="label">CLIENT NAME</div>
                    <div class="value">${booking.clientName}</div>
                    ${booking.clientPhone ? `<div style="font-size: 11px; margin-top: 2px; color: #64748b;">${booking.clientPhone}</div>` : ''}
                </div>
                <div><div class="label">DESTINATION</div><div class="value">${booking.destination}</div></div>
                <div><div class="label">STATUS</div><div class="value" style="color: #10b981;">${booking.status}</div></div>
                <div><div class="label">TRAVELERS</div><div class="value">${booking.passengers.length} PAX</div></div>
            </div>

            <h3>PASSENGER LIST</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 50px; text-align: center;">#</th>
                        <th>FULL NAME</th>
                        <th>TYPE</th>
                        <th>PASSPORT NO</th>
                    </tr>
                </thead>
                <tbody>
                    ${booking.passengers.map((p, index) => `
                        <tr>
                            <td style="text-align: center;">${index + 1}</td>
                            <td style="font-weight: bold;">${p.title ? `${p.title}. ` : ''}${p.fullName}</td>
                            <td>${p.type}</td>
                            <td style="font-family: monospace;">${p.passportNo || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <h3>SERVICE DETAILS</h3>
            <table>
                <thead><tr><th style="text-align: center;">#</th><th>TYPE</th><th>DETAILS</th><th style="text-align: center;">QTY</th><th>DATES</th></tr></thead>
                <tbody>${servicesHtml}</tbody>
            </table>

            <div style="margin-top: 20px; padding: 15px; border: 1px dashed #cbd5e1; background: #fffbeb;">
                <strong>Notes:</strong> ${booking.notes || 'No specific notes.'}
            </div>

            <div class="footer">
                <p>Thank you for booking with ${companySettings.nameEn}</p>
                <p>${companySettings.phone} | ${companySettings.email}</p>
            </div>
            <script>window.print();</script>
        </body>
        </html>
      `;
      printWindow.document.write(voucherHTML);
      printWindow.document.close();
  };

  // --- WHATSAPP PREVIEW LOGIC ---
  const handleWhatsApp = (booking: Booking) => {
      const remaining = booking.amount - booking.paidAmount;
      const phone = booking.clientPhone ? booking.clientPhone.replace(/[^0-9]/g, '') : '';
      
      const text = `
*تفاصيل الحجز - ${companySettings.nameAr}*
---------------------------
📄 *رقم الملف:* ${booking.fileNo || booking.id}
👤 *العميل:* ${booking.clientName}
✈️ *الوجهة:* ${booking.destination}
📅 *التاريخ:* ${new Date(booking.date).toLocaleDateString('en-GB')}
---------------------------
💰 *الإجمالي:* ${convertAmount(booking.amount).toFixed(2)} ${systemCurrency}
✅ *المدفوع:* ${convertAmount(booking.paidAmount).toFixed(2)} ${systemCurrency}
${remaining > 0 ? `❗ *المتبقي:* ${convertAmount(remaining).toFixed(2)} ${systemCurrency}` : '🎉 *خالص الدفع*'}
---------------------------
للاستفسار: ${companySettings.phone}
      `.trim();

      setWhatsAppMessage(text);
      setWhatsAppPhone(phone);
      setIsWhatsAppModalOpen(true);
  };

  const confirmSendWhatsApp = () => {
      if (!whatsAppPhone) {
          showNotification('يرجى إدخال رقم هاتف العميل', 'error');
          return;
      }
      const url = `https://wa.me/${whatsAppPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsAppMessage)}`;
      window.open(url, '_blank', 'width=800,height=600,left=200,top=100');
      setIsWhatsAppModalOpen(false);
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(whatsAppMessage);
      showNotification('تم نسخ النص', 'success');
  };

  const handlePrintInvoice = (booking: Booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const remaining = booking.amount - booking.paidAmount;
    const showLogo = companySettings.logoUrl && (companySettings.logoVisibility === 'both' || companySettings.logoVisibility === 'print');
    const logoHtml = showLogo 
        ? `<img src="${companySettings.logoUrl}" style="max-height: 100px; max-width: 250px; object-fit: contain; border: 1px solid #cbd5e1; padding: 4px; border-radius: 4px;" />`
        : `<div class="logo">${companySettings.logoText}</div>`;

    const invoiceHTML = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><title>Tax Invoice</title><style>@page{size:A4;margin:15mm}body{font-family:system-ui;font-size:9pt}.header{display:flex;justify-content:space-between;border-bottom:2px solid #06b6d4;padding-bottom:10px}.logo{font-size:24pt;font-weight:900;color:#06b6d4}.info-box{background:#f8fafc;border:1px solid #e2e8f0;padding:15px;display:flex;justify-content:space-between;margin:20px 0}.footer-section{display:flex;justify-content:center;margin-top:30px}.totals-box{width:60%;border:2px solid #e2e8f0;padding:20px;border-radius:8px}</style></head><body><div class="header"><div>${logoHtml}<h1>${companySettings.nameEn}</h1><p>${companySettings.address}</p></div></div><h2 style="text-align:center">INVOICE / فاتورة</h2><div class="info-box"><div>Date: ${new Date().toLocaleDateString('en-GB')}<br>Invoice #: ${booking.fileNo || booking.id}</div><div>Bill To: ${booking.clientName}<br>Phone: ${booking.clientPhone || '-'}<br>Destination: ${booking.destination}</div></div><div class="summary-section" style="display:flex;justify-content:space-around;background:#f1f5f9;padding:10px;margin-bottom:20px"><div>Travelers: ${booking.passengers.length}</div><div>Services: ${booking.services.length}</div></div><div class="footer-section"><div class="totals-box"><div>Total: ${convertAmount(booking.amount).toFixed(2)} ${systemCurrency}</div><div>Paid: ${convertAmount(booking.paidAmount).toFixed(2)}</div><div style="color:red">Due: ${convertAmount(remaining).toFixed(2)}</div></div></div><script>window.print()</script></body></html>`;
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ... (Search and Table Section) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Plane className="text-cyan-600 dark:text-cyan-400" />
                قائمة الحجوزات والملفات
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">إنشاء ومتابعة ملفات الحجوزات للعملاء</p>
        </div>
        <button onClick={handleOpenCreate} className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 transition-all shadow-lg"><Plus size={20} /><span>فتح ملف جديد</span></button>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
         <div className="p-4 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="بحث (العميل، رقم الملف، الوجهة)..." className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="relative">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none text-sm appearance-none">
                     <option value="">جميع الأنواع</option>
                     {uniqueTypes.map(type => <option key={type} value={type}>{getTypeLabel(type)}</option>)}
                 </select>
            </div>
            <div className="relative"><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full pl-4 pr-2 py-2 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white text-sm" /></div>
            <div className="relative"><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full pl-4 pr-2 py-2 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white text-sm" /></div>
         </div>

         {/* Bookings Table */}
         <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-100 dark:bg-[#0f172a] text-cyan-600 dark:text-cyan-400 text-xs uppercase">
                    <tr>
                        <th className="px-6 py-4">رقم الملف</th>
                        <th className="px-6 py-4">العميل</th>
                        <th className="px-6 py-4">نوع الملف</th>
                        <th className="px-6 py-4">تاريخ السفر</th>
                        <th className="px-6 py-4">الحالة</th>
                        <th className="px-6 py-4">المالية ({systemCurrency})</th>
                        <th className="px-6 py-4 text-center">إجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {bookings.map((booking) => {
                        return (
                        <tr key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                            <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">{booking.fileNo || booking.id}</td>
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-800 dark:text-white">{booking.clientName}</div>
                                {booking.clientPhone && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1"><Phone size={10}/> {booking.clientPhone}</div>}
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium">
                                    {getTypeLabel(booking.type)}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-xs">{new Date(booking.date).toLocaleDateString('en-GB')}</td>
                            <td className="px-6 py-4"><span className="px-2 py-1 rounded text-[10px] bg-slate-200 dark:bg-slate-700">{booking.status}</span></td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col text-xs gap-0.5">
                                    <span className="text-emerald-600 font-medium">بيع: {convertAmount(booking.amount).toFixed(2)}</span>
                                    <span className="text-slate-500">واصل: {convertAmount(booking.paidAmount).toFixed(2)}</span>
                                    <span className={`font-bold ${booking.amount - booking.paidAmount > 0.01 ? 'text-rose-600' : 'text-slate-400'}`}>
                                        متبقي: {convertAmount(booking.amount - booking.paidAmount).toFixed(2)}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 flex justify-center gap-2">
                                <button onClick={() => handleBookingVoucher(booking)} className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded text-blue-600 dark:text-blue-400" title="طباعة قسيمة الحجز"><FileCheck size={16} /></button>
                                <button onClick={() => handleWhatsApp(booking)} className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded hover:bg-green-200 dark:hover:bg-green-900/50" title="إرسال عبر واتساب"><MessageCircle size={16} /></button>
                                <button onClick={() => handlePrintInvoice(booking)} className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded"><Printer size={16} /></button>
                                <button onClick={() => handleOpenPayment(booking)} className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded"><Coins size={16} /></button>
                                <button onClick={() => handleEdit(booking)} className="p-1.5 bg-slate-200 dark:bg-slate-700 text-cyan-600 rounded"><Edit size={16} /></button>
                                {currentUser?.role === 'Admin' && <button onClick={() => handleDelete(booking.id)} className="p-1.5 text-red-500 hover:bg-red-600 hover:text-white rounded"><Trash2 size={16} /></button>}
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
         </div>

         {/* Pagination Controls */}
         <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0f172a]">
             <div className="text-xs text-slate-500 dark:text-slate-400">
                 عرض {bookings.length} من {bookingsTotal} حجز
             </div>
             <div className="flex gap-2">
                 <button 
                    onClick={() => handlePageChange(bookingsPage - 1)} 
                    disabled={bookingsPage === 1}
                    className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 text-sm"
                 >
                     <ChevronRight size={16} /> السابق
                 </button>
                 <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm font-bold">
                     {bookingsPage} / {totalPages || 1}
                 </span>
                 <button 
                    onClick={() => handlePageChange(bookingsPage + 1)} 
                    disabled={bookingsPage >= totalPages}
                    className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 text-sm"
                 >
                     التالي <ChevronLeft size={16} />
                 </button>
             </div>
         </div>
      </div>

      {/* --- Modals --- */}

      {/* WhatsApp Preview Modal */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-[70] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="bg-[#25D366] p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <MessageCircle size={20} /> إرسال تفاصيل الحجز
                    </h3>
                    <button onClick={() => setIsWhatsAppModalOpen(false)} className="text-white/80 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">رقم الهاتف (مع المقدمة الدولية)</label>
                        <input 
                            type="text" 
                            dir="ltr"
                            value={whatsAppPhone} 
                            onChange={(e) => setWhatsAppPhone(e.target.value)} 
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white font-mono focus:border-green-500 focus:outline-none"
                            placeholder="96279xxxxxxx"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">نص الرسالة</label>
                        <textarea 
                            value={whatsAppMessage} 
                            onChange={(e) => setWhatsAppMessage(e.target.value)} 
                            className="w-full h-48 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-3 text-sm text-slate-800 dark:text-white resize-none focus:border-green-500 focus:outline-none custom-scrollbar"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={copyToClipboard} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2">
                            <Copy size={16} /> نسخ النص
                        </button>
                        <button onClick={confirmSendWhatsApp} className="flex-1 px-4 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors">
                            <Send size={16} className={document.dir === 'rtl' ? 'rotate-180' : ''} /> إرسال عبر واتساب
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Main Form Modal Refactored */}
      {isModalOpen && (
          <BookingFormModal 
            editingId={editingId} 
            onClose={() => setIsModalOpen(false)} 
          />
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedBookingForPayment && (
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/95 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#020617] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2 text-lg">
                     <Wallet className="text-cyan-600 dark:text-cyan-400" size={22} />
                     إضافة دفعة مالية
                    </h3>
                    <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmitPayment} className="p-6 space-y-6">
                    <div className="bg-slate-50 dark:bg-[#0f172a] rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                             <span className="text-slate-500 dark:text-slate-400">إجمالي المبلغ:</span>
                             <span className="text-slate-800 dark:text-white font-bold dir-ltr">{convertAmount(selectedBookingForPayment.amount).toFixed(2)} {systemCurrency}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm">
                             <span className="text-emerald-600 dark:text-emerald-500">تم دفع:</span>
                             <span className="text-emerald-600 dark:text-emerald-400 font-bold dir-ltr">{convertAmount(selectedBookingForPayment.paidAmount).toFixed(2)} {systemCurrency}</span>
                        </div>
                         <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
                             <span className="text-rose-600 dark:text-rose-500">المتبقي:</span>
                             <span className="text-rose-600 dark:text-rose-400 font-bold dir-ltr">{convertAmount(selectedBookingForPayment.amount - selectedBookingForPayment.paidAmount).toFixed(2)} {systemCurrency}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-cyan-600 dark:text-cyan-400 font-bold mb-2">قيمة الدفعة (Original Amount)</label>
                        <div className="flex rounded-xl border border-cyan-600/50 dark:border-cyan-700 overflow-hidden focus-within:ring-1 focus-within:ring-cyan-500 transition-all">
                            <select value={paymentCurrency} onChange={(e) => setPaymentCurrency(e.target.value as Currency)} className="bg-slate-100 dark:bg-[#0f172a] text-slate-800 dark:text-white text-sm font-bold px-3 py-3 border-l border-slate-200 dark:border-slate-700 focus:outline-none appearance-none w-24 text-center">{Object.keys(exchangeRates).map(curr => <option key={curr} value={curr}>{curr}</option>)}</select>
                            <input autoFocus type="number" min="0.01" step="0.01" dir="ltr" value={paymentAmount} onFocus={(e) => e.target.select()} onChange={(e) => setPaymentAmount(e.target.value)} className="flex-1 bg-white dark:bg-[#020617] text-slate-900 dark:text-white text-lg font-bold px-4 py-3 focus:outline-none text-left" placeholder="0.00" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#0f172a]/50">
                        <div>
                             <label className="block text-[10px] text-slate-500 mb-1 flex items-center gap-1 justify-end"><Coins size={10}/> سعر الصرف</label>
                             <input type="number" step="any" dir="ltr" value={exchangeRate} onFocus={(e) => e.target.select()} onChange={(e) => setExchangeRate(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white text-sm font-bold text-center focus:border-cyan-500 focus:outline-none" />
                        </div>
                         <div>
                             <label className="block text-[10px] text-emerald-600 dark:text-emerald-500 mb-1 font-bold text-right">المبلغ بالدينار (JOD)</label>
                             <div className="w-full bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm text-center dir-ltr">{(Number(paymentAmount) * (parseFloat(exchangeRate) || 0)).toFixed(2)}</div>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <div>
                             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Landmark size={12}/> طريقة الدفع / الصندوق</label>
                             <select value={selectedTreasuryId} onChange={(e) => setSelectedTreasuryId(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white text-sm focus:border-cyan-500 focus:outline-none appearance-none">{treasury.map(t => (<option key={t.id} value={t.id}>{t.name} - {t.balance.toFixed(2)}</option>))}</select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Calendar size={12}/> تاريخ الدفعة</label>
                            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white text-sm focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><FileText size={12}/> ملاحظات</label>
                            <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="رقم سند القبض، تحويل بنكي، إلخ..." className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white text-sm focus:border-cyan-500 focus:outline-none h-20 resize-none"></textarea>
                        </div>
                     </div>
                    <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20">تأكيد الدفعة</button>
                </form>
            </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900/50">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-slate-800 dark:text-white text-lg font-bold mb-2">تأكيد الحذف</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">هل أنت متأكد من رغبتك في حذف هذا الحجز نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
                <div className="flex gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg transition-colors">إلغاء</button>
                    <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors">نعم، حذف</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default BookingsList;
