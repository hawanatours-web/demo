
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Agent, Currency, TransactionType } from '../types';
import { Plus, Search, Edit, Trash2, Printer, DollarSign, Building2, Phone, Mail, AlertTriangle, Coins, X, Landmark, FileCheck2 } from 'lucide-react';

const AgentsList: React.FC = () => {
  const { agents, allBookings, allTransactions, treasury, addAgent, updateAgent, deleteAgent, addAgentPayment, systemCurrency, convertAmount, showNotification, companySettings, convertCurrency, exchangeRates } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('General');
  const [customType, setCustomType] = useState(''); 
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState<string>('');
  const [email, setEmail] = useState('');
  const [agentCurrency, setAgentCurrency] = useState<Currency>('JOD');
  
  // Payment State
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>('JOD');
  const [exchangeRate, setExchangeRate] = useState<string>('1'); 
  const [selectedTreasuryId, setSelectedTreasuryId] = useState<string>('');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [agentToDeleteId, setAgentToDeleteId] = useState<string | null>(null);

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMoney = (amount: number, currencyCode: string = systemCurrency) => {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyCode}`;
  };

  useEffect(() => {
    if (paymentCurrency === 'JOD') setExchangeRate('1');
    else if (paymentCurrency === 'USD') setExchangeRate('0.71');
    else if (paymentCurrency === 'EUR') setExchangeRate('0.75');
    else if (paymentCurrency === 'ILS') setExchangeRate('0.20');
    else if (paymentCurrency === 'SAR') setExchangeRate('0.19');
  }, [paymentCurrency]);

  const getAgentMetrics = (agent: Agent, targetCurrency?: Currency) => {
      // 1. Calculate Total Debt from Bookings (Services)
      const totalServicesJOD = allBookings.reduce((total, booking) => {
          const agentServices = booking.services?.filter(s => s.supplier === agent.name) || [];
          const servicesCost = agentServices.reduce((sum, s) => {
              const costInJOD = convertCurrency(Number(s.costPrice) * Number(s.quantity), (s.costCurrency as Currency) || 'JOD', 'JOD');
              return sum + costInJOD;
          }, 0);
          return total + servicesCost;
      }, 0);

      // 2. Calculate Total Payments made to this Agent
      const totalPaymentsJOD = allTransactions.reduce((total, t) => {
          if (t.type === TransactionType.EXPENSE && t.description.includes(agent.name)) {
              return total + t.amount;
          }
          return total;
      }, 0);

      // 3. Effective Balance
      const effectiveBalanceJOD = agent.balance + totalServicesJOD - totalPaymentsJOD;

      if (targetCurrency && targetCurrency !== 'JOD') {
          return {
              totalServices: convertCurrency(totalServicesJOD, 'JOD', targetCurrency),
              effectiveBalance: convertCurrency(effectiveBalanceJOD, 'JOD', targetCurrency)
          };
      }
      return { totalServices: totalServicesJOD, effectiveBalance: effectiveBalanceJOD };
  };

  // --- Handlers ---
  const handleOpenCreate = () => { 
      setEditingId(null); 
      setName(''); 
      setType('General'); 
      setCustomType('');
      setPhone(''); 
      setEmail(''); 
      setBalance(''); 
      setAgentCurrency('JOD'); 
      setIsModalOpen(true); 
  };

  const handleEdit = (agent: Agent) => { 
      setEditingId(agent.id); 
      setName(agent.name); 
      
      const standardTypes = ['General', 'Airline', 'Hotel', 'Umrah', 'Visa', 'Transport', 'Insurance', 'Tour', 'Wholesale'];
      if (standardTypes.includes(agent.type)) {
          setType(agent.type);
          setCustomType('');
      } else {
          setType('Other');
          setCustomType(agent.type);
      }

      setPhone(agent.phone || ''); 
      setEmail(agent.email || ''); 
      setAgentCurrency(agent.currency || 'JOD'); 
      const currency = agent.currency || 'JOD'; 
      const balanceInAgentCurrency = convertCurrency(agent.balance, 'JOD', currency); 
      setBalance(balanceInAgentCurrency.toString()); 
      setIsModalOpen(true); 
  };

  const handleSubmit = (e: React.FormEvent) => { 
      e.preventDefault(); 
      const balanceValue = balance === '' ? 0 : Number(balance); 
      const balanceInJOD = convertCurrency(balanceValue, agentCurrency, 'JOD'); 
      
      const finalType = type === 'Other' ? customType : type;

      if (editingId) { 
          updateAgent(editingId, { name, type: finalType, phone, email, balance: balanceInJOD, currency: agentCurrency }); 
          showNotification('تم تعديل بيانات الوكيل بنجاح', 'success'); 
      } else { 
          addAgent({ name, type: finalType, phone, email, balance: balanceInJOD, currency: agentCurrency }); 
          showNotification('تم إضافة الوكيل الجديد بنجاح', 'success'); 
      } 
      setIsModalOpen(false); 
  };

  const handleDelete = (id: string) => { setAgentToDeleteId(id); setIsDeleteModalOpen(true); };
  const confirmDelete = () => { if (agentToDeleteId) { deleteAgent(agentToDeleteId); showNotification('تم حذف الوكيل بنجاح', 'success'); setIsDeleteModalOpen(false); setAgentToDeleteId(null); } };
  const handleOpenPayment = (agent: Agent) => { setSelectedAgent(agent); setPayAmount(''); setPaymentCurrency(agent.currency || 'JOD'); setExchangeRate('1'); setSelectedTreasuryId(treasury.length > 0 ? treasury[0].id : ''); setIsPaymentModalOpen(true); };
  const handleSubmitPayment = (e: React.FormEvent) => { e.preventDefault(); const amountValue = Number(payAmount); const rateValue = parseFloat(exchangeRate); if (selectedAgent && amountValue > 0 && selectedTreasuryId && !isNaN(rateValue)) { const amountInJOD = amountValue * rateValue; addAgentPayment(selectedAgent.id, amountInJOD, selectedTreasuryId); showNotification('تم تسجيل سند الصرف وتحديث الأرصدة', 'success'); setIsPaymentModalOpen(false); } };
  
  const handlePrintReport = (agent: Agent) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // 1. Get Services
    const agentServices = allBookings.flatMap(b => 
        b.services?.filter(s => s.supplier === agent.name).map(s => ({
            date: b.date,
            ref: b.fileNo || b.id,
            desc: `${s.type} - ${s.hotelName || s.airline || s.details || '-'} (Ref: ${b.clientName})`,
            amount: convertCurrency(Number(s.costPrice) * Number(s.quantity), (s.costCurrency as Currency) || 'JOD', 'JOD'),
            type: 'SERVICE'
        })) || []
    );

    // 2. Get Payments
    const agentPayments = allTransactions.filter(t => 
        t.type === TransactionType.EXPENSE && t.description.includes(agent.name)
    ).map(t => ({
        date: t.date,
        ref: t.referenceNo || t.id,
        desc: t.description,
        amount: t.amount, // Already in JOD
        type: 'PAYMENT'
    }));

    // Merge and Sort
    const reportData = [...agentServices, ...agentPayments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate Totals
    const totalServices = agentServices.reduce((sum, item) => sum + item.amount, 0);
    const totalPayments = agentPayments.reduce((sum, item) => sum + item.amount, 0);
    const currentBalance = agent.balance + totalServices - totalPayments;

    const showLogo = companySettings.logoUrl && (companySettings.logoVisibility === 'both' || companySettings.logoVisibility === 'print');
    const logoHtml = showLogo 
        ? `<img src="${companySettings.logoUrl}" style="max-height: 80px; max-width: 200px; object-fit: contain;" />`
        : `<div class="logo">${companySettings.logoText}</div>`;

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <title>Supplier Statement - ${agent.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap" rel="stylesheet">
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
            .logo { color: #0891b2; font-size: 22px; font-weight: 800; }
            .meta { text-align: left; font-size: 11px; color: #64748b; }
            
            .title { text-align: center; font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 20px; }
            
            .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .info-item { flex: 1; text-align: center; }
            .label { color: #64748b; font-size: 10px; margin-bottom: 2px; font-weight: 600; text-transform: uppercase; }
            .value { color: #0f172a; font-weight: 700; font-size: 14px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; }
            th { text-align: right; padding: 8px; color: #64748b; font-size: 9px; font-weight: 600; border-bottom: 2px solid #e2e8f0; background: #f1f5f9; }
            td { padding: 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            
            .total-box { margin-top: 20px; border-top: 2px solid #0f172a; padding-top: 15px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; align-items: center; font-size: 12px; }
            .total-label { color: #64748b; font-weight: 600; }
            .total-value { font-weight: 800; color: #0f172a; direction: ltr; }
            .final-balance { font-size: 16px; color: #0891b2; margin-top: 10px; font-weight: 900; }

            .footer { margin-top: auto; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="print-container">
            <div class="header">
                <div style="text-align: right;">
                    ${logoHtml}
                    <div style="font-size: 12px; font-weight: bold; margin-top: 5px;">${companySettings.nameAr}</div>
                </div>
                <div class="meta">
                    <strong>${companySettings.nameEn}</strong><br>
                    Date: ${new Date().toLocaleDateString('en-GB')}<br>
                    Base Currency: JOD
                </div>
            </div>

            <div class="title">Supplier Account Statement<br><span style="font-size:12px; color:#64748b;">كشف حساب مورد / وكيل</span></div>

            <div class="info-box">
                <div class="info-item"><div class="label">Supplier</div><div class="value">${agent.name}</div></div>
                <div class="info-item"><div class="label">Type</div><div class="value">${agent.type}</div></div>
                <div class="info-item"><div class="label">Phone</div><div class="value" style="direction: ltr;">${agent.phone || '-'}</div></div>
            </div>

            <table>
                <thead><tr><th>Date</th><th>Description</th><th>Ref</th><th>Debit (Services)</th><th>Credit (Payments)</th></tr></thead>
                <tbody>
                    <tr>
                        <td colspan="3"><strong>Opening Balance</strong></td>
                        <td colspan="2" style="font-weight:bold; direction:ltr; text-align:right;">${agent.balance.toLocaleString('en-US')}</td>
                    </tr>
                    ${reportData.map(t => `
                    <tr>
                        <td style="color: #64748b;">${new Date(t.date).toLocaleDateString('en-GB')}</td>
                        <td>${t.desc}</td>
                        <td style="font-family: monospace;">${t.ref}</td>
                        <td style="font-weight: 600; color: #0f172a;">${t.type === 'SERVICE' ? t.amount.toLocaleString('en-US') : '-'}</td>
                        <td style="font-weight: 600; color: #10b981;">${t.type === 'PAYMENT' ? t.amount.toLocaleString('en-US') : '-'}</td>
                    </tr>`).join('')}
                    ${reportData.length === 0 ? '<tr><td colspan="5" style="text-align:center; padding: 10px;">No transactions found.</td></tr>' : ''}
                </tbody>
            </table>

            <div class="total-box">
                <div style="width: 300px; margin-right: auto;">
                    <div class="total-row"><span class="total-label">Total Services (Debit):</span><span class="total-value">${totalServices.toLocaleString('en-US')} JOD</span></div>
                    <div class="total-row"><span class="total-label">Total Payments (Credit):</span><span class="total-value">${totalPayments.toLocaleString('en-US')} JOD</span></div>
                    <div class="total-row final-balance"><span class="total-label">Balance Due:</span><span class="total-value">${currentBalance.toLocaleString('en-US')} JOD</span></div>
                </div>
            </div>
            
            <div class="footer">Generated by ${companySettings.nameEn} System - ${new Date().toLocaleString()}</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">إدارة الموردين والوكلاء</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">إدارة أرصدة وكلاء الفنادق والطيران ومزودي الخدمات</p>
        </div>
        <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20"
        >
          <Plus size={18} />
          <span>إضافة وكيل جديد</span>
        </button>
      </div>

      {/* Search & Table */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
         <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                <input type="text" placeholder="بحث عن وكيل..." className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-100 dark:bg-[#0f172a] text-cyan-600 dark:text-cyan-400 text-xs uppercase">
                    <tr>
                        <th className="px-6 py-4">اسم الوكيل</th>
                        <th className="px-6 py-4">النوع</th>
                        <th className="px-6 py-4">بيانات الاتصال</th>
                        <th className="px-6 py-4">الرصيد المستحق</th>
                        <th className="px-6 py-4 text-center">إجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredAgents.map((agent) => {
                        const displayCurrency = agent.currency || systemCurrency;
                        const { effectiveBalance } = getAgentMetrics(agent, displayCurrency);
                        
                        return (
                        <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group text-sm">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-cyan-600 dark:text-cyan-500">
                                        <Building2 size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 dark:text-white">{agent.name}</span>
                                        {agent.currency && agent.currency !== 'JOD' && <span className="text-[10px] text-slate-400">({agent.currency})</span>}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4"><span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700">{agent.type}</span></td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400"><div className="flex flex-col text-xs gap-1"><div className="flex items-center gap-1"><Phone size={12} /> {agent.phone || '-'}</div>{agent.email && <div className="flex items-center gap-1"><Mail size={12} /> {agent.email}</div>}</div></td>
                            <td className="px-6 py-4"><span className={`font-mono font-bold text-base ${effectiveBalance > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}`}>{formatMoney(effectiveBalance, displayCurrency)}</span></td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                     <button onClick={() => handleOpenPayment(agent)} title="صرف دفعة" className="p-1.5 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-colors"><DollarSign size={16} /></button>
                                    <button onClick={() => handlePrintReport(agent)} title="كشف حساب" className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-600 hover:text-white transition-colors"><Printer size={16} /></button>
                                    <button onClick={() => handleEdit(agent)} title="تعديل" className="p-1.5 bg-slate-200 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 rounded hover:bg-cyan-600 hover:text-white transition-colors"><Edit size={16} /></button>
                                    <button type="button" onClick={() => handleDelete(agent.id)} title="حذف" className="p-1.5 text-red-500 hover:bg-red-600 hover:text-white rounded transition-colors"><Trash2 size={16} className="pointer-events-none" /></button>
                                </div>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
         </div>
      </div>

      {/* Create/Edit Agent Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-800 dark:text-white font-bold">{editingId ? 'تعديل بيانات الوكيل' : 'إضافة الوكيل الجديد'}</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">اسم الوكيل / الشركة *</label>
                        <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">نوع النشاط</label>
                            <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none">
                                <option value="General">سياحة وسفر (عام)</option>
                                <option value="Airline">طيران (Airlines)</option>
                                <option value="Hotel">فنادق وإقامة (Hotels)</option>
                                <option value="Umrah">حج وعمرة</option>
                                <option value="Visa">تأشيرات (Visas)</option>
                                <option value="Transport">نقل ومواصلات</option>
                                <option value="Insurance">تأمين سفر</option>
                                <option value="Tour">رحلات وفعاليات</option>
                                <option value="Wholesale">مزود خدمة (B2B)</option>
                                <option value="Other">أخرى (Other)</option>
                            </select>
                            {type === 'Other' && (
                                <input 
                                    type="text" 
                                    placeholder="أدخل نوع النشاط" 
                                    value={customType} 
                                    onChange={(e) => setCustomType(e.target.value)} 
                                    className="w-full mt-2 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none text-xs" 
                                />
                            )}
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">عملة الحساب</label>
                            <select value={agentCurrency} onChange={(e) => setAgentCurrency(e.target.value as Currency)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none">
                                <option value="JOD">JOD - دينار</option>
                                <option value="USD">USD - دولار</option>
                                <option value="EUR">EUR - يورو</option>
                                <option value="ILS">ILS - شيكل</option>
                                <option value="SAR">SAR - ريال</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">رقم الهاتف</label>
                            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الرصيد الافتتاحي ({agentCurrency})</label>
                            <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg transition-colors">إلغاء</button>
                        <button type="submit" className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors">{editingId ? 'حفظ التعديلات' : 'إضافة الوكيل'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedAgent && (
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-700 flex justify-between items-center"><h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2"><DollarSign className="text-cyan-600 dark:text-cyan-400" size={20} /> سند صرف للمورد</h3><button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20} /></button></div>
                <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 text-center mb-4"><p className="text-xs text-slate-500 dark:text-slate-400">المورد</p><p className="text-slate-800 dark:text-white font-bold">{selectedAgent.name}</p><p className="text-xs text-slate-500 dark:text-slate-400 mt-2">الرصيد الحالي</p><p className="text-rose-500 dark:text-rose-400 font-bold text-lg">{formatMoney(getAgentMetrics(selectedAgent, selectedAgent.currency || 'JOD').effectiveBalance, selectedAgent.currency || 'JOD')}</p></div>
                    <div><label className="block text-xs text-cyan-600 dark:text-cyan-400 font-bold mb-1">المبلغ المدفوع (Original Amount)</label><div className="flex gap-2"><input autoFocus type="number" min="0.01" step="0.01" value={payAmount} onFocus={(e) => e.target.select()} onChange={(e) => setPayAmount(e.target.value)} className="flex-1 bg-slate-50 dark:bg-[#0f172a] border border-cyan-600/50 dark:border-cyan-700 rounded-lg p-3 text-slate-900 dark:text-white text-lg font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500" /><select value={paymentCurrency} onChange={(e) => setPaymentCurrency(e.target.value as Currency)} className="w-24 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white text-sm focus:border-cyan-500 focus:outline-none font-bold"><option value="JOD">JOD</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="ILS">ILS</option><option value="SAR">SAR</option></select></div></div>
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-[#0f172a] p-3 rounded border border-dashed border-slate-300 dark:border-slate-700"><div><label className="block text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Coins size={10}/> سعر الصرف</label><input type="number" step="any" value={exchangeRate} onFocus={(e) => e.target.select()} onChange={(e) => setExchangeRate(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-slate-800 dark:text-white text-sm focus:border-cyan-500 focus:outline-none"/></div><div><label className="block text-[10px] text-emerald-600 dark:text-emerald-500 mb-1 font-bold">المبلغ بالدينار (JOD)</label><div className="w-full bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">{(Number(payAmount) * (parseFloat(exchangeRate) || 0)).toFixed(2)}</div></div></div>
                     <div><label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Landmark size={12}/> طريقة الدفع / الصندوق</label><select value={selectedTreasuryId} onChange={(e) => setSelectedTreasuryId(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white text-sm focus:border-cyan-500 focus:outline-none">{treasury.map(t => (<option key={t.id} value={t.id}>{t.name} - الرصيد: {t.balance.toFixed(2)}</option>))}</select></div>
                    <div className="flex gap-3 mt-6"><button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg transition-colors">إلغاء</button><button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors">تأكيد الدفع</button></div>
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
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">هل أنت متأكد من رغبتك في حذف هذا الوكيل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
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

export default AgentsList;
