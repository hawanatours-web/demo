
import React, { useState, useEffect, useMemo } from 'react';
import { BookingStatus, ServiceItem, Passenger, Booking, Payment, Currency, TransactionType, InventoryItem } from '../types';
import { Search, Plus, X, Trash2, Plane, FileText, Edit, Coins, Users, ChevronDown, Ticket, Printer, Filter, Wallet, Landmark, Calendar, CheckCircle2, Receipt, Eye, Copy, MessageCircle, MapPin, CalendarClock, Bus, Building, FileCheck, Globe, AlertTriangle, Box, Briefcase, Clock, Phone, CheckSquare, User, Send, ChevronLeft, ChevronRight, ArrowDown } from 'lucide-react';
import { useData } from '../context/DataContext';

// Comprehensive Passenger Titles for Aviation
const PASSENGER_TITLES = [
    { value: 'MR', label: 'MR - سيد' },
    { value: 'MRS', label: 'MRS - سيدة' },
    { value: 'MS', label: 'MS - آنسة' },
    { value: 'MSTR', label: 'MSTR - طفل' },
    { value: 'MISS', label: 'MISS - طفلة' },
    { value: 'INF', label: 'INF - رضيع' },
    { value: 'DR', label: 'DR - دكتور' },
    { value: 'PROF', label: 'PROF - بروفيسور' },
    { value: 'CAPT', label: 'CAPT - كابتن' },
];

const PASSENGER_TYPES = [
    { value: 'Adult', label: 'بالغ (Adult)' },
    { value: 'Child', label: 'طفل (Child)' },
    { value: 'Infant', label: 'رضيع (Infant)' },
];

// Helper to get the next day string YYYY-MM-DD
const getNextDay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
};

const BookingsList: React.FC = () => {
  const { bookings, agents, clients, treasury, addBooking, updateBooking, deleteBooking, addBookingPayment, systemCurrency, convertAmount, showNotification, currentUser, exchangeRates, companySettings, addTransaction, t, inventory, getInventoryStats, fetchBookings, bookingsPage, bookingsTotal } = useData();
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

  // --- Form State ---
  const [bookingType, setBookingType] = useState<string>('Tourism');
  const [customBookingType, setCustomBookingType] = useState<string>(''); 
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [fileNo, setFileNo] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<BookingStatus>(BookingStatus.PENDING);
  
  // --- New States for Global Financials ---
  const [manualTotalSales, setManualTotalSales] = useState<string>('');
  const [calculatedCostJOD, setCalculatedCostJOD] = useState<number>(0);
  const [calculatedProfitJOD, setCalculatedProfitJOD] = useState<number>(0);

  const [initialPaidAmount, setInitialPaidAmount] = useState<string>('');
  const [initialTreasuryId, setInitialTreasuryId] = useState<string>('');

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // --- Local Buffer for Services Inputs (to allow decimals) ---
  const [serviceInputBuffers, setServiceInputBuffers] = useState<Record<string, string>>({});

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
      // Merge defaults with any new types found in the database
      return Array.from(new Set([...defaults, ...existingTypes]));
  }, [bookings]);

  // Effect for Exchange Rate in Payment Modal
  useEffect(() => {
      if (exchangeRates[paymentCurrency]) {
          setExchangeRate(exchangeRates[paymentCurrency].toString());
      }
  }, [paymentCurrency, exchangeRates]);

  // Clear buffers when modal closes
  useEffect(() => {
      if (!isModalOpen) setServiceInputBuffers({});
  }, [isModalOpen]);

  // --- DYNAMIC COST CALCULATION EFFECT ---
  useEffect(() => {
      if (!isModalOpen) return;

      let totalCostJOD = 0;

      services.forEach(s => {
          // 1. Calculate Cost in JOD
          // Rate is (Units of Currency per 1 JOD) e.g. USD 1.41
          // So Cost JOD = Cost in Curr / Rate
          const costRate = exchangeRates[s.costCurrency || 'JOD'] || 1;
          const itemCost = Number(s.costPrice || 0) * Number(s.quantity || 0);
          const costInJOD = itemCost / costRate;
          totalCostJOD += costInJOD;
      });

      setCalculatedCostJOD(totalCostJOD);
  }, [services, exchangeRates, isModalOpen]);

  // --- DYNAMIC PROFIT CALCULATION EFFECT ---
  useEffect(() => {
      if (!isModalOpen) return;

      // Profit = Manual Sales Input (converted to JOD) - Total Cost (JOD)
      const systemRate = exchangeRates[systemCurrency] || 1;
      const salesJOD = (parseFloat(manualTotalSales) || 0) / systemRate;
      const profit = salesJOD - calculatedCostJOD;
      
      setCalculatedProfitJOD(profit);
  }, [manualTotalSales, calculatedCostJOD, systemCurrency, exchangeRates, isModalOpen]);


  // --- Handlers ---

  const handleOpenCreate = () => {
    setEditingId(null);
    setBookingType('Tourism');
    setCustomBookingType('');
    setClientName('');
    setClientPhone('');
    setFileNo(''); 
    setBookingDate(new Date().toISOString().split('T')[0]);
    setDestination('');
    setNotes('');
    setStatus(BookingStatus.PENDING);
    
    // Financial Resets
    setManualTotalSales('');
    setCalculatedCostJOD(0);
    setCalculatedProfitJOD(0);
    setInitialPaidAmount('');
    setInitialTreasuryId(treasury.length > 0 ? treasury[0].id : '');

    setPassengers([{ id: `p-${Date.now()}`, fullName: '', type: 'Adult', nationality: '', title: 'MR', passportSubmitted: false }]);
    setServices([{
      id: `s-${Date.now()}`,
      type: 'Flight',
      quantity: 1,
      costPrice: 0,
      sellingPrice: 0,
      costCurrency: 'JOD',
      date: new Date().toISOString().split('T')[0]
    }]);
    setIsModalOpen(true);
  };

  const handleEdit = (booking: Booking) => {
    setEditingId(booking.id);
    
    const standardTypes = ['Tourism', 'Flight', 'General', 'Umrah', 'Visa', 'Hotel'];
    if (standardTypes.includes(booking.type)) {
        setBookingType(booking.type);
        setCustomBookingType('');
    } else {
        setBookingType('Other');
        setCustomBookingType(booking.type);
    }

    setClientName(booking.clientName);
    setClientPhone(booking.clientPhone || '');
    setFileNo(booking.fileNo || '');
    setBookingDate(booking.date);
    setDestination(booking.destination);
    setNotes(booking.notes || '');
    setStatus(booking.status);
    
    // Set initial financial display
    const amountInSystemCurrency = convertAmount(booking.amount);
    setManualTotalSales(amountInSystemCurrency.toFixed(2));
    setCalculatedCostJOD(booking.cost);
    setCalculatedProfitJOD(booking.profit);
    
    setInitialPaidAmount(''); 
    setInitialTreasuryId('');

    setPassengers(booking.passengers || []);
    setServices(booking.services || []);
    
    const newBuffers: Record<string, string> = {};
    (booking.services || []).forEach(s => {
           if(s.costPrice) newBuffers[`${s.id}-costPrice`] = s.costPrice.toString();
           if(s.quantity) newBuffers[`${s.id}-quantity`] = s.quantity.toString();
           if(s.sellingPrice) newBuffers[`${s.id}-sellingPrice`] = s.sellingPrice.toString();
           if(s.roomCount) newBuffers[`${s.id}-roomCount`] = s.roomCount.toString();
    });
    setServiceInputBuffers(newBuffers);
    
    setIsModalOpen(true);
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.value;
      setClientName(name);
      const matchedClient = clients.find(c => c.name === name);
      if (matchedClient && matchedClient.phone) {
          setClientPhone(matchedClient.phone);
      }
  };

  const handleAddPassenger = () => {
    setPassengers([...passengers, { id: `p-${Date.now()}`, fullName: '', type: 'Adult', nationality: '', title: 'MR', passportSubmitted: false }]);
  };

  const handlePassengerChange = (id: string, field: keyof Passenger, value: any) => {
    setPassengers(passengers.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleRemovePassenger = (id: string) => {
    setPassengers(passengers.filter(p => p.id !== id));
  };

  const handleAddService = () => {
    setServices([...services, {
      id: `s-${Date.now()}`,
      type: 'Flight', 
      quantity: 1,
      costPrice: 0,
      sellingPrice: 0,
      costCurrency: 'JOD',
      date: new Date().toISOString().split('T')[0]
    }]);
  };

  // --- Routes Management for Transport ---
  const handleAddRoute = (serviceId: string) => {
      setServices(services.map(s => {
          if (s.id === serviceId) {
              const currentRoutes = s.routes || [];
              return { 
                  ...s, 
                  routes: [...currentRoutes, { id: `r-${Date.now()}`, from: '', to: '' }] 
              };
          }
          return s;
      }));
  };

  const handleUpdateRoute = (serviceId: string, routeId: string, field: 'from' | 'to', value: string) => {
      setServices(services.map(s => {
          if (s.id === serviceId && s.routes) {
              return {
                  ...s,
                  routes: s.routes.map(r => r.id === routeId ? { ...r, [field]: value } : r)
              };
          }
          return s;
      }));
  };

  const handleRemoveRoute = (serviceId: string, routeId: string) => {
      setServices(services.map(s => {
          if (s.id === serviceId && s.routes) {
              return {
                  ...s,
                  routes: s.routes.filter(r => r.id !== routeId)
              };
          }
          return s;
      }));
  };

  const updateServiceState = (id: string, field: keyof ServiceItem, value: any) => {
      setServices(services.map(s => {
        if (s.id !== id) return s;
        
        let updatedService = { ...s, [field]: value };
        
        // --- Logic for Hotel Check-in/Check-out ---
        if (updatedService.type === 'Hotel') {
             if (!updatedService.roomCount) updatedService.roomCount = 1;

             // If Check-In is changed, set Check-Out to next day automatically if needed
             if (field === 'checkIn') {
                 const nextDay = getNextDay(value as string);
                 if (!updatedService.checkOut || new Date(updatedService.checkOut) <= new Date(value as string)) {
                     updatedService.checkOut = nextDay;
                 }
             }

             // Recalculate quantity (Nights * Rooms)
             if (field === 'checkIn' || field === 'checkOut' || field === 'roomCount' || field === 'type') {
                 let nights = 1;
                 if (updatedService.checkIn && updatedService.checkOut) {
                     const start = new Date(updatedService.checkIn);
                     const end = new Date(updatedService.checkOut);
                     const diffTime = end.getTime() - start.getTime();
                     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                     nights = diffDays > 0 ? diffDays : 1;
                 }
                 const rooms = Number(updatedService.roomCount) || 1;
                 updatedService.quantity = rooms * nights;
                 setServiceInputBuffers(prev => ({ ...prev, [`${id}-quantity`]: updatedService.quantity.toString() }));
             }
        }

        // --- Logic for Flight Dates ---
        if (updatedService.type === 'Flight') {
            if (field === 'flightDate') {
                // If Return Date exists and is before the new Flight Date, push it forward or keep valid
                if (updatedService.returnDate && new Date(updatedService.returnDate) < new Date(value as string)) {
                    updatedService.returnDate = value as string;
                }
            }
        }

        return updatedService;
    }));
  };

  const handleServiceChange = (id: string, field: keyof ServiceItem, value: any) => {
    if (field === 'costPrice' || field === 'quantity' || field === 'sellingPrice' || field === 'roomCount') {
        const valStr = String(value);
        setServiceInputBuffers(prev => ({ ...prev, [`${id}-${field}`]: valStr }));
        const numericValue = valStr === '' ? 0 : parseFloat(valStr);
        if (!isNaN(numericValue)) updateServiceState(id, field, numericValue);
    } else {
        updateServiceState(id, field, value);
    }
  };

  const handleInventorySelect = (serviceId: string, inventoryId: string) => {
      if (!inventoryId) {
          updateServiceState(serviceId, 'inventoryId', undefined);
          return;
      }
      const inventoryItem = inventory.find(i => i.id === inventoryId);
      if (inventoryItem) {
          let calculatedQty = 1;
          let defaultRooms = 1;
          let nights = 1;
          
          if (inventoryItem.type === 'Hotel' && inventoryItem.checkIn && inventoryItem.checkOut) {
                const start = new Date(inventoryItem.checkIn);
                const end = new Date(inventoryItem.checkOut);
                const diffTime = end.getTime() - start.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                nights = diffDays > 0 ? diffDays : 1;
                calculatedQty = defaultRooms * nights;
          }

          setServices(services.map(s => {
              if (s.id !== serviceId) return s;
              return {
                  ...s,
                  inventoryId: inventoryItem.id,
                  type: inventoryItem.type,
                  supplier: inventoryItem.supplier,
                  costPrice: inventoryItem.costPrice,
                  sellingPrice: inventoryItem.sellingPrice, 
                  costCurrency: inventoryItem.currency,
                  details: inventoryItem.name, 
                  quantity: calculatedQty,
                  roomCount: inventoryItem.type === 'Hotel' ? defaultRooms : undefined,
                  checkIn: inventoryItem.checkIn,
                  checkOut: inventoryItem.checkOut,
                  roomType: inventoryItem.roomType ? inventoryItem.roomType.split(',')[0].trim() : '',
                  hotelName: inventoryItem.name,
                  airline: inventoryItem.airline,
                  route: inventoryItem.route,
                  flightDate: inventoryItem.flightDate,
                  returnDate: inventoryItem.returnDate,
                  departureTime: inventoryItem.departureTime, 
                  arrivalTime: inventoryItem.arrivalTime,
                  country: inventoryItem.country,
                  visaType: inventoryItem.visaType,
                  vehicleType: inventoryItem.vehicleType
              };
          }));
          
          setServiceInputBuffers(prev => ({
              ...prev,
              [`${serviceId}-costPrice`]: inventoryItem.costPrice.toString(),
              [`${serviceId}-sellingPrice`]: inventoryItem.sellingPrice.toString(),
              [`${serviceId}-quantity`]: calculatedQty.toString(),
              [`${serviceId}-roomCount`]: defaultRooms.toString()
          }));
      }
  };

  const handleRemoveService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
    setServiceInputBuffers(prev => {
        const newBuffers = { ...prev };
        Object.keys(newBuffers).forEach(key => {
            if (key.startsWith(`${id}-`)) delete newBuffers[key];
        });
        return newBuffers;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalBookingType = bookingType === 'Other' ? customBookingType.trim() : bookingType;
    if (!finalBookingType) {
        showNotification('يرجى تحديد نوع الملف', 'error');
        return;
    }

    // --- FINAL CALCULATION ---
    // 1. Get Total Sales from the Input Box (System Currency)
    const finalSalesSystem = parseFloat(manualTotalSales) || 0;
    // 2. Convert to JOD for storage
    const systemRate = exchangeRates[systemCurrency] || 1;
    const finalSalesJOD = finalSalesSystem / systemRate;

    // 3. Get Total Cost from calculated state (already in JOD)
    const finalCostJOD = calculatedCostJOD;

    // 4. Calculate Profit
    const finalProfitJOD = finalSalesJOD - finalCostJOD;

    // Initial Payment Calculation
    const initialPaymentValSystem = parseFloat(initialPaidAmount) || 0;
    const initialPaymentValJOD = initialPaymentValSystem / systemRate;
    
    let payments: Payment[] = [];
    let paidAmount = 0;
    let paymentStatus: 'Paid' | 'Unpaid' | 'Partial' = 'Unpaid';

    if (!editingId && initialPaymentValSystem > 0) {
        paidAmount = initialPaymentValJOD;
        paymentStatus = paidAmount >= (finalSalesJOD - 0.01) ? 'Paid' : 'Partial';
        
        payments.push({
            id: `pay-${Date.now()}`,
            amount: initialPaymentValSystem,
            currency: systemCurrency,
            exchangeRate: systemRate,
            finalAmount: initialPaymentValJOD,
            date: bookingDate,
            notes: 'دفعة أولى عند فتح الملف',
            treasuryId: initialTreasuryId
        });
    }

    const bookingData: any = {
        fileNo: fileNo || undefined,
        clientName,
        clientPhone,
        passengers,
        destination: destination || 'General',
        date: bookingDate,
        type: finalBookingType,
        amount: finalSalesJOD,
        cost: finalCostJOD, 
        profit: finalProfitJOD, 
        status,
        serviceCount: services.length,
        services, 
        notes
    };

    if (editingId) {
        const existingBooking = bookings.find(b => b.id === editingId);
        if (existingBooking) {
            bookingData.paidAmount = existingBooking.paidAmount;
            bookingData.payments = existingBooking.payments;
            bookingData.paymentStatus = existingBooking.paymentStatus;
        }
        updateBooking(editingId, bookingData);
        showNotification('تم تحديث الحجز بنجاح', 'success');
    } else {
        bookingData.paidAmount = paidAmount;
        bookingData.paymentStatus = paymentStatus;
        bookingData.payments = payments;
        
        addBooking(bookingData);
        
        if (paidAmount > 0 && initialTreasuryId) {
             addTransaction({
                description: `دفعة أولى ملف جديد - ${clientName}`,
                amount: paidAmount,
                date: bookingDate,
                type: TransactionType.INCOME,
                category: 'مقبوضات حجوزات',
                treasuryId: initialTreasuryId
             });
        }
        showNotification('تم إنشاء الحجز بنجاح', 'success');
    }
    setIsModalOpen(false);
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

  // ... (Voucher logic same as before) ...
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
                {t('bookings')}
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

      {/* ... (Modals) ... */}
      {/* ... WhatsApp Preview Modal ... */}
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

      {/* ... Create/Edit Modal ... */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/95 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white dark:bg-[#020617] w-full max-w-7xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl my-8 relative">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-900 dark:hover:text-white z-10"><X size={24} /></button>

                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="bg-cyan-600 p-2 rounded text-white"><FileText size={24} /></div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{editingId ? 'تعديل الملف' : 'فتح ملف جديد'}</h2>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-2">
                            <User size={14}/> الموظف المسؤول: <span className="font-bold text-slate-700 dark:text-slate-300">
                                {editingId 
                                    ? (bookings.find(b => b.id === editingId)?.createdBy || '-') 
                                    : (currentUser?.name || '-')
                                }
                            </span>
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* ... (Form Inputs same as previous code block) ... */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-xs text-cyan-600 dark:text-cyan-500 font-bold mb-2 text-right">تاريخ السفر</label>
                            <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                         <div>
                            <label className="block text-xs text-cyan-600 dark:text-cyan-500 font-bold mb-2 text-right">حالة الحجز</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value as BookingStatus)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none"><option value={BookingStatus.PENDING}>قيد الانتظار</option><option value={BookingStatus.CONFIRMED}>مؤكد</option><option value={BookingStatus.CANCELLED}>ملغي</option></select>
                        </div>
                        <div>
                            <label className="block text-xs text-cyan-600 dark:text-cyan-500 font-bold mb-2 text-right">نوع الملف</label>
                            <select value={bookingType} onChange={(e) => setBookingType(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none">
                                <option value="Tourism">سياحة</option>
                                <option value="Flight">طيران</option>
                                <option value="General">عام</option>
                                <option value="Umrah">عمرة</option>
                                <option value="Other">أخرى</option>
                            </select>
                            {bookingType === 'Other' && (
                                <input 
                                    type="text" 
                                    placeholder="أدخل اسم نوع الملف"
                                    value={customBookingType} 
                                    onChange={(e) => setCustomBookingType(e.target.value)} 
                                    className="w-full mt-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" 
                                />
                            )}
                        </div>
                        <div>
                            <label className="block text-xs text-cyan-600 dark:text-cyan-500 font-bold mb-2 text-right">اسم العميل *</label>
                            <input required type="text" value={clientName} onChange={handleClientNameChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" list="clientsList"/>
                            <datalist id="clientsList">
                                {clients.map(c => <option key={c.id} value={c.name} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs text-cyan-600 dark:text-cyan-500 font-bold mb-2 text-right">رقم الهاتف</label>
                            <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" placeholder="059xxxxxxx"/>
                        </div>
                        <div>
                            <label className="block text-xs text-cyan-600 dark:text-cyan-500 font-bold mb-2 text-right">رقم الملف</label>
                            <input type="text" value={fileNo} onChange={(e) => setFileNo(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                        
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <div className={bookingType === 'Other' ? 'md:col-span-2' : ''}>
                            <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">الوجهة / ملاحظات عامة</label>
                            <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" placeholder="دبي - 5 أيام" />
                        </div>
                    </div>

                    {/* Passengers Section */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <Users size={16}/> قائمة المسافرين
                            </h4>
                            <button type="button" onClick={handleAddPassenger} className="text-xs flex items-center gap-1 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-300 dark:hover:bg-slate-600">
                                <Plus size={12}/> إضافة
                            </button>
                        </div>
                        <div className="p-4 space-y-2 bg-slate-50 dark:bg-[#0f172a]">
                            {passengers.map((p, i) => (
                                <div key={p.id} className="grid grid-cols-[30px_100px_90px_1fr_130px_110px_80px_30px] gap-2 items-center">
                                    <div className="text-center text-xs text-slate-400">{i+1}</div>
                                    
                                    <select value={p.type} onChange={(e) => handlePassengerChange(p.id, 'type', e.target.value)} className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded p-2 text-xs">
                                        {PASSENGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>

                                    <select value={p.title} onChange={(e) => handlePassengerChange(p.id, 'title', e.target.value)} className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-bold">
                                        {PASSENGER_TITLES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>

                                    <input type="text" value={p.fullName} onChange={(e) => handlePassengerChange(p.id, 'fullName', e.target.value)} placeholder="الاسم الكامل" className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded p-2 text-sm" />
                                    <input type="text" value={p.passportNo} onChange={(e) => handlePassengerChange(p.id, 'passportNo', e.target.value)} placeholder="جواز السفر" className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded p-2 text-sm font-mono" />
                                    <input type="text" value={p.nationality} onChange={(e) => handlePassengerChange(p.id, 'nationality', e.target.value)} placeholder="الجنسية" className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded p-2 text-sm" />
                                    
                                    <select 
                                        value={p.passportSubmitted ? 'true' : 'false'} 
                                        onChange={(e) => handlePassengerChange(p.id, 'passportSubmitted', e.target.value === 'true')} 
                                        className={`bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-bold ${p.passportSubmitted ? 'text-emerald-600' : 'text-slate-500'}`}
                                        title="تم تسليم الجواز؟"
                                    >
                                        <option value="false">لا (No)</option>
                                        <option value="true">نعم (Yes)</option>
                                    </select>

                                    <button onClick={() => handleRemovePassenger(p.id)} className="text-red-500 hover:bg-red-50 rounded p-1"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Services Section */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <Briefcase size={16}/> الخدمات
                            </h4>
                        </div>
                        <div className="p-4 space-y-4 bg-slate-50 dark:bg-[#0f172a]">
                            {services.map((s, i) => (
                                <div key={s.id} className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-4 relative">
                                    <button onClick={() => handleRemoveService(s.id)} className="absolute top-4 left-4 text-red-400"><X size={16}/></button>
                                    
                                    {/* Inventory Selection */}
                                    <div className="mb-4 pl-8 bg-slate-50 dark:bg-[#020617] p-2 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Box size={14} />
                                            <span>سحب من المخزون:</span>
                                        </div>
                                        <select value={s.inventoryId || ''} onChange={(e) => handleInventorySelect(s.id, e.target.value)} className="flex-1 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs">
                                            <option value="">-- اختر عنصر (اختياري) --</option>
                                            {inventory.map(inv => {
                                                const stats = getInventoryStats(inv.id);
                                                return (
                                                    <option key={inv.id} value={inv.id} disabled={stats.remaining <= 0}>
                                                        {inv.name} (المتبقي: {stats.remaining}) - {inv.sellingPrice} {inv.currency}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pl-8">
                                        <select value={s.type} onChange={(e) => handleServiceChange(s.id, 'type', e.target.value)} className="bg-slate-50 dark:bg-[#020617] border border-slate-300 dark:border-slate-600 rounded p-2" disabled={!!s.inventoryId}>
                                            <option value="Flight">طيران</option>
                                            <option value="Hotel">فندق</option>
                                            <option value="Visa">تأشيرة</option>
                                            <option value="Transport">نقل</option>
                                            <option value="Tour">رحلة سياحية</option>
                                            <option value="Insurance">تأمين سفر</option>
                                            <option value="Other">أخرى</option>
                                        </select>
                                        <select value={s.supplier || ''} onChange={(e) => handleServiceChange(s.id, 'supplier', e.target.value)} className="bg-slate-50 dark:bg-[#020617] border border-slate-300 dark:border-slate-600 rounded p-2" disabled={!!s.inventoryId}>
                                            <option value="">اختر مورد...</option>
                                            {agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                                        </select>
                                    </div>
                                    
                                    {/* Specific Fields Based on Type */}
                                    {s.type === 'Flight' && (
                                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                                            <div><label className="block text-[10px] text-slate-500 mb-1">تاريخ الذهاب</label><input type="date" value={s.flightDate || ''} onChange={(e) => handleServiceChange(s.id, 'flightDate', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" /></div>
                                            <div><label className="block text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Clock size={10}/> وقت الإقلاع</label><input type="time" value={s.departureTime || ''} onChange={(e) => handleServiceChange(s.id, 'departureTime', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" /></div>
                                            <div><label className="block text-[10px] text-slate-500 mb-1">تاريخ العودة</label><input type="date" min={s.flightDate} value={s.returnDate || ''} onChange={(e) => handleServiceChange(s.id, 'returnDate', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" /></div>
                                            <div><label className="block text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Clock size={10}/> وقت الوصول</label><input type="time" value={s.arrivalTime || ''} onChange={(e) => handleServiceChange(s.id, 'arrivalTime', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" /></div>
                                            <div><label className="block text-[10px] text-slate-500 mb-1">خط السير</label><input type="text" value={s.route || ''} onChange={(e) => handleServiceChange(s.id, 'route', e.target.value)} placeholder="AMM-DXB" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" /></div>
                                            <div><label className="block text-[10px] text-slate-500 mb-1">PNR / التذكرة</label><input type="text" value={s.ticketNumber || ''} onChange={(e) => handleServiceChange(s.id, 'ticketNumber', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" /></div>
                                        </div>
                                    )}

                                    {s.type === 'Hotel' && (
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                                            <div><label className="block text-[10px] text-slate-500 mb-1">اسم الفندق</label><input type="text" value={s.hotelName || ''} onChange={(e) => handleServiceChange(s.id, 'hotelName', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" disabled={!!s.inventoryId} /></div>
                                            <div>
                                                <label className="block text-[10px] text-slate-500 mb-1">نوع الغرفة</label>
                                                {s.inventoryId ? (
                                                    <select value={s.roomType || ''} onChange={(e) => handleServiceChange(s.id, 'roomType', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs">
                                                        {inventory.find(i => i.id === s.inventoryId)?.roomType?.split(',').map(type => (
                                                            <option key={type.trim()} value={type.trim()}>{type.trim()}</option>
                                                        )) || <option value="">Default</option>}
                                                    </select>
                                                ) : (
                                                    <input type="text" value={s.roomType || ''} onChange={(e) => handleServiceChange(s.id, 'roomType', e.target.value)} placeholder="Double / Single" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" />
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-slate-500 mb-1">عدد الغرف</label>
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    dir="ltr"
                                                    value={serviceInputBuffers[`${s.id}-roomCount`] ?? (s.roomCount || 1)} 
                                                    onChange={(e) => handleServiceChange(s.id, 'roomCount', e.target.value)} 
                                                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-center font-bold" 
                                                />
                                            </div>
                                            <div><label className="block text-[10px] text-slate-500 mb-1">تاريخ الدخول</label><input type="date" value={s.checkIn || ''} onChange={(e) => handleServiceChange(s.id, 'checkIn', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" /></div>
                                            <div><label className="block text-[10px] text-slate-500 mb-1">تاريخ الخروج</label><input type="date" min={getNextDay(s.checkIn || '')} value={s.checkOut || ''} onChange={(e) => handleServiceChange(s.id, 'checkOut', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" /></div>
                                        </div>
                                    )}

                                    {/* NEW: Transport Routes Section */}
                                    {s.type === 'Transport' && (
                                        <div className="mb-4 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">نوع المركبة</label>
                                                    <input type="text" value={s.vehicleType || ''} onChange={(e) => handleServiceChange(s.id, 'vehicleType', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" placeholder="Bus / Car" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">اسم السائق (اختياري)</label>
                                                    <input type="text" value={s.driverName || ''} onChange={(e) => handleServiceChange(s.id, 'driverName', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">تاريخ التنقل</label>
                                                    <input type="date" value={s.transportDate || ''} onChange={(e) => handleServiceChange(s.id, 'transportDate', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" />
                                                </div>
                                            </div>
                                            
                                            <div className="bg-slate-50 dark:bg-[#0f172a] p-3 rounded border border-slate-200 dark:border-slate-700">
                                                <h5 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">خط السير (Segments)</h5>
                                                <div className="space-y-2">
                                                    {(s.routes || []).map((route) => (
                                                        <div key={route.id} className="flex items-center gap-2">
                                                            <div className="flex-1">
                                                                <input type="text" value={route.from} onChange={(e) => handleUpdateRoute(s.id, route.id, 'from', e.target.value)} placeholder="من (From)..." className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" />
                                                            </div>
                                                            <span className="text-slate-400">➝</span>
                                                            <div className="flex-1">
                                                                <input type="text" value={route.to} onChange={(e) => handleUpdateRoute(s.id, route.id, 'to', e.target.value)} placeholder="إلى (To)..." className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" />
                                                            </div>
                                                            <button onClick={() => handleRemoveRoute(s.id, route.id)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => handleAddRoute(s.id)} className="text-xs flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-bold mt-2 hover:underline">
                                                        <Plus size={12} /> إضافة خط سير (Segment)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Financial Row */}
                                    <div className="grid grid-cols-12 gap-2 pt-4 border-t border-slate-200 dark:border-slate-700 items-end bg-slate-50 dark:bg-[#020617]/50 p-2 rounded">
                                        {/* Quantity */}
                                        <div className="col-span-2">
                                            <label className="block text-[10px] text-slate-500 mb-1 text-center">
                                                {s.type === 'Hotel' ? 'ليالي * غرف' : 'الكمية'}
                                            </label>
                                            <input type="number" dir="ltr" value={serviceInputBuffers[`${s.id}-quantity`] ?? s.quantity} onChange={(e) => handleServiceChange(s.id, 'quantity', e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded p-2 text-center font-bold shadow-sm" disabled={s.type === 'Hotel'} />
                                        </div>
                                        
                                        {/* Cost Section (5 Columns) */}
                                        <div className="col-span-5 grid grid-cols-5 gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded border border-slate-200 dark:border-slate-700">
                                            <div className="col-span-2">
                                                <label className="block text-[9px] text-slate-500 mb-1 text-center">Unit Cost</label>
                                                <input type="number" dir="ltr" value={serviceInputBuffers[`${s.id}-costPrice`] ?? s.costPrice} onChange={(e) => handleServiceChange(s.id, 'costPrice', e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs text-center font-bold" />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-[9px] text-slate-500 mb-1 text-center">Curr</label>
                                                <select value={s.costCurrency || 'JOD'} onChange={(e) => handleServiceChange(s.id, 'costCurrency', e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-[10px] font-bold px-0 text-center">
                                                    {Object.keys(exchangeRates).map(curr => <option key={curr} value={curr}>{curr}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="text-center">
                                                    <label className="block text-[9px] text-slate-500 mb-1">Total Cost</label>
                                                    <div className="w-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs text-center font-bold text-slate-600 dark:text-slate-400 h-[34px] flex items-center justify-center dir-ltr">{(s.quantity * (s.costPrice || 0)).toFixed(2)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sales Section (5 Columns) */}
                                        <div className="col-span-5 grid grid-cols-1 gap-1 bg-emerald-50 dark:bg-emerald-900/20 p-1 rounded border border-emerald-100 dark:border-emerald-900/30">
                                            <div>
                                                <label className="block text-[9px] text-emerald-600 dark:text-emerald-400 mb-1 text-center">Unit Sell Price (Optional)</label>
                                                <input type="number" dir="ltr" value={serviceInputBuffers[`${s.id}-sellingPrice`] ?? s.sellingPrice} onChange={(e) => handleServiceChange(s.id, 'sellingPrice', e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-emerald-500/50 dark:border-emerald-500/50 rounded p-1.5 text-center font-bold text-slate-800 dark:text-white shadow-sm focus:ring-1 focus:ring-emerald-500 h-[34px]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <button type="button" onClick={handleAddService} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-500 dark:hover:text-cyan-400 transition-colors flex items-center justify-center gap-2 font-bold">
                                <Plus size={20}/> إضافة خدمة جديدة
                            </button>
                        </div>

                        {/* Notes */}
                        <div className="mt-4 px-4 pb-4">
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded p-3 h-20 resize-none" placeholder="ملاحظات إضافية على الملف..."></textarea>
                        </div>
                    </div>

                    {/* Footer Financials */}
                    <div className="bg-cyan-50 dark:bg-cyan-900/10 rounded-xl border border-cyan-200 dark:border-cyan-800/30 p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                            <div className="relative">
                                <label className="block text-xs text-cyan-700 dark:text-cyan-400 font-bold mb-1">إجمالي سعر البيع (Total Selling Amount)</label>
                                <div className="relative flex items-center">
                                    <input type="number" dir="ltr" step="0.01" value={manualTotalSales} onChange={(e) => setManualTotalSales(e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-cyan-500 rounded-lg p-3 text-slate-900 dark:text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pl-16" placeholder="0.00" />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 px-2 py-0.5 rounded">{systemCurrency}</span>
                                </div>
                            </div>

                            {!editingId && (
                                <>
                                    <div className="relative">
                                        <label className="block text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">المبلغ المدفوع (Paid Amount)</label>
                                        <div className="relative flex items-center">
                                            <input type="number" dir="ltr" step="0.01" value={initialPaidAmount} onChange={(e) => setInitialPaidAmount(e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-emerald-500 rounded-lg p-3 text-slate-900 dark:text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 pl-16" placeholder="0.00" />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded">{systemCurrency}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">الصندوق / الخزينة</label>
                                        <select value={initialTreasuryId} onChange={(e) => setInitialTreasuryId(e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-white focus:outline-none">
                                            <option value="">اختر الصندوق...</option>
                                            {treasury.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="flex justify-end gap-6 pt-4 border-t border-cyan-200 dark:border-cyan-800/30">
                            <div className="text-center bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg">
                                <span className="block text-[10px] text-slate-500 uppercase mb-1">مجموع التكلفة (JOD)</span>
                                <span className="text-lg font-bold text-slate-700 dark:text-slate-300 dir-ltr">{convertAmount(calculatedCostJOD).toFixed(2)}</span>
                            </div>
                            <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 uppercase mb-1">صافي الربح التقريبي (JOD)</span>
                                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 dir-ltr">{convertAmount(calculatedProfitJOD).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#0f172a] p-6 border-t border-slate-200 dark:border-slate-800 rounded-b-xl flex gap-3">
                     <button onClick={handleSubmit} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-8 rounded-xl transition-colors flex-1">
                        {editingId ? 'حفظ التعديلات' : 'إنشاء الملف'}
                    </button>
                    <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-2.5 px-6 rounded-xl transition-colors">
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* ... (Payment and Delete Modals same as previous) ... */}
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
                    {/* ... (Rest of payment form) ... */}
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