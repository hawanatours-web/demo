
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { InventoryItem, Currency, ServiceType } from '../types';
import { Plus, Search, Edit, Trash2, Package, AlertCircle, X, Box, Calendar, Plane, Hotel, Truck, Map, FileText, Printer, User, Hash, Clock } from 'lucide-react';

const InventoryPage: React.FC = () => {
  const { inventory, agents, addInventory, updateInventory, deleteInventory, getInventoryStats, showNotification, t, systemCurrency, convertAmount, exchangeRates, allBookings, companySettings } = useData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false); 
  const [reportItem, setReportItem] = useState<InventoryItem | null>(null); 

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<ServiceType>('Tour');
  const [supplier, setSupplier] = useState('');
  const [totalQuantity, setTotalQuantity] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('JOD');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Specific Fields State
  const [roomType, setRoomType] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [airline, setAirline] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [departureTime, setDepartureTime] = useState(''); // New
  const [arrivalTime, setArrivalTime] = useState(''); // New
  const [route, setRoute] = useState('');
  const [country, setCountry] = useState('');
  const [visaType, setVisaType] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setType('Tour');
    setSupplier('');
    setTotalQuantity('');
    setCostPrice('');
    setSellingPrice('');
    setCurrency('JOD');
    setDescription('');
    setExpiryDate('');
    
    // Reset specific fields
    setRoomType('');
    setCheckIn('');
    setCheckOut('');
    setAirline('');
    setFlightDate('');
    setReturnDate('');
    setDepartureTime('');
    setArrivalTime('');
    setRoute('');
    setCountry('');
    setVisaType('');
    setVehicleType('');

    setIsModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setName(item.name);
    setType(item.type);
    setSupplier(item.supplier);
    setTotalQuantity(item.totalQuantity.toString());
    setCostPrice(item.costPrice.toString());
    setSellingPrice(item.sellingPrice.toString());
    setCurrency(item.currency);
    setDescription(item.description || '');
    setExpiryDate(item.expiryDate || '');

    // Populate specific fields
    setRoomType(item.roomType || '');
    setCheckIn(item.checkIn || '');
    setCheckOut(item.checkOut || '');
    setAirline(item.airline || '');
    setFlightDate(item.flightDate || '');
    setReturnDate(item.returnDate || '');
    setDepartureTime(item.departureTime || '');
    setArrivalTime(item.arrivalTime || '');
    setRoute(item.route || '');
    setCountry(item.country || '');
    setVisaType(item.visaType || '');
    setVehicleType(item.vehicleType || '');

    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericQty = parseInt(totalQuantity) || 0;
    const numericCost = parseFloat(costPrice) || 0;
    const numericSell = parseFloat(sellingPrice) || 0;

    const itemData: any = {
        name,
        type,
        supplier,
        totalQuantity: numericQty,
        costPrice: numericCost,
        sellingPrice: numericSell,
        currency,
        description,
        expiryDate
    };

    // Include specific fields based on type
    if (type === 'Hotel') {
        itemData.roomType = roomType;
        itemData.checkIn = checkIn;
        itemData.checkOut = checkOut;
    } else if (type === 'Flight') {
        itemData.airline = airline;
        itemData.flightDate = flightDate;
        itemData.returnDate = returnDate;
        itemData.departureTime = departureTime;
        itemData.arrivalTime = arrivalTime;
        itemData.route = route;
    } else if (type === 'Visa') {
        itemData.country = country;
        itemData.visaType = visaType;
    } else if (type === 'Transport') {
        itemData.vehicleType = vehicleType;
    }

    if (editingId) {
        updateInventory(editingId, itemData);
        showNotification('تم تحديث المخزون بنجاح', 'success');
    } else {
        addInventory(itemData);
        showNotification('تم إضافة صنف جديد بنجاح', 'success');
    }
    setIsModalOpen(false);
  };

  // ... (Delete and Report logic remains same) ...
  const handleDelete = (id: string) => {
      setDeleteId(id);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if (deleteId) {
          deleteInventory(deleteId);
          showNotification('تم حذف الصنف بنجاح', 'success');
          setIsDeleteModalOpen(false);
      }
  };

  const handleViewReport = (item: InventoryItem) => {
      setReportItem(item);
      setIsReportModalOpen(true);
  };

  // Extract Usage History for Report - using allBookings
  const getUsageHistory = (inventoryId: string) => {
      const history: any[] = [];
      allBookings.forEach(b => {
          b.services.forEach(s => {
              if (s.inventoryId === inventoryId) {
                  history.push({
                      date: b.date,
                      fileNo: b.fileNo || b.id,
                      client: b.clientName,
                      qty: s.quantity,
                      roomCount: s.roomCount, // Include room count
                      type: s.type, // Include type
                      roomType: s.roomType, // Include room type for hotels
                      status: b.status,
                      serviceDetails: s.details || s.hotelName || s.airline || '-'
                  });
              }
          });
      });
      return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handlePrintReport = () => {
      if (!reportItem) return;
      const stats = getInventoryStats(reportItem.id);
      const history = getUsageHistory(reportItem.id);
      const totalCostValue = reportItem.totalQuantity * reportItem.costPrice; // Calculation

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const showLogo = companySettings.logoUrl && (companySettings.logoVisibility === 'both' || companySettings.logoVisibility === 'print');
      const logoHtml = showLogo 
          ? `<img src="${companySettings.logoUrl}" style="max-height: 80px; max-width: 200px; object-fit: contain;" />`
          : `<div class="logo">${companySettings.logoText}</div>`;

      const html = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <title>تقرير مخزون - ${reportItem.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                @page { size: A4; margin: 15mm; }
                body { font-family: 'Cairo', sans-serif; color: #1e293b; padding: 20px; }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; margin-bottom: 20px; }
                .title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #0f172a; }
                
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; text-align: center; }
                .stat-label { font-size: 10px; color: #64748b; }
                .stat-value { font-size: 14px; font-weight: bold; }

                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                th { background: #0ea5e9; color: white; padding: 8px; text-align: right; }
                td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
                
                .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>${logoHtml}</div>
                <div style="text-align: left;">
                    <h2 style="margin:0;">${companySettings.nameAr}</h2>
                    <p style="margin:0; font-size: 10px;">Inventory Report</p>
                </div>
            </div>

            <div class="title">تقرير حركة صنف: ${reportItem.name}</div>

            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-label">الكمية الكلية</div>
                    <div class="stat-value">${reportItem.totalQuantity}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">إجمالي التكلفة</div>
                    <div class="stat-value" style="color: #6366f1;">${totalCostValue.toLocaleString('en-US')} ${reportItem.currency}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">المباع (المحجوز)</div>
                    <div class="stat-value" style="color: #10b981;">${stats.sold}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">المتبقي</div>
                    <div class="stat-value" style="color: #f43f5e;">${stats.remaining}</div>
                </div>
            </div>

            <h3>سجل الحجوزات</h3>
            <table>
                <thead>
                    <tr>
                        <th>التاريخ</th>
                        <th>رقم الملف</th>
                        <th>اسم العميل</th>
                        <th>الكمية / الغرف</th>
                        ${reportItem.type === 'Hotel' ? '<th>نوع الغرفة</th>' : ''}
                        <th>تفاصيل</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.map(h => `
                        <tr>
                            <td>${new Date(h.date).toLocaleDateString('en-GB')}</td>
                            <td>${h.fileNo}</td>
                            <td>${h.client}</td>
                            <td>${h.type === 'Hotel' ? `${h.roomCount || 1} غرف (${h.qty} ليالي)` : h.qty}</td>
                            ${reportItem.type === 'Hotel' ? `<td>${h.roomType || '-'}</td>` : ''}
                            <td>${h.serviceDetails}</td>
                        </tr>
                    `).join('')}
                    ${history.length === 0 ? '<tr><td colspan="5" style="text-align: center;">لا توجد حركات بيع حتى الآن</td></tr>' : ''}
                </tbody>
            </table>

            <div class="footer">
                Printed on: ${new Date().toLocaleString('en-GB')}
            </div>
            <script>window.print();</script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  const getProgressColor = (percentage: number) => {
      if (percentage > 90) return 'bg-red-500';
      if (percentage > 75) return 'bg-amber-500';
      return 'bg-emerald-500';
  };

  const calculateNights = () => {
      if (checkIn && checkOut) {
          const start = new Date(checkIn);
          const end = new Date(checkOut);
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          return diffDays > 0 ? diffDays : 0;
      }
      return 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Package className="text-cyan-600 dark:text-cyan-400" />
                {t('inventory')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">إدارة مخزون التذاكر والغرف والخدمات المسبقة الدفع</p>
        </div>
        <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20">
          <Plus size={18} />
          <span>{t('add_new')}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-4">
         <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
            <input 
                type="text" 
                placeholder={t('search')}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredInventory.map(item => {
              const stats = getInventoryStats(item.id);
              const percentageSold = item.totalQuantity > 0 ? (stats.sold / item.totalQuantity) * 100 : 0;
              
              return (
                  <div key={item.id} className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                      <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleViewReport(item)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="تقرير"><FileText size={16}/></button>
                          <button onClick={() => handleEdit(item)} className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded" title="تعديل"><Edit size={16}/></button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="حذف"><Trash2 size={16}/></button>
                      </div>

                      <div className="flex items-start gap-4 mb-4">
                          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-cyan-600 dark:text-cyan-400">
                              {item.type === 'Flight' ? <Plane size={24} /> : item.type === 'Hotel' ? <Hotel size={24} /> : item.type === 'Transport' ? <Truck size={24} /> : <Box size={24} />}
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-800 dark:text-white text-lg">{item.name}</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400 flex flex-wrap gap-2">
                                  <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-medium">{item.type}</span>
                                  <span>• {item.supplier}</span>
                              </p>
                          </div>
                      </div>

                      <div className="mb-4 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                          {item.type === 'Hotel' && item.checkIn && (
                              <div className="flex gap-2 items-center">
                                  <Calendar size={14} className="text-slate-400" />
                                  <span>{new Date(item.checkIn).toLocaleDateString('en-GB')} <span className="text-slate-400">to</span> {new Date(item.checkOut || '').toLocaleDateString('en-GB')}</span>
                                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">
                                      ({Math.ceil((new Date(item.checkOut || '').getTime() - new Date(item.checkIn).getTime()) / (1000 * 3600 * 24))} ليالي)
                                  </span>
                              </div>
                          )}
                          {item.type === 'Flight' && item.flightDate && (
                              <div className="flex flex-col gap-1">
                                <div className="flex gap-2 items-center">
                                    <Plane size={14} className="text-slate-400" />
                                    <span>{item.airline} - {item.route} ({new Date(item.flightDate).toLocaleDateString('en-GB')})</span>
                                </div>
                                {item.departureTime && <div className="text-xs text-slate-500 ml-6">Takeoff: {item.departureTime} | Landing: {item.arrivalTime || '--'}</div>}
                              </div>
                          )}
                          {item.type === 'Visa' && item.country && (
                              <div className="flex gap-2 items-center">
                                  <Map size={14} className="text-slate-400" />
                                  <span>{item.country} - {item.visaType}</span>
                              </div>
                          )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4 bg-slate-50 dark:bg-[#0f172a] p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="text-center">
                              <p className="text-xs text-slate-500">{item.type === 'Hotel' ? 'Total Rooms' : t('total_quantity')}</p>
                              <p className="font-bold text-slate-800 dark:text-white">{item.totalQuantity}</p>
                          </div>
                          <div className="text-center border-r border-l border-slate-200 dark:border-slate-700">
                              <p className="text-xs text-emerald-600">{t('sold_quantity')}</p>
                              <p className="font-bold text-emerald-600">{stats.sold}</p>
                          </div>
                          <div className="text-center">
                              <p className="text-xs text-blue-600">{t('remaining_quantity')}</p>
                              <p className="font-bold text-blue-600">{stats.remaining}</p>
                          </div>
                      </div>

                      <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{percentageSold.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(percentageSold)}`} style={{ width: `${percentageSold}%` }}></div>
                          </div>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm">
                          <div>
                              <span className="text-slate-500">{item.type === 'Hotel' ? 'Cost/Night' : 'Cost'}: </span>
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{item.costPrice} {item.currency}</span>
                          </div>
                          <div>
                              <span className="text-slate-500">Sell: </span>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.sellingPrice} {item.currency}</span>
                          </div>
                      </div>
                  </div>
              );
          })}
          {filteredInventory.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p>لا يوجد عناصر في المخزون</p>
              </div>
          )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-8">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white">{editingId ? t('edit') : t('add_new')}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('item_name')} *</label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">النوع</label>
                            <select value={type} onChange={e => setType(e.target.value as ServiceType)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none">
                                <option value="Tour">Tour (فعالية/رحلة)</option>
                                <option value="Hotel">Hotel (غرفة)</option>
                                <option value="Flight">Flight (مقعد طيران)</option>
                                <option value="Visa">Visa (تأشيرة)</option>
                                <option value="Transport">Transport (مقعد نقل)</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">المورد</label>
                            <select 
                                value={supplier} 
                                onChange={e => setSupplier(e.target.value)} 
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none"
                            >
                                <option value="">-- اختر مورد --</option>
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.name}>{agent.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Fields Based on Type */}
                    {type === 'Hotel' && (
                        <div className="bg-slate-50 dark:bg-[#0f172a] p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">نوع الغرفة</label>
                                <input type="text" value={roomType} onChange={e => setRoomType(e.target.value)} placeholder="مثال: ثنائي, ثلاثي, جناح" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تاريخ الدخول</label>
                                    <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تاريخ الخروج</label>
                                    <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:text-white" />
                                </div>
                            </div>
                            {checkIn && checkOut && (
                                <p className="text-xs text-emerald-600 text-center font-bold">عدد الليالي: {calculateNights()}</p>
                            )}
                        </div>
                    )}

                    {type === 'Flight' && (
                        <div className="bg-slate-50 dark:bg-[#0f172a] p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">خط الطيران</label>
                                <input type="text" value={airline} onChange={e => setAirline(e.target.value)} placeholder="الملكية / الاماراتية" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">خط السير</label>
                                <input type="text" value={route} onChange={e => setRoute(e.target.value)} placeholder="AMM-DXB-AMM" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:text-white" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تاريخ الذهاب</label>
                                    <input type="date" value={flightDate} onChange={e => setFlightDate(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تاريخ العودة</label>
                                    <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Clock size={10}/> وقت الإقلاع</label>
                                    <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Clock size={10}/> وقت المغادرة</label>
                                    <input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:text-white" />
                                </div>
                            </div>
                        </div>
                    )}

                    {type === 'Visa' && (
                        <div className="bg-slate-50 dark:bg-[#0f172a] p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الدولة</label>
                                    <input type="text" value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">نوع التأشيرة</label>
                                    <input type="text" value={visaType} onChange={e => setVisaType(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:text-white" />
                                </div>
                            </div>
                        </div>
                    )}

                    {type === 'Transport' && (
                        <div className="bg-slate-50 dark:bg-[#0f172a] p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">نوع المركبة</label>
                                <input type="text" value={vehicleType} onChange={e => setVehicleType(e.target.value)} placeholder="Bus / Car" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:text-white" />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                                {type === 'Hotel' ? 'عدد الغرف الكلية (Total Rooms)' : t('total_quantity')}
                            </label>
                            <input type="number" value={totalQuantity} onChange={e => setTotalQuantity(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                                {type === 'Hotel' ? 'سعر التكلفة لليلة (Cost/Night)' : t('cost_price')}
                            </label>
                            <input type="number" value={costPrice} onChange={e => setCostPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('selling_price')}</label>
                            <input type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">العملة</label>
                            <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none">
                                {Object.keys(exchangeRates).map(curr => (
                                    <option key={curr} value={curr}>{curr}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{t('expiry_date')} (اختياري)</label>
                            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">وصف / ملاحظات</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none h-20 resize-none" />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg">{t('cancel')}</button>
                        <button type="submit" className="flex-1 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500">{t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-center">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold dark:text-white mb-2">تأكيد الحذف</h3>
                <p className="text-sm text-slate-500 mb-6">هل أنت متأكد من حذف هذا الصنف؟</p>
                <div className="flex gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">{t('cancel')}</button>
                    <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg">{t('delete')}</button>
                </div>
            </div>
        </div>
      )}

      {/* View Report Modal */}
      {isReportModalOpen && reportItem && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-4xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-cyan-600 dark:text-cyan-400" size={20}/>
                        تقرير المخزون: {reportItem.name}
                    </h3>
                    <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="p-6 overflow-y-auto scrollbar-thin">
                    {/* Stats Grid - Updated with Total Cost */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي الكمية</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white">{reportItem.totalQuantity}</p>
                        </div>
                        <div className="text-center md:border-r md:border-l border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">إجمالي التكلفة</p>
                            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                {(reportItem.totalQuantity * reportItem.costPrice).toLocaleString('en-US')} {reportItem.currency}
                            </p>
                        </div>
                        <div className="text-center md:border-l border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">المباع (Sold)</p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{getInventoryStats(reportItem.id).sold}</p>
                        </div>
                        <div className="text-center md:border-r border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-rose-600 dark:text-rose-400">المتبقي (Remaining)</p>
                            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{getInventoryStats(reportItem.id).remaining}</p>
                        </div>
                    </div>

                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-3 text-sm">سجل الحجوزات والمبيعات</h4>
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="w-full text-right">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3">التاريخ</th>
                                    <th className="px-4 py-3">رقم الملف</th>
                                    <th className="px-4 py-3">اسم العميل</th>
                                    <th className="px-4 py-3">الكمية / الغرف</th>
                                    {reportItem.type === 'Hotel' && <th className="px-4 py-3">نوع الغرفة</th>}
                                    <th className="px-4 py-3">تفاصيل</th>
                                    <th className="px-4 py-3">الحالة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                                {getUsageHistory(reportItem.id).map((record, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{new Date(record.date).toLocaleDateString('en-GB')}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-cyan-600">{record.fileNo}</td>
                                        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{record.client}</td>
                                        <td className="px-4 py-3 font-bold text-emerald-600">{record.type === 'Hotel' ? `${record.roomCount || 1} غرف (${record.qty} ليالي)` : record.qty}</td>
                                        {reportItem.type === 'Hotel' && <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{record.roomType || '-'}</td>}
                                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">{record.serviceDetails}</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200 dark:border-slate-600">
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {getUsageHistory(reportItem.id).length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-8 text-slate-500">لا توجد حركات بيع لهذا الصنف حتى الآن.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] flex justify-end gap-3">
                    <button onClick={handlePrintReport} className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg transition-colors">
                        <Printer size={16} /> طباعة التقرير
                    </button>
                    <button onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors">
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
