
import React, { useState, useEffect } from 'react';
import { BookingStatus, ServiceItem, Passenger, Booking, Payment, Currency, TransactionType, InventoryItem, RouteSegment } from '../types';
import { Plus, X, Trash2, FileText, User, Box, Briefcase, Clock, Sparkles, Loader2, Info, Phone, Plane, ArrowDown, MapPin } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getFlightDetails, getHotelDetails } from '../services/geminiService';

interface BookingFormModalProps {
    editingId: string | null;
    onClose: () => void;
}

// Constants
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

const getNextDay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
};

const BookingFormModal: React.FC<BookingFormModalProps> = ({ editingId, onClose }) => {
    const { 
        bookings, agents, clients, treasury, addBooking, updateBooking, addTransaction, 
        systemCurrency, convertAmount, showNotification, currentUser, exchangeRates, 
        inventory, getInventoryStats, addClient, updateClient
    } = useData();

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
    
    // Financials
    const [manualTotalSales, setManualTotalSales] = useState<string>('');
    const [calculatedCostJOD, setCalculatedCostJOD] = useState<number>(0);
    const [calculatedProfitJOD, setCalculatedProfitJOD] = useState<number>(0);
    const [initialPaidAmount, setInitialPaidAmount] = useState<string>('');
    const [initialTreasuryId, setInitialTreasuryId] = useState<string>('');

    // Data Arrays
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [serviceInputBuffers, setServiceInputBuffers] = useState<Record<string, string>>({});
    
    // UI States
    const [isFlightLoading, setIsFlightLoading] = useState<string | null>(null);
    const [isHotelLoading, setIsHotelLoading] = useState<string | null>(null);

    // --- Initialize Data ---
    useEffect(() => {
        if (editingId) {
            const booking = bookings.find(b => b.id === editingId);
            if (booking) {
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
            }
        } else {
            // Defaults for New Booking
            setBookingType('Tourism');
            setCustomBookingType('');
            setClientName('');
            setClientPhone('');
            setFileNo(''); 
            setBookingDate(new Date().toISOString().split('T')[0]);
            setDestination('');
            setNotes('');
            setStatus(BookingStatus.PENDING);
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
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingId]); // Dependencies restricted to prevent re-initialization on context updates

    // --- Calculations ---
    useEffect(() => {
        let totalCostJOD = 0;
        services.forEach(s => {
            const costRate = exchangeRates[s.costCurrency || 'JOD'] || 1;
            const itemCost = Number(s.costPrice || 0) * Number(s.quantity || 0);
            const costInJOD = itemCost / costRate;
            totalCostJOD += costInJOD;
        });
        setCalculatedCostJOD(totalCostJOD);
    }, [services, exchangeRates]);

    useEffect(() => {
        const systemRate = exchangeRates[systemCurrency] || 1;
        const salesJOD = (parseFloat(manualTotalSales) || 0) / systemRate;
        const profit = salesJOD - calculatedCostJOD;
        setCalculatedProfitJOD(profit);
    }, [manualTotalSales, calculatedCostJOD, systemCurrency, exchangeRates]);

    // --- Handlers ---
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
        setServices(prev => [...prev, {
            id: `s-${Date.now()}`,
            type: 'Flight', 
            quantity: 1,
            costPrice: 0,
            sellingPrice: 0,
            costCurrency: 'JOD',
            date: new Date().toISOString().split('T')[0]
        }]);
    };

    // Routes Management
    const handleAddRoute = (serviceId: string, isFlight: boolean = false) => {
        setServices(prev => prev.map(s => {
            if (s.id === serviceId) {
                const currentRoutes = s.routes || [];
                const newSegment: RouteSegment = { 
                    id: `r-${Date.now()}`, 
                    from: '', 
                    to: '',
                    date: isFlight ? s.flightDate : '',
                    flightNumber: '',
                    airline: isFlight ? s.airline : '',
                    departureTime: '',
                    arrivalTime: ''
                };
                return { ...s, routes: [...currentRoutes, newSegment] };
            }
            return s;
        }));
    };

    const handleUpdateRoute = (serviceId: string, routeId: string, field: keyof RouteSegment, value: string) => {
        setServices(prev => prev.map(s => {
            if (s.id === serviceId && s.routes) {
                return { ...s, routes: s.routes.map(r => r.id === routeId ? { ...r, [field]: value } : r) };
            }
            return s;
        }));
    };

    const handleRemoveRoute = (serviceId: string, routeId: string) => {
        setServices(prev => prev.map(s => {
            if (s.id === serviceId && s.routes) {
                return { ...s, routes: s.routes.filter(r => r.id !== routeId) };
            }
            return s;
        }));
    };

    const updateServiceState = (id: string, field: keyof ServiceItem, value: any) => {
        setServices(prev => prev.map(s => {
            if (s.id !== id) return s;
            let updatedService = { ...s, [field]: value };
            
            if (field === 'type' && value !== s.type) {
                updatedService.supplier = '';
                if (value !== 'Hotel') {
                    updatedService.roomType = undefined; updatedService.checkIn = undefined; updatedService.checkOut = undefined; updatedService.roomCount = undefined; updatedService.hotelAddress = undefined;
                }
                if (value !== 'Flight') {
                    updatedService.airline = undefined; updatedService.flightDate = undefined; updatedService.ticketNumber = undefined;
                }
            }

            if (updatedService.type === 'Hotel') {
                if (!updatedService.roomCount) updatedService.roomCount = 1;
                if (field === 'checkIn') {
                    const nextDay = getNextDay(value as string);
                    if (!updatedService.checkOut || new Date(updatedService.checkOut) <= new Date(value as string)) {
                        updatedService.checkOut = nextDay;
                    }
                }
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
                }
            }
            if (updatedService.type === 'Flight') {
                if (field === 'flightDate') {
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

    // AI Flight Search
    const handleFetchFlightInfo = async (serviceId: string, flightNo: string, date: string, routeId?: string) => {
        if (!flightNo || !date) {
            showNotification('يرجى إدخال رقم الرحلة وتاريخ الذهاب', 'error');
            return;
        }
        setIsFlightLoading(routeId ? `${serviceId}-${routeId}` : serviceId);
        const details = await getFlightDetails(flightNo, date);
        setIsFlightLoading(null);

        if (details) {
            setServices(prevServices => prevServices.map(s => {
                if (s.id === serviceId) {
                    if (routeId && s.routes) {
                        const updatedRoutes = s.routes.map(r => r.id === routeId ? {
                            ...r,
                            airline: details.airline || r.airline,
                            departureTime: details.departureTime || r.departureTime,
                            arrivalTime: details.arrivalTime || r.arrivalTime,
                            from: details.route?.split('-')[0] || r.from,
                            to: details.route?.split('-')[1] || r.to,
                        } : r);
                        return { ...s, routes: updatedRoutes };
                    } else {
                        return {
                            ...s,
                            airline: details.airline || s.airline,
                            departureTime: details.departureTime || s.departureTime,
                            arrivalTime: details.arrivalTime || s.arrivalTime,
                            route: details.route || s.route,
                        };
                    }
                }
                return s;
            }));
            showNotification('تم جلب تفاصيل الرحلة بنجاح', 'success');
        } else {
            showNotification('لم يتم العثور على تفاصيل لهذه الرحلة', 'error');
        }
    };

    // AI Hotel Info Search
    const handleFetchHotelInfo = async (serviceId: string, hotelName: string) => {
        if (!hotelName) {
            showNotification('يرجى إدخال اسم الفندق', 'error');
            return;
        }
        setIsHotelLoading(serviceId);
        const details = await getHotelDetails(hotelName, destination);
        setIsHotelLoading(null);

        if (details && details.address) {
            setServices(prevServices => prevServices.map(s => {
                if (s.id === serviceId) {
                    return { ...s, hotelAddress: details.address };
                }
                return s;
            }));
            showNotification('تم جلب عنوان الفندق بنجاح', 'success');
        } else {
            showNotification('لم يتم العثور على عنوان دقيق', 'error');
        }
    };

    const handleInventorySelect = (serviceId: string, inventoryId: string) => {
        if (!inventoryId) {
            updateServiceState(serviceId, 'inventoryId', undefined);
            return;
        }
        const inventoryItem = inventory.find(i => i.id === inventoryId);
        if (inventoryItem) {
            setServices(prev => prev.map(s => {
                if (s.id !== serviceId) return s;
                
                let calculatedQty = 1;
                let defaultRooms = 1;
                
                if (inventoryItem.type === 'Hotel' && inventoryItem.checkIn && inventoryItem.checkOut) {
                    const start = new Date(inventoryItem.checkIn);
                    const end = new Date(inventoryItem.checkOut);
                    const diffTime = end.getTime() - start.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const nights = diffDays > 0 ? diffDays : 1;
                    calculatedQty = defaultRooms * nights;
                }

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
            
            let calculatedQty = 1;
            let defaultRooms = 1;
            if (inventoryItem.type === 'Hotel' && inventoryItem.checkIn && inventoryItem.checkOut) {
                 const start = new Date(inventoryItem.checkIn);
                 const end = new Date(inventoryItem.checkOut);
                 const diffTime = end.getTime() - start.getTime();
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 const nights = diffDays > 0 ? diffDays : 1;
                 calculatedQty = defaultRooms * nights;
            }

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
        setServices(prev => prev.filter(s => s.id !== id));
        setServiceInputBuffers(prev => {
            const newBuffers = { ...prev };
            Object.keys(newBuffers).forEach(key => {
                if (key.startsWith(`${id}-`)) delete newBuffers[key];
            });
            return newBuffers;
        });
    };

    // Helper to filter agents based on service type with STRICT matching
    const getAgentsForService = (serviceType: string, currentSupplier?: string) => {
        return agents.filter(agent => {
            // Always include currently selected supplier to avoid UI glitches
            if (currentSupplier && agent.name === currentSupplier) return true;
            
            // Normalize agent type for comparison
            const type = (agent.type || '').toLowerCase().trim();

            // 1. STRICT General types (Only these show up everywhere)
            // Removed loose keywords like 'agency', 'office' to prevent 'Visa Agency' showing in Flight
            const generalTypes = ['general', 'wholesale', 'عام', 'مزود خدمة', 'شامل', 'مكتب سياحة وسفر'];
            
            // Check exact matches or if it contains specific general terms without being specific to a service
            if (generalTypes.some(t => type === t || type === t.toLowerCase()) || agent.type === 'General' || agent.type === 'Wholesale') {
                return true;
            }

            // 2. Strict mapping based on Service Type
            switch (serviceType) {
                case 'Flight': 
                    // Matches: Airline, Flight, Aviation, Tkt, طيران, تذاكر
                    return type === 'airline' || type.includes('flight') || type.includes('airline') || type.includes('طيران') || type.includes('تذاكر') || type.includes('aviation');
                
                case 'Hotel': 
                    // Matches: Hotel, Room, Accommodation, فندق, فنادق, إقامة
                    return type === 'hotel' || type.includes('hotel') || type.includes('room') || type.includes('فندق') || type.includes('فنادق') || type.includes('إقامة');
                
                case 'Visa': 
                    // Matches: Visa, تأشيرة, فيزا
                    return type === 'visa' || type.includes('visa') || type.includes('تأشير') || type.includes('فيزا');
                
                case 'Transport': 
                    // Matches: Transport, Bus, Car, نقل, مواصلات, سيارة
                    return type === 'transport' || type.includes('transport') || type.includes('nacl') || type.includes('نقل') || type.includes('مواصلات') || type.includes('car') || type.includes('bus');
                
                case 'Insurance': 
                    // Matches: Insurance, تأمين
                    return type === 'insurance' || type.includes('insurance') || type.includes('تأمين');
                
                case 'Tour': 
                    // Matches: Tour, Trip, Tourism, سياحة, رحلات (Excluded Umrah to be strict)
                    return type === 'tour' || type.includes('tour') || type.includes('trip') || type.includes('سياح') || type.includes('رحل');
                
                case 'Umrah': 
                    // Matches: Umrah, Hajj, Haj, عمرة, حج
                    return type === 'umrah' || type.includes('umrah') || type.includes('haj') || type.includes('عمر') || type.includes('حج');
                
                case 'Other': 
                    return true; // Show all for 'Other' service type
                
                default: 
                    return false; // If service type is unknown/empty, show nothing (or just generals)
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const finalBookingType = bookingType === 'Other' ? customBookingType.trim() : bookingType;
        if (!finalBookingType) {
            showNotification('يرجى تحديد نوع الملف', 'error');
            return;
        }

        const systemRate = exchangeRates[systemCurrency] || 1;
        const finalSalesJOD = (parseFloat(manualTotalSales) || 0) / systemRate;
        const finalCostJOD = calculatedCostJOD;
        const finalProfitJOD = finalSalesJOD - finalCostJOD;

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
                
                // RECALCULATE STATUS ON EDIT
                const currentPaid = existingBooking.paidAmount;
                const newTotal = bookingData.amount;
                
                let newStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
                if (currentPaid >= newTotal - 0.01) {
                    newStatus = 'Paid';
                } else if (currentPaid > 0) {
                    newStatus = 'Partial';
                }
                
                bookingData.paymentStatus = newStatus;
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
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/95 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white dark:bg-[#020617] w-full max-w-7xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl my-8 relative">
                <button onClick={onClose} className="absolute top-4 left-4 text-slate-400 hover:text-slate-900 dark:hover:text-white z-10"><X size={24} /></button>

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
                    {/* Basic Info */}
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
                                <input type="text" placeholder="أدخل اسم نوع الملف" value={customBookingType} onChange={(e) => setCustomBookingType(e.target.value)} className="w-full mt-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                            )}
                        </div>
                        <div>
                            <label className="block text-xs text-cyan-600 dark:text-cyan-500 font-bold mb-2 text-right">اسم العميل *</label>
                            <input required type="text" value={clientName} onChange={handleClientNameChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" list="clientsList"/>
                            <datalist id="clientsList">{clients.map(c => <option key={c.id} value={c.name} />)}</datalist>
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

                    {/* Passengers */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><User size={16}/> قائمة المسافرين</h4>
                            <button type="button" onClick={handleAddPassenger} className="text-xs flex items-center gap-1 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-300 dark:hover:bg-slate-600"><Plus size={12}/> إضافة</button>
                        </div>
                        <div className="p-4 space-y-2 bg-slate-50 dark:bg-[#0f172a]">
                            {passengers.map((p, i) => (
                                <div key={p.id} className="grid grid-cols-[30px_100px_90px_1fr_130px_110px_80px_30px] gap-2 items-center">
                                    <div className="text-center text-xs text-slate-400">{i+1}</div>
                                    <select value={p.type} onChange={(e) => handlePassengerChange(p.id, 'type', e.target.value)} className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded p-2 text-xs">{PASSENGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                                    <select value={p.title} onChange={(e) => handlePassengerChange(p.id, 'title', e.target.value)} className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-bold">{PASSENGER_TITLES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
                                    <input type="text" value={p.fullName} onChange={(e) => handlePassengerChange(p.id, 'fullName', e.target.value)} placeholder="الاسم الكامل" className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded p-2 text-sm" />
                                    <input type="text" value={p.passportNo} onChange={(e) => handlePassengerChange(p.id, 'passportNo', e.target.value)} placeholder="جواز السفر" className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded p-2 text-sm font-mono" />
                                    <input type="text" value={p.nationality} onChange={(e) => handlePassengerChange(p.id, 'nationality', e.target.value)} placeholder="الجنسية" className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded p-2 text-sm" />
                                    <select value={p.passportSubmitted ? 'true' : 'false'} onChange={(e) => handlePassengerChange(p.id, 'passportSubmitted', e.target.value === 'true')} className={`bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded p-2 text-xs font-bold ${p.passportSubmitted ? 'text-emerald-600' : 'text-slate-500'}`} title="تم تسليم الجواز؟"><option value="false">لا (No)</option><option value="true">نعم (Yes)</option></select>
                                    <button onClick={() => handleRemovePassenger(p.id)} className="text-red-500 hover:bg-red-50 rounded p-1"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Services */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2"><Briefcase size={16}/> الخدمات</h4>
                        </div>
                        <div className="p-4 space-y-4 bg-slate-50 dark:bg-[#0f172a]">
                            {services.map((s, i) => (
                                <div key={s.id} className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-4 relative">
                                    <button onClick={() => handleRemoveService(s.id)} className="absolute top-4 left-4 text-red-400"><X size={16}/></button>
                                    
                                    <div className="mb-4 pl-8 bg-slate-50 dark:bg-[#020617] p-2 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500"><Box size={14} /><span>سحب من المخزون:</span></div>
                                        <select value={s.inventoryId || ''} onChange={(e) => handleInventorySelect(s.id, e.target.value)} className="flex-1 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs"><option value="">-- اختر عنصر (اختياري) --</option>{inventory.map(inv => { const stats = getInventoryStats(inv.id); return (<option key={inv.id} value={inv.id} disabled={stats.remaining <= 0}>{inv.name} (المتبقي: {stats.remaining}) - {inv.sellingPrice} {inv.currency}</option>); })}</select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pl-8">
                                        <select value={s.type} onChange={(e) => handleServiceChange(s.id, 'type', e.target.value)} className="bg-slate-50 dark:bg-[#020617] border border-slate-300 dark:border-slate-600 rounded p-2" disabled={!!s.inventoryId}><option value="Flight">طيران</option><option value="Hotel">فندق</option><option value="Visa">تأشيرة</option><option value="Transport">نقل</option><option value="Tour">رحلة سياحية</option><option value="Umrah">عمرة</option><option value="Insurance">تأمين سفر</option><option value="Other">أخرى</option></select>
                                        <select value={s.supplier || ''} onChange={(e) => handleServiceChange(s.id, 'supplier', e.target.value)} className="bg-slate-50 dark:bg-[#020617] border border-slate-300 dark:border-slate-600 rounded p-2" disabled={!!s.inventoryId}>
                                            <option value="">اختر مورد...</option>
                                            {getAgentsForService(s.type, s.supplier).map(a => (
                                                <option key={a.id} value={a.name}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {s.type === 'Flight' && (
                                        <div className="mb-4 space-y-3">
                                            {/* Flight Segment 1 (Main) */}
                                            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-3 relative">
                                                <h5 className="text-xs font-bold text-cyan-700 dark:text-cyan-400 mb-2 flex items-center gap-1"><Plane size={12}/> رحلة الذهاب / المقطع الرئيسي</h5>
                                                
                                                <div className="flex items-end gap-2 mb-2 p-2 bg-cyan-50 dark:bg-cyan-900/10 rounded-lg border border-cyan-100 dark:border-cyan-800">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] text-slate-500 mb-1">تاريخ (للبحث)</label>
                                                        <input type="date" value={s.flightDate || ''} onChange={(e) => handleServiceChange(s.id, 'flightDate', e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs h-[32px]" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] text-slate-500 mb-1">رقم الرحلة (للبحث)</label>
                                                        <input type="text" value={s.ticketNumber || ''} onChange={(e) => handleServiceChange(s.id, 'ticketNumber', e.target.value)} placeholder="ex: RJ 261" className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs h-[32px]" />
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleFetchFlightInfo(s.id, s.ticketNumber || '', s.flightDate || '')} 
                                                        disabled={isFlightLoading === s.id} 
                                                        className="bg-cyan-600 text-white px-3 rounded hover:bg-cyan-500 disabled:opacity-50 flex items-center gap-1 text-xs font-bold h-[32px] transition-colors"
                                                    >
                                                        {isFlightLoading === s.id ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} 
                                                        جلب
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                                    <div><label className="block text-[10px] text-slate-500 mb-1">التاريخ</label><input type="date" value={s.flightDate || ''} onChange={(e) => handleServiceChange(s.id, 'flightDate', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" /></div>
                                                    <div><label className="block text-[10px] text-slate-500 mb-1">إقلاع</label><input type="time" value={s.departureTime || ''} onChange={(e) => handleServiceChange(s.id, 'departureTime', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" /></div>
                                                    <div><label className="block text-[10px] text-slate-500 mb-1">وصول</label><input type="time" value={s.arrivalTime || ''} onChange={(e) => handleServiceChange(s.id, 'arrivalTime', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" /></div>
                                                    <div><label className="block text-[10px] text-slate-500 mb-1">خط السير</label><input type="text" value={s.route || ''} onChange={(e) => handleServiceChange(s.id, 'route', e.target.value)} placeholder="AMM-DXB" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" /></div>
                                                    <div><label className="block text-[10px] text-slate-500 mb-1">الطيران</label><input type="text" value={s.airline || ''} onChange={(e) => handleServiceChange(s.id, 'airline', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" /></div>
                                                    <div><label className="block text-[10px] text-slate-500 mb-1">رقم الرحلة</label><input type="text" value={s.ticketNumber || ''} onChange={(e) => handleServiceChange(s.id, 'ticketNumber', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" /></div>
                                                </div>
                                            </div>

                                            {/* Additional Flight Segments (Connecting/Return) */}
                                            {s.routes && s.routes.map((route, idx) => (
                                                <div key={route.id} className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-lg p-3 relative mt-2">
                                                    <button onClick={() => handleRemoveRoute(s.id, route.id)} className="absolute top-2 left-2 text-red-400 hover:text-red-600"><X size={14}/></button>
                                                    <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1"><ArrowDown size={12}/> رحلة ربط / عودة #{idx + 1}</h5>
                                                    
                                                    {/* AI Fetch for Segment */}
                                                    <div className="flex items-end gap-2 mb-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] text-slate-500 mb-1">تاريخ (للبحث)</label>
                                                            <input type="date" value={route.date || ''} onChange={(e) => handleUpdateRoute(s.id, route.id, 'date', e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs h-[32px]" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="block text-[10px] text-slate-500 mb-1">رقم الرحلة (للبحث)</label>
                                                            <input type="text" value={route.flightNumber || ''} onChange={(e) => handleUpdateRoute(s.id, route.id, 'flightNumber', e.target.value)} placeholder="ex: RJ 262" className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs h-[32px]" />
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleFetchFlightInfo(s.id, route.flightNumber || '', route.date || '', route.id)} 
                                                            disabled={isFlightLoading === `${s.id}-${route.id}`} 
                                                            className="bg-slate-600 text-white px-3 rounded hover:bg-slate-500 disabled:opacity-50 flex items-center gap-1 text-xs font-bold h-[32px] transition-colors"
                                                        >
                                                            {isFlightLoading === `${s.id}-${route.id}` ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} 
                                                            جلب
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                                        <div><label className="block text-[10px] text-slate-500 mb-1">التاريخ</label><input type="date" value={route.date || ''} onChange={(e) => handleUpdateRoute(s.id, route.id, 'date', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" /></div>
                                                        <div><label className="block text-[10px] text-slate-500 mb-1">إقلاع</label><input type="time" value={route.departureTime || ''} onChange={(e) => handleUpdateRoute(s.id, route.id, 'departureTime', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" /></div>
                                                        <div><label className="block text-[10px] text-slate-500 mb-1">وصول</label><input type="time" value={route.arrivalTime || ''} onChange={(e) => handleUpdateRoute(s.id, route.id, 'arrivalTime', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" /></div>
                                                        <div><label className="block text-[10px] text-slate-500 mb-1">من (From)</label><input type="text" value={route.from || ''} onChange={(e) => handleUpdateRoute(s.id, route.id, 'from', e.target.value)} placeholder="DXB" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" /></div>
                                                        <div><label className="block text-[10px] text-slate-500 mb-1">إلى (To)</label><input type="text" value={route.to || ''} onChange={(e) => handleUpdateRoute(s.id, route.id, 'to', e.target.value)} placeholder="AMM" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" /></div>
                                                        <div><label className="block text-[10px] text-slate-500 mb-1">الطيران</label><input type="text" value={route.airline || ''} onChange={(e) => handleUpdateRoute(s.id, route.id, 'airline', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs" /></div>
                                                    </div>
                                                </div>
                                            ))}

                                            <button 
                                                type="button" 
                                                onClick={() => handleAddRoute(s.id, true)} 
                                                className="text-xs flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-bold mt-2 hover:underline border border-dashed border-cyan-300 dark:border-cyan-800 px-3 py-2 rounded-lg w-full justify-center"
                                            >
                                                <Plus size={12} /> إضافة مقطع طيران آخر (Add Segment)
                                            </button>
                                        </div>
                                    )}

                                    {s.type === 'Hotel' && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-[10px] text-slate-500 mb-1">اسم الفندق</label>
                                                    <div className="flex items-center gap-1">
                                                        <input type="text" value={s.hotelName || ''} onChange={(e) => handleServiceChange(s.id, 'hotelName', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" disabled={!!s.inventoryId} />
                                                        {!s.inventoryId && (
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleFetchHotelInfo(s.id, s.hotelName || '')} 
                                                                disabled={isHotelLoading === s.id}
                                                                className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-cyan-100 hover:text-cyan-600"
                                                                title="جلب عنوان الفندق"
                                                            >
                                                                {isHotelLoading === s.id ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div><label className="block text-[10px] text-slate-500 mb-1">نوع الغرفة</label>{s.inventoryId ? (<select value={s.roomType || ''} onChange={(e) => handleServiceChange(s.id, 'roomType', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs">{inventory.find(i => i.id === s.inventoryId)?.roomType?.split(',').map(type => (<option key={type.trim()} value={type.trim()}>{type.trim()}</option>)) || <option value="">Default</option>}</select>) : (<input type="text" value={s.roomType || ''} onChange={(e) => handleServiceChange(s.id, 'roomType', e.target.value)} placeholder="Double / Single" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" />)}</div>
                                                <div><label className="block text-[10px] text-slate-500 mb-1">عدد الغرف</label><input type="number" min="1" dir="ltr" value={serviceInputBuffers[`${s.id}-roomCount`] ?? (s.roomCount || 1)} onChange={(e) => handleServiceChange(s.id, 'roomCount', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-center font-bold" /></div>
                                                <div><label className="block text-[10px] text-slate-500 mb-1">تاريخ الدخول</label><input type="date" value={s.checkIn || ''} onChange={(e) => handleServiceChange(s.id, 'checkIn', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" /></div>
                                                <div><label className="block text-[10px] text-slate-500 mb-1">تاريخ الخروج</label><input type="date" min={getNextDay(s.checkIn || '')} value={s.checkOut || ''} onChange={(e) => handleServiceChange(s.id, 'checkOut', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" /></div>
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-[10px] text-slate-500 mb-1 flex items-center gap-1"><MapPin size={10} /> عنوان الفندق (يظهر في الفاوتشر)</label>
                                                <input type="text" value={s.hotelAddress || ''} onChange={(e) => handleServiceChange(s.id, 'hotelAddress', e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-xs" placeholder="العنوان الكامل..." />
                                            </div>
                                        </>
                                    )}

                                    {/* Transport Routes Section */}
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
                                                    <button onClick={() => handleAddRoute(s.id, false)} className="text-xs flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-bold mt-2 hover:underline">
                                                        <Plus size={12} /> إضافة خط سير (Segment)
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-12 gap-2 pt-4 border-t border-slate-200 dark:border-slate-700 items-end bg-slate-50 dark:bg-[#020617]/50 p-2 rounded">
                                        <div className="col-span-2"><label className="block text-[10px] text-slate-500 mb-1 text-center">{s.type === 'Hotel' ? 'ليالي * غرف' : 'الكمية'}</label><input type="number" dir="ltr" value={serviceInputBuffers[`${s.id}-quantity`] ?? s.quantity} onChange={(e) => handleServiceChange(s.id, 'quantity', e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded p-2 text-center font-bold shadow-sm" disabled={s.type === 'Hotel'} /></div>
                                        <div className="col-span-5 grid grid-cols-5 gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded border border-slate-200 dark:border-slate-700">
                                            <div className="col-span-2"><label className="block text-[9px] text-slate-500 mb-1 text-center">Unit Cost</label><input type="number" dir="ltr" value={serviceInputBuffers[`${s.id}-costPrice`] ?? s.costPrice} onChange={(e) => handleServiceChange(s.id, 'costPrice', e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs text-center font-bold" /></div>
                                            <div className="col-span-1"><label className="block text-[9px] text-slate-500 mb-1 text-center">Curr</label><select value={s.costCurrency || 'JOD'} onChange={(e) => handleServiceChange(s.id, 'costCurrency', e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-1.5 text-[10px] font-bold px-0 text-center">{Object.keys(exchangeRates).map(curr => <option key={curr} value={curr}>{curr}</option>)}</select></div>
                                            <div className="col-span-2"><div className="text-center"><label className="block text-[9px] text-slate-500 mb-1">Total Cost</label><div className="w-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs text-center font-bold text-slate-600 dark:text-slate-400 h-[34px] flex items-center justify-center dir-ltr">{(s.quantity * (s.costPrice || 0)).toFixed(2)}</div></div></div>
                                        </div>
                                        <div className="col-span-5 grid grid-cols-1 gap-1 bg-emerald-50 dark:bg-emerald-900/20 p-1 rounded border border-emerald-100 dark:border-emerald-900/30"><div><label className="block text-[9px] text-emerald-600 dark:text-emerald-400 mb-1 text-center">Unit Sell Price (Optional)</label><input type="number" dir="ltr" value={serviceInputBuffers[`${s.id}-sellingPrice`] ?? s.sellingPrice} onChange={(e) => handleServiceChange(s.id, 'sellingPrice', e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-emerald-500/50 dark:border-emerald-500/50 rounded p-1.5 text-center font-bold text-slate-800 dark:text-white shadow-sm focus:ring-1 focus:ring-emerald-500 h-[34px]" /></div></div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddService} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-500 dark:hover:text-cyan-400 transition-colors flex items-center justify-center gap-2 font-bold"><Plus size={20}/> إضافة خدمة جديدة</button>
                        </div>
                        <div className="mt-4 px-4 pb-4"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded p-3 h-20 resize-none" placeholder="ملاحظات إضافية على الملف..."></textarea></div>
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
                    <button onClick={onClose} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-2.5 px-6 rounded-xl transition-colors">
                        إلغاء
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingFormModal;
