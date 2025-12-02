
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
          ? `<img src="${companySettings.logoUrl}" class="logo-img" />`
          : `<div class="logo-text">${companySettings.logoText}</div>`;

      // GENERATE SERVICE ROWS
      const servicesHtml = booking.services.map((s, i) => {
          let details = '';
          let dates = s.date || '-';
          let subDetails = '';

          // 1. FLIGHT RENDERING
          if (s.type === 'Flight') {
              // Main Flight Info Header
              details = `<div class="svc-main-title">✈ ${s.airline || 'Flight Booking'}</div>`;
              details += `<div class="svc-sub-info"><strong>PNR:</strong> ${s.pnr || '-'}</div>`;
              
              // Prepare Segments Array (Merging main segment + additional routes)
              let segments = [];

              // Main Segment (from root properties)
              if (s.route || s.flightDate) {
                  let mainFrom = '';
                  let mainTo = '';
                  // Try to parse route like "AMM-DXB"
                  if (s.route && s.route.includes('-')) {
                      const parts = s.route.split('-');
                      mainFrom = parts[0].trim();
                      mainTo = parts[1].trim();
                  } else {
                      mainFrom = s.route || '';
                  }

                  segments.push({
                      from: mainFrom,
                      to: mainTo,
                      airline: s.airline,
                      flightNo: s.ticketNumber, // In BookingForm, ticketNumber input is used for Flight Number
                      date: s.flightDate,
                      dep: s.departureTime,
                      arr: s.arrivalTime
                  });
              }

              // Additional Segments
              if (s.routes && s.routes.length > 0) {
                  s.routes.forEach(r => {
                      segments.push({
                          from: r.from,
                          to: r.to,
                          airline: r.airline,
                          flightNo: r.flightNumber,
                          date: r.date,
                          dep: r.departureTime,
                          arr: r.arrivalTime
                      });
                  });
              }

              // Render Segment Table
              if (segments.length > 0) {
                  subDetails += `<table class="sub-table" style="width: 100%; margin-top: 5px; border-collapse: collapse;">`;
                  subDetails += `
                    <tr style="background-color: #f1f5f9; color: #475569;">
                        <th style="padding: 4px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 9px;">From</th>
                        <th style="padding: 4px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 9px;">To</th>
                        <th style="padding: 4px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 9px;">Flight</th>
                        <th style="padding: 4px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 9px;">Date</th>
                        <th style="padding: 4px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 9px;">Time</th>
                    </tr>
                  `;
                  
                  segments.forEach(seg => {
                      subDetails += `
                        <tr>
                            <td style="padding: 4px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #f1f5f9; font-size: 10px;">${seg.from || '-'}</td>
                            <td style="padding: 4px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #f1f5f9; font-size: 10px;">${seg.to || '-'}</td>
                            <td style="padding: 4px; border-bottom: 1px solid #f1f5f9; font-size: 10px;">
                                <strong>${seg.airline || ''}</strong> ${seg.flightNo || ''}
                            </td>
                            <td style="padding: 4px; font-family: monospace; border-bottom: 1px solid #f1f5f9; font-size: 10px;">${seg.date || ''}</td>
                            <td style="padding: 4px; font-family: monospace; border-bottom: 1px solid #f1f5f9; font-size: 10px;">${seg.dep || ''} ${seg.arr ? '- ' + seg.arr : ''}</td>
                        </tr>
                      `;
                  });
                  subDetails += `</table>`;
              } else {
                  // Fallback if no segments found
                  subDetails += `<div class="svc-desc">${s.route || ''} - ${s.flightDate || ''}</div>`;
              }
          } 
          // 2. HOTEL RENDERING
          else if (s.type === 'Hotel') {
              details = `<div class="svc-main-title">🏨 ${s.hotelName || 'Hotel Booking'}</div>`;
              details += `<div class="svc-sub-info">${s.roomType || 'Standard'} | ${s.boardType || 'RO'}</div>`;
              
              if(s.hotelAddress) subDetails += `<div class="svc-desc">📍 ${s.hotelAddress}</div>`;
              
              dates = `Check-In: <strong>${s.checkIn || '-'}</strong><br>Check-Out: <strong>${s.checkOut || '-'}</strong>`;
          }
          // 3. TRANSPORT RENDERING
          else if (s.type === 'Transport') {
              details = `<div class="svc-main-title">🚌 ${s.vehicleType || 'Transport'}</div>`;
              if(s.driverName) details += `<div class="svc-sub-info">Driver: ${s.driverName}</div>`;
              
              dates = s.transportDate || s.date || '-';

              if (s.routes && s.routes.length > 0) {
                  subDetails += `<div class="route-list">`;
                  s.routes.forEach((r, idx) => {
                      subDetails += `<div>${idx+1}. ${r.from} ➝ ${r.to}</div>`;
                  });
                  subDetails += `</div>`;
              }
          }
          // 4. GENERAL RENDERING
          else {
              details = `<div class="svc-main-title">${s.type}</div>`;
              subDetails = `<div class="svc-desc">${s.details || s.country || '-'}</div>`;
          }

          return `
            <tr>
                <td style="text-align: center; vertical-align: top;">${i + 1}</td>
                <td style="vertical-align: top;">
                    ${details}
                    ${subDetails}
                </td>
                <td style="text-align: center; vertical-align: top;">${s.quantity}</td>
                <td style="text-align: center; vertical-align: top;" class="mono-date">${dates}</td>
                <td style="text-align: center; vertical-align: top;">${s.status || 'Confirmed'}</td>
            </tr>
          `;
      }).join('');

      const contractHtml = companySettings.contractTemplate ? `
        <div class="page-break"></div>
        <div class="contract-page">
            <div class="header">
                <div style="flex:1;">${logoHtml}</div>
                <div style="flex:1; text-align:left;">
                    <h2 style="margin:0; color:#0f172a;">TRAVEL AGREEMENT</h2>
                    <p style="margin:0; color:#64748b; font-size:12px;">عقد خدمات سياحية</p>
                </div>
            </div>
            
            <div class="contract-body">
                <div style="margin-bottom:20px;">
                    <strong>مرجع الملف:</strong> ${booking.fileNo || booking.id} <br>
                    <strong>الطرف الأول:</strong> ${companySettings.nameAr} <br>
                    <strong>الطرف الثاني (العميل):</strong> ${booking.clientName}
                </div>
                
                <h4 style="border-bottom:2px solid #ddd; padding-bottom:5px;">الشروط والأحكام</h4>
                <div style="font-size:11px; line-height:1.6; text-align:justify; white-space: pre-wrap;">
                    ${companySettings.contractTemplate}
                </div>
            </div>

            <div class="signatures">
                <div class="sig-box">
                    <p>الطرف الأول (الشركة)</p>
                    <div class="sig-line"></div>
                </div>
                <div class="sig-box">
                    <p>الطرف الثاني (العميل)</p>
                    <div class="sig-line"></div>
                </div>
            </div>
        </div>
      ` : '';

      const voucherHTML = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <title>Voucher - ${booking.fileNo}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
            <style>
                @page { 
                    size: A4; 
                    margin: 0;
                }
                body { 
                    font-family: 'Cairo', sans-serif; 
                    background: #fff; 
                    margin: 0; 
                    padding: 0; 
                    color: #1e293b; 
                    -webkit-print-color-adjust: exact;
                    width: 100%;
                    height: 100%;
                }
                
                #main-container {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 15mm;
                    margin: 0 auto;
                    box-sizing: border-box;
                    background: white;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 3px solid #0891b2; padding-bottom: 10px; margin-bottom: 15px; }
                .logo-img { max-height: 60px; max-width: 180px; object-fit: contain; }
                .logo-text { font-size: 24px; font-weight: 800; color: #0891b2; letter-spacing: -1px; }
                .company-details { text-align: left; font-size: 9px; color: #64748b; line-height: 1.4; margin-top: 5px; }
                
                .voucher-title { text-align: center; margin: 10px 0 20px 0; }
                .voucher-title h1 { margin: 0; font-size: 22px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
                .voucher-title span { background: #0891b2; color: #fff; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; }

                /* Compact Grid Info */
                .grid-info {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    margin-bottom: 15px;
                    background: #f8fafc;
                    padding: 8px 12px;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                }
                .info-item { display: flex; flex-direction: column; }
                .label { font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; letter-spacing: 0.5px; }
                .value { font-size: 11px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                /* Vertical Passenger List */
                .pax-list { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
                .pax-header { background: #f1f5f9; padding: 6px 10px; font-size: 10px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; text-align: right; }
                .pax-container { padding: 5px 10px; background: #fff; }
                .pax-row { font-size: 11px; padding: 3px 0; border-bottom: 1px dashed #f1f5f9; display: flex; align-items: center; }
                .pax-row:last-child { border-bottom: none; }
                .pax-idx { color: #94a3b8; width: 20px; font-weight: bold; font-size: 10px;}
                .pax-name { font-weight: 600; color: #0f172a; margin-left: 5px; flex: 1;}
                .pax-meta { font-size: 10px; color: #64748b; }

                /* Service Table Styling */
                table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
                thead { background: #0f172a; color: white; }
                th { padding: 8px; text-align: right; font-weight: 700; font-size: 10px; text-transform: uppercase; }
                td { padding: 8px; border-bottom: 1px solid #e2e8f0; color: #334155; }
                tr:nth-child(even) { background-color: #f8fafc; }

                /* Inner Service Details */
                .svc-main-title { font-weight: 800; font-size: 12px; color: #0f172a; margin-bottom: 2px; }
                .svc-sub-info { font-size: 9px; color: #64748b; margin-bottom: 4px; }
                .svc-desc { font-size: 10px; color: #334155; margin-top: 2px; }
                
                /* Sub Table for Segments */
                .sub-table { width: 100%; margin-top: 5px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; background: #fff; }
                .sub-table th { background: #f1f5f9; color: #475569; font-size: 8px; padding: 3px; text-align: left; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
                .sub-table td { font-size: 9px; padding: 3px; border-bottom: 1px solid #f1f5f9; color: #334155; }
                .sub-table tr:last-child td { border-bottom: none; }
                
                .route-list div { font-size: 9px; padding: 2px 0; border-bottom: 1px dashed #e2e8f0; }
                .mono-date { font-family: monospace; font-size: 10px; }

                .notes-box { margin-top: 15px; padding: 10px; background: #fff7ed; border-right: 3px solid #f97316; border-radius: 4px; font-size: 10px; }
                .notes-title { color: #c2410c; font-weight: 800; margin-bottom: 3px; text-transform: uppercase; font-size: 9px; }

                .footer { 
                    margin-top: auto;
                    text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; 
                }
                
                .content-wrapper {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }

                /* Contract Pages */
                .page-break { page-break-before: always; }
                .contract-page { padding: 15mm; width: 210mm; min-height: 297mm; box-sizing: border-box; margin: 0 auto; display: flex; flex-direction: column;}
                .contract-body { flex: 1; }
                .signatures { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
                .sig-box { width: 40%; text-align: center; }
                .sig-line { border-bottom: 1px solid #334155; margin-top: 50px; }
            </style>
        </head>
        <body>
            <div id="main-container">
                <div class="content-wrapper">
                    <div class="header">
                        <div>
                            ${logoHtml}
                            <div style="font-weight:bold; margin-top:5px; color:#334155; font-size:12px;">${companySettings.nameAr}</div>
                        </div>
                        <div class="company-details">
                            <strong style="font-size: 11px; color: #0f172a;">${companySettings.nameEn}</strong><br>
                            ${companySettings.address}<br>
                            ${companySettings.phone}<br>
                            ${companySettings.email}
                        </div>
                    </div>

                    <div class="voucher-title">
                        <h1>Booking Confirmation</h1>
                        <span>Ref: ${booking.fileNo || booking.id}</span>
                    </div>

                    <div class="grid-info">
                        <div class="info-item"><span class="label">Client Name</span><span class="value">${booking.clientName}</span></div>
                        <div class="info-item"><span class="label">Destination</span><span class="value">${booking.destination}</span></div>
                        <div class="info-item"><span class="label">Booking Date</span><span class="value mono-date">${new Date(booking.date).toLocaleDateString('en-GB')}</span></div>
                        <div class="info-item"><span class="label">Status</span><span class="value" style="color:#10b981;">${booking.status}</span></div>
                    </div>

                    <div class="pax-list">
                        <div class="pax-header">Travelers / Guests (${booking.passengers.length})</div>
                        <div class="pax-container">
                            ${booking.passengers.map((p, idx) => `
                                <div class="pax-row">
                                    <span class="pax-idx">${idx + 1}.</span>
                                    <span class="pax-name">${p.title} ${p.fullName}</span>
                                    ${p.passportNo ? `<span class="pax-meta">| Passport: ${p.passportNo}</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <h3 style="font-size:12px; border-bottom: 2px solid #e2e8f0; padding-bottom:5px; margin-bottom:10px; color: #0f172a;">Service Details</h3>
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align: center; width: 30px;">#</th>
                                <th>Description & Details</th>
                                <th style="text-align: center; width: 40px;">Qty</th>
                                <th style="text-align: center; width: 90px;">Date</th>
                                <th style="text-align: center; width: 70px;">Status</th>
                            </tr>
                        </thead>
                        <tbody>${servicesHtml}</tbody>
                    </table>

                    ${booking.notes ? `
                    <div class="notes-box">
                        <div class="notes-title">Notes / ملاحظات:</div>
                        <p style="margin: 0; color: #431407;">${booking.notes}</p>
                    </div>
                    ` : ''}

                    <div class="footer">
                        <p style="margin-bottom: 5px;">Thank you for booking with <strong>${companySettings.nameEn}</strong></p>
                        <p>Issued by: ${currentUser?.name || 'System'} | Date: ${new Date().toLocaleString('en-GB')}</p>
                    </div>
                </div>
            </div>

            ${contractHtml}

            <script>
                // Auto-print
                window.onload = function() {
                    var wrapper = document.querySelector('.content-wrapper');
                    var safeHeight = 1080; 
                    
                    if (wrapper.scrollHeight > safeHeight) {
                        var scale = safeHeight / wrapper.scrollHeight;
                        if (scale < 0.65) scale = 0.65; 
                        document.body.style.zoom = scale;
                    }
                    
                    setTimeout(function() {
                        window.print();
                    }, 500);
                }
            </script>
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
      
      // Default Template if not set
      let template = companySettings.whatsappTemplate || `مرحباً {client_name}،
إليك تفاصيل حجزك مع {company_name}:
رقم الملف: {file_no}
الوجهة: {destination}
التاريخ: {date}
المبلغ المتبقي: {remaining_amount}

للاستفسار: {company_phone}`;

      // Replacements
      const replacements: Record<string, string> = {
          '{client_name}': booking.clientName,
          '{file_no}': booking.fileNo || booking.id,
          '{destination}': booking.destination,
          '{date}': new Date(booking.date).toLocaleDateString('en-GB'),
          '{remaining_amount}': remaining > 0 ? `${convertAmount(remaining).toFixed(2)} ${systemCurrency}` : 'خالص الدفع (0.00)',
          '{total_amount}': `${convertAmount(booking.amount).toFixed(2)} ${systemCurrency}`,
          '{paid_amount}': `${convertAmount(booking.paidAmount).toFixed(2)} ${systemCurrency}`,
          '{company_name}': companySettings.nameAr,
          '{company_phone}': companySettings.phone
      };

      let text = template;
      Object.keys(replacements).forEach(key => {
          text = text.replace(new RegExp(key, 'g'), replacements[key]);
      });

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
        ? `<img src="${companySettings.logoUrl}" style="max-height: 80px; max-width: 200px; object-fit: contain;" />`
        : `<div class="logo-text">${companySettings.logoText}</div>`;

    const invoiceHTML = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <title>Invoice - ${booking.fileNo}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
            @page { 
                size: A4; 
                margin: 0;
            }
            body { 
                font-family: 'Cairo', sans-serif; 
                margin: 0; 
                padding: 0; 
                background: #fff; 
                -webkit-print-color-adjust: exact; 
                color: #1e293b; 
                width: 100%;
                height: 100%;
            }
            .container { 
                padding: 15mm; 
                width: 210mm;
                min-height: 297mm; 
                position: relative; 
                box-sizing: border-box; 
                margin: 0 auto;
                display: flex;
                flex-direction: column;
            }
            
            .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; border-bottom: 3px solid #0891b2; padding-bottom: 15px; }
            .logo-text { font-size: 24px; font-weight: 800; color: #0891b2; }
            .company-info { font-size: 10px; color: #475569; text-align: left; line-height: 1.4; }
            
            .invoice-title { text-align: center; margin-bottom: 30px; }
            .invoice-title h1 { margin: 0; font-size: 24px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
            .invoice-title p { margin: 0; color: #64748b; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; }

            .bill-to-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .bill-box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .bill-header { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 5px; }
            .bill-content p { margin: 0; font-weight: 700; font-size: 14px; color: #0f172a; }
            .bill-content span { display: block; font-size: 11px; font-weight: normal; color: #475569; margin-top: 2px; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            thead { background: #0f172a; color: white; }
            th { padding: 10px; text-align: center; font-weight: 600; text-transform: uppercase; font-size: 10px; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; }
            td.desc { text-align: right; }
            tr:nth-child(even) { background-color: #f8fafc; }
            
            .totals-section { display: flex; justify-content: flex-end; }
            .totals-table { width: 300px; border-collapse: collapse; }
            .totals-table td { padding: 8px 0; border-bottom: 1px dashed #cbd5e1; text-align: left; }
            .totals-table td:last-child { text-align: right; font-weight: 700; direction: ltr; }
            .totals-table tr:last-child td { border-bottom: none; border-top: 2px solid #0f172a; padding-top: 10px; font-size: 16px; color: #0f172a; }
            
            .footer { margin-top: auto; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div>
                    ${logoHtml}
                    <div style="font-weight:bold; color:#0f172a; margin-top:5px; font-size: 14px;">${companySettings.nameAr}</div>
                </div>
                <div class="company-info">
                    <strong>${companySettings.nameEn}</strong><br>
                    ${companySettings.address}<br>
                    ${companySettings.phone}<br>
                    ${companySettings.email}
                </div>
            </div>

            <div class="invoice-title">
                <h1>Tax Invoice</h1>
                <p>فاتورة ضريبية</p>
            </div>

            <div class="bill-to-grid">
                <div class="bill-box">
                    <div class="bill-header">Bill To / مطلوب من</div>
                    <div class="bill-content">
                        <p>${booking.clientName}</p>
                        <span>${booking.clientPhone || '-'}</span>
                    </div>
                </div>
                <div class="bill-box" style="text-align:left;">
                    <div class="bill-header">Invoice Details / تفاصيل الفاتورة</div>
                    <div class="bill-content">
                        <p>INV-${booking.fileNo || booking.id}</p>
                        <span>Date: ${new Date().toLocaleDateString('en-GB')}</span>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">#</th>
                        <th style="text-align: right;">Description (الوصف)</th>
                        <th style="width: 80px;">Qty</th>
                        <th style="width: 120px;">Amount (${systemCurrency})</th>
                    </tr>
                </thead>
                <tbody>
                    ${booking.services.map((s, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td class="desc">
                                <strong>${s.type}</strong> - ${s.hotelName || s.airline || s.details || 'Service'}
                                <br><span style="font-size:10px; color:#64748b;">${s.inventoryId ? '(From Inventory)' : ''}</span>
                            </td>
                            <td>${s.quantity}</td>
                            <td style="direction:ltr;">${convertAmount(s.sellingPrice * s.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td>Total Amount</td>
                        <td>${convertAmount(booking.amount).toFixed(2)} ${systemCurrency}</td>
                    </tr>
                    <tr style="color: #10b981;">
                        <td>Paid Amount</td>
                        <td>${convertAmount(booking.paidAmount).toFixed(2)} ${systemCurrency}</td>
                    </tr>
                    <tr style="color: ${remaining > 0.01 ? '#ef4444' : '#10b981'};">
                        <td>Balance Due</td>
                        <td>${convertAmount(remaining).toFixed(2)} ${systemCurrency}</td>
                    </tr>
                </table>
            </div>

            <div class="footer">
                Thank you for your business! <br>
                ${companySettings.nameEn}
            </div>
        </div>
        <script>window.print()</script>
    </body>
    </html>`;
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
                            placeholder="9725xxxxxxx"
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
