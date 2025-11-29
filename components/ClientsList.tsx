
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Client, Currency } from '../types';
import { Plus, Search, Edit, Trash2, Printer, User, Phone, Mail, Receipt, AlertTriangle, Coins, X, Landmark } from 'lucide-react';

const ClientsList: React.FC = () => {
  // CHANGED: Imported allBookings and allTransactions
  const { clients, allBookings, allTransactions, treasury, addClient, updateClient, deleteClient, addClientPayment, systemCurrency, convertAmount, showNotification, companySettings } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<Client['type']>('Individual');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState<string>(''); // Changed to string
  const [limit, setLimit] = useState<string>(''); // Changed to string
  const [email, setEmail] = useState('');
  
  // Payment State
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [payAmount, setPayAmount] = useState<string>(''); // Changed to string
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>('JOD');
  const [exchangeRate, setExchangeRate] = useState<string>('1'); // Changed to string
  const [selectedTreasuryId, setSelectedTreasuryId] = useState<string>('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm))
  );

  const displayMoney = (amountInJOD: number) => {
    return convertAmount(amountInJOD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Effect to set default exchange rates for payment
  useEffect(() => {
    if (paymentCurrency === 'JOD') setExchangeRate('1');
    else if (paymentCurrency === 'USD') setExchangeRate('0.71');
    else if (paymentCurrency === 'EUR') setExchangeRate('0.75');
    else if (paymentCurrency === 'ILS') setExchangeRate('0.20');
    else if (paymentCurrency === 'SAR') setExchangeRate('0.19');
  }, [paymentCurrency]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setType('Individual');
    setPhone('');
    setEmail('');
    setBalance('');
    setLimit('');
    setIsModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setName(client.name);
    setType(client.type);
    setPhone(client.phone || '');
    setEmail(client.email || '');
    setBalance(client.balance.toString()); // Convert to string
    setLimit(client.limit ? client.limit.toString() : ''); // Convert to string
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBalance = balance === '' ? 0 : Number(balance);
    const finalLimit = limit === '' ? 0 : Number(limit);

    if (editingId) {
      updateClient(editingId, { name, type, phone, email, balance: finalBalance, limit: finalLimit });
      showNotification('تم تعديل بيانات العميل بنجاح', 'success');
    } else {
      addClient({ name, type, phone, email, balance: finalBalance, limit: finalLimit });
      showNotification('تم إضافة العميل الجديد بنجاح', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setClientToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (clientToDeleteId) {
      deleteClient(clientToDeleteId);
      showNotification('تم حذف العميل بنجاح', 'success');
      setIsDeleteModalOpen(false);
      setClientToDeleteId(null);
    }
  };

  const handleOpenPayment = (client: Client) => {
    setSelectedClient(client);
    setPayAmount('');
    setPaymentCurrency('JOD');
    setExchangeRate('1');
    setSelectedTreasuryId(treasury.length > 0 ? treasury[0].id : '');
    setIsPaymentModalOpen(true);
  };

  const  handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = Number(payAmount);
    const rateValue = parseFloat(exchangeRate);

    if (selectedClient && amountValue > 0 && selectedTreasuryId && !isNaN(rateValue)) {
        // Convert entered amount to JOD using specific exchange rate
        const amountInJOD = amountValue * rateValue;
        
        addClientPayment(selectedClient.id, amountInJOD, selectedTreasuryId);
        showNotification('تم تسجيل سند القبض بنجاح', 'success');
        setIsPaymentModalOpen(false);
    }
  };

  const handlePrintReport = (client: Client) => {
     const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // 1. Extract Client Bookings (Debits / Invoices) using ALL BOOKINGS
    // CHANGED: Used allBookings instead of bookings
    const clientBookings = allBookings.filter(b => b.clientName === client.name)
        .map(b => ({
            date: b.date,
            ref: `INV-${b.fileNo || b.id}`,
            desc: `حجز ${b.type} - ${b.destination}`,
            debit: b.amount,
            credit: 0
        }));

    // 2. Extract Client Receipts (Credits / Payments) using ALL TRANSACTIONS
    // CHANGED: Used allTransactions instead of transactions
    const clientReceipts = allTransactions.filter(t => 
        t.category === 'مقبوضات عملاء' && t.description.includes(client.name)
    ).map(t => ({
        date: t.date,
        ref: `REC-${t.referenceNo || t.id}`,
        desc: t.description,
        debit: 0,
        credit: t.amount
    }));

    // Merge and Sort
    const allReportTransactions = [...clientBookings, ...clientReceipts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalDebit = clientBookings.reduce((sum, i) => sum + i.debit, 0);
    const totalCredit = clientReceipts.reduce((sum, i) => sum + i.credit, 0);
    const currentBalance = client.balance;

    // Determine if logo should be shown based on settings
    const showLogo = companySettings.logoUrl && (companySettings.logoVisibility === 'both' || companySettings.logoVisibility === 'print');

    const logoHtml = showLogo 
        ? `<img src="${companySettings.logoUrl}" style="max-height: 100px; max-width: 250px; object-fit: contain; border: 1px solid #cbd5e1; padding: 4px; border-radius: 4px;" />`
        : `<div class="logo">${companySettings.logoText}</div>`;

    const reportHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <title>كشف حساب عميل - ${client.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap" rel="stylesheet">
        <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Cairo', sans-serif; background: white; color: #1e293b; padding: 10px; direction: rtl; zoom: 0.9; }
            .container { width: 100%; max-width: 200mm; margin: 0 auto; }

            .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px; border-bottom: 2px solid #06b6d4; padding-bottom: 10px; }
            .logo { color: #06b6d4; font-size: 22px; font-weight: 800; letter-spacing: -1px; }
            .sub-logo { color: #64748b; font-size: 10px; font-weight: 600; }
            .meta { text-align: left; font-size: 10px; color: #64748b; }
            
            .title { text-align: center; font-size: 18px; font-weight: 800; color: #0f172a; margin: 15px 0; }
            
            .info-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 15px; display: flex; justify-content: space-between; background: #f8fafc; }
            .info-item { flex: 1; text-align: center; }
            .label { color: #64748b; font-size: 10px; margin-bottom: 2px; font-weight: 600; }
            .value { color: #0f172a; font-weight: 700; font-size: 12px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
            th { text-align: right; padding: 5px; color: #64748b; font-size: 9px; font-weight: 600; border-bottom: 2px solid #e2e8f0; background: #f8fafc; }
            td { padding: 5px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            
            .total-box { margin-top: 20px; border-top: 1px dashed #94a3b8; padding-top: 10px; font-size: 11px; }
            .total-row { display: flex; justify-content: flex-start; gap: 20px; margin-bottom: 5px; align-items: center; }
            .total-label { color: #64748b; font-weight: 600; width: 150px; }
            .total-value { font-weight: 800; color: #0f172a; }
            .final-balance { font-size: 14px; color: #06b6d4; margin-top: 5px; }

            .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
            <div class="header">
                <div style="text-align: right;">
                    ${logoHtml}
                    <div style="font-size: 12px; font-weight: bold; margin-top: 5px;">${companySettings.nameAr}</div>
                    <div style="font-size: 10px; color: #64748b;">${companySettings.address} | ${companySettings.phone}</div>
                </div>
                <div class="meta">
                    <div>التاريخ: ${new Date().toLocaleDateString('ar-EG-u-nu-latn')}</div>
                    <div>العملة: JOD</div>
                </div>
            </div>

            <div class="title">كشف حساب عميل</div>

            <div class="info-box">
                <div class="info-item"><div class="label">العميل</div><div class="value">${client.name}</div></div>
                <div class="info-item"><div class="label">النوع</div><div class="value">${client.type === 'Company' ? 'شركة' : 'فرد'}</div></div>
                <div class="info-item"><div class="label">الهاتف</div><div class="value" style="direction: ltr;">${client.phone || '-'}</div></div>
            </div>

            <table>
                <thead><tr><th>التاريخ</th><th>البيان</th><th>المستند</th><th>مدين</th><th>دائن</th></tr></thead>
                <tbody>
                    ${allReportTransactions.length > 0 ? allReportTransactions.map(t => `
                    <tr>
                        <td style="color: #64748b;">${t.date}</td>
                        <td>${t.desc}</td>
                        <td style="font-family: monospace;">${t.ref}</td>
                        <td style="font-weight: 600;">${t.debit > 0 ? t.debit.toLocaleString('en-US') : '-'}</td>
                        <td style="font-weight: 600; color: #10b981;">${t.credit > 0 ? t.credit.toLocaleString('en-US') : '-'}</td>
                    </tr>`).join('') : '<tr><td colspan="5" style="text-align:center; padding: 10px;">لا توجد حركات</td></tr>'}
                </tbody>
            </table>

            <div class="total-box">
                <div class="total-row"><div class="total-label">إجمالي المدين (عليه):</div><div class="total-value">${totalDebit.toLocaleString('en-US')} JOD</div></div>
                <div class="total-row"><div class="total-label">إجمالي الدائن (له):</div><div class="total-value">${totalCredit.toLocaleString('en-US')} JOD</div></div>
                <div class="total-row final-balance"><div class="total-label">الرصيد النهائي:</div><div class="total-value">${currentBalance.toLocaleString('en-US')} JOD</div></div>
            </div>
            
            <div class="footer">${companySettings.nameAr} - تقرير آلي</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(reportHTML);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إدارة العملاء</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">إدارة حسابات العملاء والديون وسندات القبض</p>
        </div>
        <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20"
        >
          <Plus size={18} />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* Search & Table */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
         <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                <input 
                type="text" 
                placeholder="بحث باسم العميل أو رقم الهاتف..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-100 dark:bg-[#0f172a] text-cyan-600 dark:text-cyan-400 text-xs uppercase">
                    <tr>
                        <th className="px-6 py-4">اسم العميل</th>
                        <th className="px-6 py-4">النوع</th>
                        <th className="px-6 py-4">بيانات الاتصال</th>
                        <th className="px-6 py-4">الرصيد الحالي ({systemCurrency})</th>
                        <th className="px-6 py-4 text-center">إجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group text-sm">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-cyan-600 dark:text-cyan-500">
                                        <User size={16} />
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-white">{client.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 ${client.type === 'Company' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-300'}`}>
                                    {client.type === 'Company' ? 'شركة' : 'فرد'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                <div className="flex flex-col text-xs gap-1">
                                    <div className="flex items-center gap-1"><Phone size={12} /> {client.phone || '-'}</div>
                                    {client.email && <div className="flex items-center gap-1"><Mail size={12} /> {client.email}</div>}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`font-mono font-bold text-base ${client.balance > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                    {displayMoney(client.balance)}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                     <button onClick={() => handleOpenPayment(client)} title="سند قبض" className="p-1.5 bg-emerald-100 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-600 hover:text-white transition-colors">
                                        <Receipt size={16} />
                                    </button>
                                    <button onClick={() => handlePrintReport(client)} title="كشف حساب" className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors">
                                        <Printer size={16} />
                                    </button>
                                    <button onClick={() => handleEdit(client)} title="تعديل" className="p-1.5 bg-slate-200 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 rounded hover:bg-cyan-600 hover:text-white transition-colors">
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handleDelete(client.id)}
                                      title="حذف" 
                                      className="p-1.5 text-red-500 hover:bg-red-600 hover:text-white rounded transition-colors"
                                    >
                                        <Trash2 size={16} className="pointer-events-none" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredClients.length === 0 && (
                <div className="p-8 text-center text-slate-500">لا يوجد عملاء مسجلين بهذا الاسم</div>
            )}
         </div>
      </div>

      {/* Create/Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-800 dark:text-white font-bold">{editingId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">اسم العميل *</label>
                        <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">نوع العميل</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="type" checked={type === 'Individual'} onChange={() => setType('Individual')} className="accent-cyan-500"/>
                                <span className="text-slate-800 dark:text-white text-sm">فرد</span>
                            </label>
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="type" checked={type === 'Company'} onChange={() => setType('Company')} className="accent-cyan-500"/>
                                <span className="text-slate-800 dark:text-white text-sm">شركة</span>
                            </label>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">رقم الهاتف</label>
                             <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                         <div>
                             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الرصيد الافتتاحي (مدين)</label>
                             <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg transition-colors">إلغاء</button>
                        <button type="submit" className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors">{editingId ? 'حفظ التعديلات' : 'إضافة العميل'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Add Payment (Receipt Voucher) Modal */}
      {isPaymentModalOpen && selectedClient && (
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                     <Receipt className="text-emerald-500 dark:text-emerald-400" size={20} />
                     سند قبض من عميل
                    </h3>
                    <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 text-center mb-4">
                         <p className="text-xs text-slate-500 dark:text-slate-400">العميل</p>
                         <p className="text-slate-800 dark:text-white font-bold">{selectedClient.name}</p>
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">الرصيد الحالي (عليه)</p>
                         <p className="text-rose-500 dark:text-rose-400 font-bold text-lg">{displayMoney(selectedClient.balance)} {systemCurrency}</p>
                    </div>
                    
                    <div>
                        <label className="block text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">المبلغ المقبوض (Original Amount)</label>
                        <div className="flex gap-2">
                            <input 
                                autoFocus
                                type="number" 
                                min="0.01" 
                                step="0.01"
                                value={payAmount} 
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setPayAmount(e.target.value)} 
                                className="flex-1 bg-slate-50 dark:bg-[#0f172a] border border-emerald-600/50 dark:border-emerald-700 rounded-lg p-3 text-slate-900 dark:text-white text-lg font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                            />
                            <select 
                                value={paymentCurrency}
                                onChange={(e) => setPaymentCurrency(e.target.value as Currency)}
                                className="w-24 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white text-sm focus:border-cyan-500 focus:outline-none font-bold"
                            >
                                <option value="JOD">JOD</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="ILS">ILS</option>
                                <option value="SAR">SAR</option>
                            </select>
                        </div>
                    </div>

                    {/* Exchange Rate & Conversion */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-[#0f172a] p-3 rounded border border-dashed border-slate-300 dark:border-slate-700">
                        <div>
                             <label className="block text-[10px] text-slate-500 dark:text-slate-500 mb-1 flex items-center gap-1"><Coins size={10}/> سعر الصرف</label>
                             <input 
                                type="number" 
                                step="any"
                                value={exchangeRate}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setExchangeRate(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-slate-800 dark:text-white text-sm focus:border-cyan-500 focus:outline-none"
                            />
                        </div>
                         <div>
                             <label className="block text-[10px] text-emerald-600 dark:text-emerald-500 mb-1 font-bold">المبلغ بالدينار (JOD)</label>
                             <div className="w-full bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                {(Number(payAmount) * (parseFloat(exchangeRate) || 0)).toFixed(2)}
                             </div>
                        </div>
                    </div>

                     {/* Treasury Selection */}
                     <div>
                         <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Landmark size={12}/> طريقة الدفع / الصندوق</label>
                         <select value={selectedTreasuryId} onChange={(e) => setSelectedTreasuryId(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white text-sm focus:border-cyan-500 focus:outline-none">
                             {treasury.map(t => (
                                 <option key={t.id} value={t.id}>{t.name} - الرصيد: {t.balance.toFixed(2)}</option>
                             ))}
                         </select>
                     </div>

                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg transition-colors">إلغاء</button>
                        <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors">تأكيد القبض</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900/50">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-slate-800 dark:text-white text-lg font-bold mb-2">تأكيد الحذف</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">هل أنت متأكد من رغبتك في حذف هذا العميل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
                <div className="flex gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-white rounded-lg transition-colors">إلغاء</button>
                    <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors">نعم، حذف</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default ClientsList;
