
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { InventoryItem, Currency, ServiceType } from '../types';
import { Plus, Search, Edit, Trash2, Package, AlertCircle, X, Box, Calendar, Plane, Hotel, Truck, Map, FileText, Printer, User, Hash, Clock, Calculator, Moon } from 'lucide-react';

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
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [route, setRoute] = useState('');
  const [country, setCountry] = useState('');
  const [visaType, setVisaType] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  // Hotel Calculation State
  const [inventoryRoomCount, setInventoryRoomCount] = useState<string>('');
  const [costPerNight, setCostPerNight] = useState<string>('');
  const [sellingPricePerNight, setSellingPricePerNight] = useState<string>('');

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateNights = (startStr?: string, endStr?: string) => {
      const s = startStr || checkIn;
      const e = endStr || checkOut;
      if (s && e) {
          const start = new Date(s);
          const end = new Date(e);
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          return diffDays > 0 ? diffDays : 0;
      }
      return 0;
  };

  // Effect to auto-calculate Hotel totals
  useEffect(() => {
      if (type === 'Hotel') {
          const rooms = parseInt(inventoryRoomCount) || 0;
          
          // CHANGE: For Hotel, Total Quantity IS the Number of Rooms.
          // Capacity (Rooms * Nights) is just for display/calculation, not the stored stock unit.
          if (rooms > 0) {
              setTotalQuantity(rooms.toString());
          }
          
          if (costPerNight) {
              setCostPrice(costPerNight);
          }
          
          if (sellingPricePerNight) {
              setSellingPrice(sellingPricePerNight);
          }
      }
  }, [inventoryRoomCount, costPerNight, sellingPricePerNight, type]);

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
    
    // Reset Hotel Calc
    setInventoryRoomCount('');
    setCostPerNight('');
    setSellingPricePerNight('');

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

    // Calculate Hotel specifics for edit
    if (item.type === 'Hotel') {
        // CHANGE: totalQuantity now stores ROOMS directly
        const rooms = item.totalQuantity;
        setInventoryRoomCount(rooms.toString());
        setCostPerNight(item.costPrice.toString());
        setSellingPricePerNight(item.sellingPrice.toString());
    } else {
        setInventoryRoomCount('');
        setCostPerNight('');
        setSellingPricePerNight('');
    }

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
                      roomCount: s.roomCount,
                      type: s.type,
                      roomType: s.roomType,
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
      
      // Calculate Total Cost Value
      // For Hotel: Rooms (totalQuantity) * Nights * CostPerNight
      let totalCostValue = reportItem.totalQuantity * reportItem.costPrice;
      
      if (reportItem.type === 'Hotel' && reportItem.checkIn && reportItem.checkOut) {
          const nights = calculateNights(reportItem.checkIn, reportItem.checkOut);
          totalCostValue = reportItem.totalQuantity * nights * reportItem.costPrice;
      }

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
            <title>Inventory Report - ${reportItem.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
            <style>
                @page { size: A4; margin: 0; }
                body { 
                    font-family: 'Cairo', sans-serif; 
                    background: white; 
                    margin: 0;
                    padding: 0;
                    color: #1e293b; 
                    -webkit-print-color-adjust: exact;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                }
                .print-container { 
                    flex: 1;
                    padding: 15mm; 
                    max-width: 210mm;
                    margin: 0 auto;
                    box-sizing: border-box;
                }
                
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0891b2; padding-bottom: 10px; margin-bottom: 20px; }
                .logo { font-size: 22px; font-weight: 800; color: #0891b2; }
                
                .title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #0f172a; }
                
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; text-align: center; }
                .stat-label { font-size: 10px; color: #64748b; font-weight: bold; }
                .stat-value { font-size: 14px; font-weight: bold; margin-top: 5px; }

                table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 20px; }
                thead { background: #0f172a; color: white; }
                th { padding: 8px; text-align: right; }
                td { border-bottom: 1px solid #e2e8f0; padding: 8px; vertical-align: top; }
                tr:nth-child(even) { background-color: #f8fafc; }
                
                .footer { margin-top: auto; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="header">
                    <div>
                        ${logoHtml}
                        <div style="font-size:12px; margin-top:5px; font-weight:bold;">${companySettings.nameAr}</div>
                    </div>
                    <div style="text-align: left; font-size: 11px; color: #64748b;">
                        <strong>${companySettings.nameEn}</strong><br>
                        ${companySettings.phone}
                    </div>
                </div>

                <div class="title">Inventory Item Report: ${reportItem.name}</div>

                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-label">Total Stock (${reportItem.type === 'Hotel' ? 'Rooms' : 'Units'})</div>
                        <div class="stat-value">${reportItem.totalQuantity}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Total Value</div>
                        <div class="stat-value" style="color: #6366f1;">${totalCostValue.toLocaleString('en-US')} ${reportItem.currency}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Sold / Booked</div>
                        <div class="stat-value" style="color: #10b981;">${stats.sold}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Remaining</div>
                        <div class="stat-value" style="color: #f43f5e;">${stats.remaining}</div>
                    </div>
                </div>

                <h3 style="font-size: 14px; margin-bottom: 5px;">Usage History</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Ref No</th>
                            <th>Client</th>
                            <th>Qty / Rooms</th>
                            ${reportItem.type === 'Hotel' ? '<th>Room Type</th>' : ''}
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(h => `
                            <tr>
                                <td style="color: #64748b;">${new Date(h.date).toLocaleDateString('en-GB')}</td>
                                <td style="font-family: monospace;">${h.fileNo}</td>
                                <td><strong>${h.client}</strong></td>
                                <td>${h.type === 'Hotel' ? `${h.roomCount || 1} Rooms` : h.qty}</td>
                                ${reportItem.type === 'Hotel' ? `<td>${h.roomType || '-'}</td>` : ''}
                                <td>${h.serviceDetails}</td>
                            </tr>
                        `).join('')}
                        ${history.length === 0 ? '<tr><td colspan="6" style="text-align: center; padding: 20px;">No sales history found.</td></tr>' : ''}
                    </tbody>
                </table>

                <div class="footer">
                    Printed on: ${new Date().toLocaleString('en-GB')}
                </div>
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
              const nights = (item.type === 'Hotel' && item.checkIn && item.checkOut) 
                  ? calculateNights(item.checkIn, item.checkOut) 
                  : 0;
              
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
                              <div className="text-sm text-slate-500 dark:text-slate-400 flex flex-wrap gap-2 mt-1">
                                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">{item.type}</span>
                                  {item.supplier && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">{item.supplier}</span>}
                                  {item.type === 'Hotel' && nights > 0 && (
                                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                                          <Moon size={10} /> {nights} Nights
                                      </span>
                                  )}
                              </div>
                          </div>
                      </div>

                      <div className="mb-4">
                          <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-500 dark:text-slate-400">
                                  {item.type === 'Hotel' ? 'Rooms Booked' : 'Sold'}: {stats.sold}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                  Remaining: {stats.remaining} {item.type === 'Hotel' ? 'Rooms' : ''}
                              </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                              <div className={`h-2 rounded-full ${getProgressColor(percentageSold)}`} style={{ width: `${percentageSold}%` }}></div>
                          </div>
                      </div>

                      {item.type === 'Hotel' && (
                          <div className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-2 rounded text-xs flex justify-between items-center text-slate-500 border border-slate-100 dark:border-slate-700">
                              <span>Total Rooms: <strong>{item.totalQuantity}</strong></span>
                              <span>Total Capacity: <strong>{item.totalQuantity * nights}</strong> Nights</span>
                          </div>
                      )}

                      <div className="flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-4">
                          <div>
                              <p className="text-xs text-slate-400">سعر البيع {item.type === 'Hotel' ? '(Per Night)' : ''}</p>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{item.sellingPrice} <span className="text-[10px]">{item.currency}</span></p>
                          </div>
                          {item.expiryDate && (
                              <div className="text-right">
                                  <p className="text-xs text-slate-400">ينتهي في</p>
                                  <p className="font-bold text-slate-600 dark:text-slate-300 text-xs font-mono">{new Date(item.expiryDate).toLocaleDateString('en-GB')}</p>
                              </div>
                          )}
                      </div>
                  </div>
              );
          })}
          {filteredInventory.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p>لا يوجد عناصر في المخزون</p>
              </div>
          )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl my-8 relative">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]">
                    <h3 className="text-slate-800 dark:text-white font-bold">{editingId ? 'تعديل الصنف' : 'إضافة إلى المخزون'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">اسم الصنف / الخدمة *</label>
                            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" placeholder="تذاكر حفل... / مقاعد طيران..." />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">النوع</label>
                            <select value={type} onChange={(e) => setType(e.target.value as ServiceType)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none">
                                <option value="Flight">طيران (Flight)</option>
                                <option value="Hotel">فندق (Hotel)</option>
                                <option value="Visa">تأشيرة (Visa)</option>
                                <option value="Transport">نقل (Transport)</option>
                                <option value="Tour">رحلة (Tour)</option>
                                <option value="Other">أخرى</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">المورد</label>
                            <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" list="agentsList" />
                            <datalist id="agentsList">{agents.map(a => <option key={a.id} value={a.name} />)}</datalist>
                        </div>
                    </div>

                    {/* Dynamic Fields based on Type */}
                    {type === 'Flight' && (
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] text-slate-500 mb-1">شركة الطيران</label><input type="text" value={airline} onChange={e => setAirline(e.target.value)} className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs" /></div>
                            <div><label className="block text-[10px] text-slate-500 mb-1">خط السير</label><input type="text" value={route} onChange={e => setRoute(e.target.value)} className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs" placeholder="AMM-DXB-AMM" /></div>
                            <div><label className="block text-[10px] text-slate-500 mb-1">تاريخ الذهاب</label><input type="date" value={flightDate} onChange={e => setFlightDate(e.target.value)} className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs" /></div>
                            <div><label className="block text-[10px] text-slate-500 mb-1">تاريخ العودة</label><input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs" /></div>
                            <div><label className="block text-[10px] text-slate-500 mb-1">وقت الإقلاع</label><input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs" /></div>
                            <div><label className="block text-[10px] text-slate-500 mb-1">وقت الوصول</label><input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs" /></div>
                        </div>
                    )}

                    {type === 'Hotel' && (
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg grid grid-cols-2 gap-4">
                            <div className="col-span-2"><label className="block text-[10px] text-slate-500 mb-1">نوع الغرفة</label><input type="text" value={roomType} onChange={e => setRoomType(e.target.value)} className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs" placeholder="Double Sea View" /></div>
                            <div><label className="block text-[10px] text-slate-500 mb-1">تاريخ الدخول</label><input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs" /></div>
                            <div><label className="block text-[10px] text-slate-500 mb-1">تاريخ الخروج</label><input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs" /></div>
                            
                            {/* Auto Calculator for Hotels */}
                            <div className="col-span-2 border-t border-slate-200 dark:border-slate-700 pt-3 mt-2">
                                <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Calculator size={12}/> إدارة الغرف والليالي</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-slate-500 mb-1 font-bold">Number of Rooms</label>
                                        <input type="number" min="1" value={inventoryRoomCount} onChange={e => setInventoryRoomCount(e.target.value)} className="w-full p-1.5 rounded border border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/10 text-xs font-bold focus:border-cyan-500" placeholder="مثال: 5" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Cost (Per Night)</label>
                                        <input type="number" min="0" step="0.01" value={costPerNight} onChange={e => setCostPerNight(e.target.value)} className="w-full p-1.5 rounded border border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/10 text-xs font-bold focus:border-cyan-500" />
                                    </div>
                                     <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Sell (Per Night)</label>
                                        <input type="number" min="0" step="0.01" value={sellingPricePerNight} onChange={e => setSellingPricePerNight(e.target.value)} className="w-full p-1.5 rounded border border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/10 text-xs font-bold focus:border-cyan-500" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-blue-500 mt-2 bg-blue-50 dark:bg-blue-900/10 p-2 rounded">
                                    <span>Nights per Room: <strong>{calculateNights()}</strong></span>
                                    <span>Total Capacity (Nights): <strong>{(parseInt(inventoryRoomCount) || 0) * calculateNights()}</strong></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quantity & Price */}
                    <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-[#020617] p-3 rounded border border-slate-200 dark:border-slate-700">
                        {type !== 'Hotel' && (
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الكمية الكلية (Units)</label>
                                <input type="number" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} className="w-full bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-600 rounded p-2 text-center font-bold dark:text-white" />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">سعر التكلفة {type === 'Hotel' ? '(Per Night)' : '(Per Unit)'}</label>
                            <input type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className={`w-full bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-600 rounded p-2 text-center font-bold dark:text-white ${type === 'Hotel' ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`} readOnly={type === 'Hotel'} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">سعر البيع {type === 'Hotel' ? '(Per Night)' : '(Per Unit)'}</label>
                            <input type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className={`w-full bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-600 rounded p-2 text-center font-bold dark:text-white ${type === 'Hotel' ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`} readOnly={type === 'Hotel'} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">العملة</label>
                            <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none">
                                <option value="JOD">JOD</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="ILS">ILS</option>
                                <option value="SAR">SAR</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تاريخ الانتهاء (اختياري)</label>
                            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">ملاحظات / وصف إضافي</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none h-20 resize-none"></textarea>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg transition-colors">إلغاء</button>
                        <button type="submit" className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors">{editingId ? 'حفظ التعديلات' : 'إضافة للمخزون'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900/50">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-slate-800 dark:text-white text-lg font-bold mb-2">تأكيد الحذف</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">هل أنت متأكد من حذف هذا الصنف من المخزون؟</p>
                <div className="flex gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg transition-colors">إلغاء</button>
                    <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors">نعم، حذف</button>
                </div>
            </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && reportItem && (
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-[#1e293b] w-full max-w-4xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                  <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                          <FileText className="text-cyan-600" size={20} />
                          تقرير حركة الصنف: {reportItem.name}
                      </h3>
                      <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20} /></button>
                  </div>
                  
                  <div className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-slate-50 dark:bg-[#0f172a] p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                              <p className="text-xs text-slate-500 mb-1">{reportItem.type === 'Hotel' ? 'عدد الغرف الكلي' : 'الكمية الكلية'}</p>
                              <p className="font-bold text-slate-800 dark:text-white">{reportItem.totalQuantity}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-[#0f172a] p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                              <p className="text-xs text-slate-500 mb-1">قيمة التكلفة الكلية</p>
                              {/* Calculate accurate cost value including nights for hotels */}
                              <p className="font-bold text-slate-800 dark:text-white dir-ltr">
                                {reportItem.type === 'Hotel' && reportItem.checkIn && reportItem.checkOut 
                                    ? (reportItem.totalQuantity * calculateNights(reportItem.checkIn, reportItem.checkOut) * reportItem.costPrice).toLocaleString()
                                    : (reportItem.totalQuantity * reportItem.costPrice).toLocaleString()
                                } {reportItem.currency}
                              </p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">المباع / المحجوز</p>
                              <p className="font-bold text-emerald-700 dark:text-emerald-300">{getInventoryStats(reportItem.id).sold}</p>
                          </div>
                          <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg border border-rose-200 dark:border-rose-800 text-center">
                              <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">المتبقي</p>
                              <p className="font-bold text-rose-700 dark:text-rose-300">{getInventoryStats(reportItem.id).remaining}</p>
                          </div>
                      </div>

                      <div className="overflow-x-auto">
                          <table className="w-full text-right text-sm">
                              <thead className="bg-slate-100 dark:bg-[#0f172a] text-slate-600 dark:text-slate-400">
                                  <tr>
                                      <th className="px-4 py-2">التاريخ</th>
                                      <th className="px-4 py-2">رقم الملف</th>
                                      <th className="px-4 py-2">العميل</th>
                                      <th className="px-4 py-2">الكمية / غرف</th>
                                      {reportItem.type === 'Hotel' && <th className="px-4 py-2">نوع الغرفة</th>}
                                      <th className="px-4 py-2">تفاصيل</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                  {getUsageHistory(reportItem.id).length > 0 ? getUsageHistory(reportItem.id).map((h, i) => (
                                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                          <td className="px-4 py-2 font-mono text-xs">{new Date(h.date).toLocaleDateString('en-GB')}</td>
                                          <td className="px-4 py-2 font-mono text-xs">{h.fileNo}</td>
                                          <td className="px-4 py-2 font-bold">{h.client}</td>
                                          <td className="px-4 py-2">{h.type === 'Hotel' ? `${h.roomCount || 1} غرف (${h.qty} ليالي)` : h.qty}</td>
                                          {reportItem.type === 'Hotel' && <td className="px-4 py-2">{h.roomType || '-'}</td>}
                                          <td className="px-4 py-2 text-xs text-slate-500">{h.serviceDetails}</td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={6} className="text-center py-4 text-slate-500">لا يوجد سجل حركات بيع لهذا الصنف</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 flex justify-end">
                      <button onClick={handlePrintReport} className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
                          <Printer size={16} /> طباعة التقرير
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default InventoryPage;
