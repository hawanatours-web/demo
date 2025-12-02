
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Client, Currency, BookingStatus, TransactionType } from '../types';
import { Plus, Search, Edit, Trash2, Printer, User, Phone, Mail, Receipt, AlertTriangle, Coins, X, Landmark, Calendar, Users, TrendingDown } from 'lucide-react';

const ClientsList: React.FC = () => {
  const { clients, allBookings, allTransactions, treasury, addClient, updateClient, deleteClient, addClientPayment, systemCurrency, convertAmount, showNotification, companySettings, exchangeRates } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<Client['type']>('Individual');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState<string>(''); 
  const [clientCurrency, setClientCurrency] = useState<Currency>('JOD'); // New: Currency for opening balance
  const [limit, setLimit] = useState<string>('');
  const [email, setEmail] = useState('');
  
  // Payment State
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [payAmount, setPayAmount] = useState<string>(''); 
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>('JOD');
  const [exchangeRate, setExchangeRate] = useState<string>('1'); 
  const [paymentDate, setPaymentDate] = useState<string>(''); // New: Payment Date
  const [selectedTreasuryId, setSelectedTreasuryId] = useState<string>('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm))
  );

  // Dynamic Calculation of Client Balance
  // Balance = Opening Balance (DB) + Total Sales (Bookings) - Total Payments (Transactions)
  const getClientMetrics = (client: Client) => {
      // 1. Total Sales (Debits) from Bookings
      const totalSales = allBookings
          .filter(b => b.clientName === client.name && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.VOIDED)
          .reduce((sum, b) => sum + b.amount, 0);

      // 2. Total Payments (Credits) from Transactions
      const totalPayments = allTransactions
          .filter(t => 
              t.type === TransactionType.INCOME && 
              (t.category === 'مقبوضات عملاء' || t.category === 'مقبوضات حجوزات') && 
              t.description.includes(client.name)
          )
          .reduce((sum, t) => sum + t.amount, 0);

      // 3. Effective Balance
      return client.balance + totalSales - totalPayments;
  };

  // Calculate Total Debt (Sum of all positive balances)
  const totalClientsDebt = useMemo(() => {
      return clients.reduce((total, client) => {
          const balance = getClientMetrics(client);
          // Only add debt (positive balance), ignore credits (negative balance)
          return total + (balance > 0 ? balance : 0);
      }, 0);
  }, [clients, allBookings, allTransactions]);

  const displayMoney = (amountInJOD: number) => {
    return convertAmount(amountInJOD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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
    setClientCurrency('JOD');
    setLimit('');
    setIsModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setName(client.name);
    setType(client.type);
    setPhone(client.phone || '');
    setEmail(client.email || '');
    setBalance(client.balance.toString()); 
    setClientCurrency('JOD'); // In edit mode, usually show base balance or keep as is. Simple assumption: JOD.
    setLimit(client.limit ? client.limit.toString() : ''); 
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalBalance = balance === '' ? 0 : Number(balance);
    const finalLimit = limit === '' ? 0 : Number(limit);

    // Convert balance to JOD if creating new client with non-JOD opening balance
    if (!editingId && clientCurrency !== 'JOD') {
        const rate = exchangeRates[clientCurrency] || 1;
        finalBalance = finalBalance / rate;
    }

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
    setPaymentDate(new Date().toISOString().split('T')[0]); // Default to today
    setSelectedTreasuryId(treasury.length > 0 ? treasury[0].id : '');
    setIsPaymentModalOpen(true);
  };

  const  handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = Number(payAmount);
    const rateValue = parseFloat(exchangeRate);

    if (selectedClient && amountValue > 0 && selectedTreasuryId && !isNaN(rateValue)) {
        const amountInJOD = amountValue * rateValue;
        
        addClientPayment(selectedClient.id, amountInJOD, selectedTreasuryId, paymentDate);
        showNotification('تم تسجيل سند القبض بنجاح', 'success');
        setIsPaymentModalOpen(false);
    }
  };

  const handlePrintReport = (client: Client) => {
     const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // 1. Extract Client Bookings (Debits / Invoices)
    const clientBookings = allBookings
        .filter(b => b.clientName === client.name && b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.VOIDED)
        .map(b => ({
            date: b.date,
            ref: `INV-${b.fileNo || b.id}`,
            desc: `حجز ${b.type} - ${b.destination}`,
            debit: b.amount,
            credit: 0
        }));

    // 2. Extract Client Receipts (Credits / Payments)
    const clientReceipts = allTransactions.filter(t => 
        t.type === TransactionType.INCOME &&
        (t.category === 'مقبوضات عملاء' || t.category === 'مقبوضات حجوزات') && 
        t.description.includes(client.name)
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
    
    // Effective Balance = Opening + Debit - Credit
    const currentBalance = client.balance + totalDebit - totalCredit;

    // Opening Balance Split for Display
    const openingDebit = client.balance > 0 ? client.balance : 0;
    const openingCredit = client.balance < 0 ? Math.abs(client.balance) : 0;

    const showLogo = companySettings.logoUrl && (companySettings.logoVisibility === 'both' || companySettings.logoVisibility === 'print');
    const logoHtml = showLogo 
        ? `<img src="${companySettings.logoUrl}" style="max-height: 80px; max-width: 200px; object-fit: contain;" />`
        : `<div class="logo">${companySettings.logoText}</div>`;

    const reportHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <title>Account Statement - ${client.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            @page { size: A4; margin: 0; }
            body { 
                font-family: 'Cairo', sans-serif; 
                background: white; 
                color: #1e293b; 
                margin: 0;
                padding: 0; 
                -webkit-print-color-adjust: exact;
                width: 100%;
                height: 100%;
            }
            .print-container {
                width: 210mm;
                min-height: 297mm;
                padding: 15mm;
                margin: 0 auto;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
            }
            .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px; border-bottom: 2px solid #0891b2; padding-bottom: 10px; }
            .logo { font-size: 22px; font-weight: 800; color: #0891b2; }
            .company-info { font-size: 11px; color: #64748b; margin-top: 5px; }
            
            .report-title { text-align: center; margin-bottom: 20px; }
            .report-title h2 { margin: 0; font-size: 20px; color: #0f172a; text-transform: uppercase; }
            .report-title p { margin: 0; font-size: 12px; color: #64748b; }

            .client-info { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; border: 1px solid #e2e8f0; }
            .info-col h4 { margin: 0 0 5px; font-size: 11px; color: #64748b; text-transform: uppercase; }
            .info-col p { margin: 0; font-weight: 700; color: #0f172a; font-size: 14px; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
            thead { background: #0f172a; color: white; }
            th { padding: 10px; text-align: right; font-weight: 600; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background-color: #f8fafc; }
            
            .summary-box { 
                margin-top: 20px; 
                border-top: 2px solid #0f172a; 
                padding-top: 10px; 
                display: flex; 
                justify-content: flex-end;
            }
            .totals-grid {
                display: grid;
                grid-template-columns: auto 120px;
                gap: 10px;
                text-align: right;
                font-size: 12px;
            }
            .total-label { font-weight: 600; color: #64748b; }
            .total-value { font-weight: 700; direction: ltr; }
            .final-balance { font-size: 16px; color: #0f172a; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #cbd5e1; }

            .footer { margin-top: auto; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="print-container">
            <div class="header">
                <div style="text-align: right;">
                    ${logoHtml}
                    <div style="font-weight:bold; margin-top:5px;">${companySettings.nameAr}</div>
                </div>
                <div class="company-info" style="text-align: left;">
                    <strong>${companySettings.nameEn}</strong><br>
                    ${companySettings.address}<br>
                    ${companySettings.phone}
                </div>
            </div>

            <div class="report-title">
                <h2>Account Statement</h2>
                <p>كشف حساب عميل</p>
            </div>

            <div class="client-info">
                <div class="info-col">
                    <h4>Client Name</h4>
                    <p>${client.name}</p>
                </div>
                <div class="info-col">
                    <h4>Phone</h4>
                    <p style="direction: ltr;">${client.phone || '-'}</p>
                </div>
                <div class="info-col">
                    <h4>Date</h4>
                    <p>${new Date().toLocaleDateString('en-GB')}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 15%;">Date</th>
                        <th style="width: 40%;">Description</th>
                        <th style="width: 15%;">Ref</th>
                        <th style="width: 15%;">Debit (مدين)</th>
                        <th style="width: 15%;">Credit (دائن)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="3" style="font-weight: bold;">Opening Balance / الرصيد الافتتاحي</td>
                        <td style="font-weight: 600;">${openingDebit > 0 ? openingDebit.toLocaleString('en-US') : '-'}</td>
                        <td style="font-weight: 600;">${openingCredit > 0 ? openingCredit.toLocaleString('en-US') : '-'}</td>
                    </tr>
                    ${allReportTransactions.length > 0 ? allReportTransactions.map(t => `
                    <tr>
                        <td style="color: #64748b;">${new Date(t.date).toLocaleDateString('en-GB')}</td>
                        <td>${t.desc}</td>
                        <td style="font-family: monospace;">${t.ref}</td>
                        <td style="color: #f43f5e; font-weight: 600;">${t.debit > 0 ? t.debit.toLocaleString('en-US') : '-'}</td>
                        <td style="color: #10b981; font-weight: 600;">${t.credit > 0 ? t.credit.toLocaleString('en-US') : '-'}</td>
                    </tr>`).join('') : '<tr><td colspan="5" style="text-align:center; padding: 15px;">No transactions found within this period.</td></tr>'}
                </tbody>
            </table>

            <div class="summary-box">
                <div class="totals-grid">
                    <div class="total-label">Total Debit (Sales):</div>
                    <div class="total-value">${totalDebit.toLocaleString('en-US')}</div>
                    
                    <div class="total-label">Total Credit (Paid):</div>
                    <div class="total-value">${totalCredit.toLocaleString('en-US')}</div>
                    
                    <div class="total-label final-balance">Net Balance:</div>
                    <div class="total-value final-balance" style="color: ${currentBalance > 0.01 ? '#f43f5e' : '#10b981'};">
                        ${currentBalance.toLocaleString('en-US')} ${systemCurrency}
                    </div>
                </div>
            </div>

            <div class="footer">
                Genereted by ${companySettings.nameEn} System - ${new Date().toLocaleString()}
            </div>
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

      {/* Summary Card - Total Debt */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>
            <div>
               <p className="text-slate-500 dark:text-slate-400 text-sm mb-1 font-bold">إجمالي الذمم على العملاء</p>
               <h3 className="text-2xl font-bold text-slate-800 dark:text-white dir-ltr">
                   {displayMoney(totalClientsDebt)} <span className="text-sm text-slate-500">{systemCurrency}</span>
               </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-900/50">
               <TrendingDown size={24} />
            </div>
         </div>
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
                    {filteredClients.map((client) => {
                        // Calculate balance dynamically
                        const effectiveBalance = getClientMetrics(client);
                        
                        return (
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
                                <span className={`font-mono font-bold text-base ${effectiveBalance > 0.01 ? 'text-rose-500 dark:text-rose-400' : effectiveBalance < -0.01 ? 'text-blue-500' : 'text-emerald-500 dark:text-emerald-400'}`}>
                                    {displayMoney(effectiveBalance)}
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
                    )})}
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
                             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الرصيد المستحق (سابق)</label>
                             <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                                 <input 
                                    type="number" 
                                    value={balance} 
                                    onChange={(e) => setBalance(e.target.value)} 
                                    placeholder="0.00" 
                                    className="w-full bg-slate-50 dark:bg-[#0f172a] p-2 text-slate-800 dark:text-white focus:outline-none" 
                                 />
                                 {!editingId && (
                                     <select 
                                        value={clientCurrency} 
                                        onChange={(e) => setClientCurrency(e.target.value as Currency)}
                                        className="bg-slate-200 dark:bg-slate-800 text-xs px-2 focus:outline-none border-r border-slate-300 dark:border-slate-600"
                                     >
                                         <option value="JOD">JOD</option>
                                         <option value="USD">USD</option>
                                         <option value="ILS">ILS</option>
                                     </select>
                                 )}
                             </div>
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
                         <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">الرصيد الحالي</p>
                         <p className="text-rose-500 dark:text-rose-400 font-bold text-lg">{displayMoney(getClientMetrics(selectedClient))} {systemCurrency}</p>
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

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {/* Treasury Selection */}
                         <div>
                             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Landmark size={12}/> طريقة الدفع / الصندوق</label>
                             <select value={selectedTreasuryId} onChange={(e) => setSelectedTreasuryId(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white text-sm focus:border-cyan-500 focus:outline-none">
                                 {treasury.map(t => (
                                     <option key={t.id} value={t.id}>{t.name} - الرصيد: {t.balance.toFixed(2)}</option>
                                 ))}
                             </select>
                         </div>
                         
                         {/* Payment Date Selection */}
                         <div>
                             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Calendar size={12}/> تاريخ الدفعة</label>
                             <input 
                                type="date" 
                                value={paymentDate} 
                                onChange={(e) => setPaymentDate(e.target.value)} 
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white text-sm focus:border-cyan-500 focus:outline-none"
                             />
                         </div>
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
