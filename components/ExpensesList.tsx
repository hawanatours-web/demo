
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Transaction, TransactionType, Currency } from '../types';
import { Plus, Search, Edit, Trash2, AlertTriangle, X, Wallet, TrendingDown, Banknote, Coins, Calendar, Hash, Printer, Landmark, Building2 } from 'lucide-react';

const ExpensesList: React.FC = () => {
  const { transactions, treasury, agents, addTransaction, updateTransaction, deleteTransaction, updateAgent, systemCurrency, convertAmount, convertCurrency, showNotification, companySettings } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [referenceNo, setReferenceNo] = useState(''); 
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>(''); 
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('General');
  const [currency, setCurrency] = useState<Currency>('JOD');
  const [exchangeRate, setExchangeRate] = useState<string>('1'); 
  const [selectedTreasuryId, setSelectedTreasuryId] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(''); 

  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

  // Filter only EXPENSE type transactions
  const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
  
  const filteredExpenses = expenses.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.includes(searchTerm) ||
    (t.referenceNo && t.referenceNo.includes(searchTerm))
  );

  // Expense Categories
  const EXPENSE_CATEGORIES = [
    'إيجارات', 'رواتب وأجور', 'فواتير (كهرباء/ماء/نت)', 'صيانة', 'تسويق وإعلانات', 
    'ضيافة ونظافة', 'رسوم حكومية', 'دفعات موردين', 'سلف موظفين', 'أخرى'
  ];

  // Effect to set default exchange rates
  useEffect(() => {
    if (currency === 'JOD') setExchangeRate('1');
    else if (currency === 'USD') setExchangeRate('0.71');
    else if (currency === 'EUR') setExchangeRate('0.75');
    else if (currency === 'ILS') setExchangeRate('0.20');
    else if (currency === 'SAR') setExchangeRate('0.19');
  }, [currency]);

  const displayMoney = (amountInJOD: number) => {
    return convertAmount(amountInJOD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Stats
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const currentMonthExpenses = expenses
    .filter(t => new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);

  const handleOpenCreate = () => {
    setEditingId(null);
    setReferenceNo('');
    setDescription('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('أخرى');
    setCurrency('JOD');
    setExchangeRate('1');
    setSelectedTreasuryId(treasury.length > 0 ? treasury[0].id : '');
    setSelectedAgentId('');
    setIsModalOpen(true);
  };

  const handleEdit = (expense: Transaction) => {
    setEditingId(expense.id);
    setReferenceNo(expense.referenceNo || '');
    setDescription(expense.description);
    // Convert back to string for editing, using original currency
    const originalAmount = expense.currency && expense.exchangeRate ? expense.amount / expense.exchangeRate : expense.amount;
    setAmount(originalAmount.toString()); 
    setCurrency(expense.currency || 'JOD'); 
    setExchangeRate((expense.exchangeRate || 1).toString());
    setDate(expense.date);
    setCategory(expense.category);
    setSelectedTreasuryId(expense.treasuryId || (treasury.length > 0 ? treasury[0].id : ''));
    setSelectedAgentId(''); 
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTreasuryId) {
        showNotification('يرجى اختيار الصندوق الذي تم الصرف منه', 'error');
        return;
    }

    // Parse amount string to number
    const numericAmount = parseFloat(amount);
    const rateValue = parseFloat(exchangeRate);

    if (isNaN(numericAmount) || numericAmount <= 0 || isNaN(rateValue)) {
         showNotification('يرجى إدخال مبلغ وسعر صرف صحيح', 'error');
         return;
    }

    // Always convert to JOD for storage
    const finalAmountJOD = numericAmount * rateValue;

    let finalDescription = description;

    // Logic to update Agent Balance if it is a Supplier Payment
    if (!editingId && category === 'دفعات موردين' && selectedAgentId) {
        const agent = agents.find(a => a.id === selectedAgentId);
        if (agent) {
            const newBalance = agent.balance - finalAmountJOD;
            updateAgent(agent.id, { balance: newBalance });
            finalDescription = `${description} (مورد: ${agent.name})`;
        }
    }

    const expenseData = {
      referenceNo,
      description: finalDescription,
      amount: finalAmountJOD,
      date,
      category,
      type: TransactionType.EXPENSE,
      currency, 
      exchangeRate: rateValue,
      treasuryId: selectedTreasuryId
    };

    if (editingId) {
      updateTransaction(editingId, expenseData);
      showNotification('تم تعديل المصروف بنجاح', 'success');
    } else {
      addTransaction(expenseData); 
      
      if (category === 'دفعات موردين' && selectedAgentId) {
          showNotification('تم تسجيل المصروف وتحديث رصيد المورد بنجاح', 'success');
      } else {
          showNotification('تم تسجيل المصروف وخصمه من الرصيد بنجاح', 'success');
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setExpenseToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDeleteId) {
      deleteTransaction(expenseToDeleteId);
      showNotification('تم حذف المصروف بنجاح', 'success');
      setIsDeleteModalOpen(false);
      setExpenseToDeleteId(null);
    }
  };

  const handlePrintVoucher = (expense: Transaction) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const showLogo = companySettings.logoUrl && (companySettings.logoVisibility === 'both' || companySettings.logoVisibility === 'print');

    const logoHtml = showLogo 
        ? `<img src="${companySettings.logoUrl}" style="max-height: 70px; max-width: 180px; object-fit: contain;" />`
        : `<div class="logo">${companySettings.logoText}</div>`;

    const voucherHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <title>Payment Voucher - ${expense.referenceNo || expense.id}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
        <style>
            @page { size: A4; margin: 0; }
            body { 
                font-family: 'Cairo', sans-serif; 
                margin: 0; 
                padding: 0;
                color: #1e293b; 
                background: white; 
                -webkit-print-color-adjust: exact;
                width: 100%;
                height: 100%;
            }
            .print-container {
                width: 210mm;
                min-height: 297mm;
                padding: 10mm;
                margin: 0 auto;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
            }
            .voucher-box {
                border: 2px solid #334155;
                padding: 25px;
                position: relative;
                background-color: #fff;
                border-radius: 8px;
            }
            
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .company-name { font-size: 16px; font-weight: 800; color: #0f172a; }
            .company-contact { font-size: 10px; color: #64748b; margin-top: 3px; }
            
            .voucher-title { text-align: center; }
            .voucher-title h1 { margin: 0; font-size: 22px; font-weight: 900; color: #334155; background-color: #f1f5f9; display: inline-block; padding: 5px 20px; border-radius: 6px; text-transform: uppercase; border: 1px solid #cbd5e1; }
            .voucher-title p { margin: 3px 0 0; font-size: 11px; font-weight: bold; letter-spacing: 1px; color: #64748b; text-transform: uppercase; }

            .meta-info { text-align: left; font-size: 12px; font-weight: 600; display: flex; flex-direction: column; gap: 4px; }
            
            .content { margin-top: 10px; display: flex; flex-direction: column; gap: 12px; }
            
            .field-row { display: flex; align-items: baseline; font-size: 13px; }
            .field-label { width: 130px; flex-shrink: 0; color: #64748b; font-weight: 700; }
            .field-value { flex-grow: 1; border-bottom: 1px dotted #334155; padding-bottom: 2px; color: #0f172a; font-weight: 700; }
            
            .amount-section {
                margin-top: 20px;
                display: flex;
                justify-content: flex-end;
            }
            .amount-box {
                border: 2px solid #334155;
                padding: 8px 20px;
                text-align: center;
                background: #f8fafc;
                border-radius: 6px;
                min-width: 150px;
            }
            .amount-label { font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 2px; text-transform: uppercase; }
            .amount-number { font-size: 20px; font-weight: 900; direction: ltr; color: #0f172a; }

            .signatures-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 40px; }
            .sig-box { text-align: center; }
            .sig-title { font-size: 10px; font-weight: bold; margin-bottom: 30px; color: #64748b; text-transform: uppercase; }
            .sig-line { border-bottom: 1px solid #334155; width: 80%; margin: 0 auto; }

            .footer { margin-top: auto; padding-top: 15px; text-align: center; font-size: 9px; color: #94a3b8; }

        </style>
      </head>
      <body>
        <div class="print-container">
            <div class="voucher-box">
                <div class="header">
                    <div class="company-info">
                        ${logoHtml}
                        <div class="company-name">${companySettings.nameAr}</div>
                        <div class="company-contact">${companySettings.phone}</div>
                    </div>
                    
                    <div class="voucher-title">
                        <h1>سند صرف</h1>
                        <p>PAYMENT VOUCHER</p>
                    </div>

                    <div class="meta-info">
                        <div>No: <span style="color: #ef4444; font-family: monospace; font-size: 14px;">${expense.referenceNo || expense.id}</span></div>
                        <div>Date: <span style="font-family: monospace;">${new Date(expense.date).toLocaleDateString('en-GB')}</span></div>
                    </div>
                </div>

                <div class="content">
                    <div class="field-row">
                        <span class="field-label">Paid To / يصرف إلى:</span>
                        <span class="field-value">${expense.description}</span>
                    </div>
                    
                    <div class="field-row">
                        <span class="field-label">The Sum of / مبلغ وقدره:</span>
                        <span class="field-value">${convertAmount(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${systemCurrency}</span>
                    </div>

                    <div class="field-row">
                        <span class="field-label">Being / وذلك عن:</span>
                        <span class="field-value">${expense.category}</span>
                    </div>
                    
                    <div class="field-row">
                        <span class="field-label">Pay Mode / طريقة الدفع:</span>
                        <span class="field-value">${expense.checkDetails ? 'شيك (Check)' : 'نقداً / تحويل (Cash/Transfer)'} - ${treasury.find(t => t.id === expense.treasuryId)?.name || ''}</span>
                    </div>
                </div>

                <div class="amount-section">
                    <div class="amount-box">
                        <div class="amount-label">AMOUNT (${systemCurrency})</div>
                        <div class="amount-number">${convertAmount(expense.amount).toFixed(2)}</div>
                    </div>
                </div>

                <div class="signatures-grid">
                    <div class="sig-box">
                        <div class="sig-title">Accountant / المحاسب</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-title">Manager / المدير المالي</div>
                        <div class="sig-line"></div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-title">Receiver / المستلم</div>
                        <div class="sig-line"></div>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                Generated by ${companySettings.nameEn} System
            </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(voucherHTML);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Wallet className="text-cyan-600 dark:text-cyan-400" />
                المصروفات العمومية والتشغيلية
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">إدارة مصاريف المكتب، الرواتب، والمشتريات العامة</p>
        </div>
        <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/20"
        >
          <Plus size={18} />
          <span>تسجيل مصروف جديد</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-between">
            <div>
               <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">إجمالي المصروفات (الكلي)</p>
               <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{displayMoney(totalExpenses)} <span className="text-sm text-slate-500">{systemCurrency}</span></h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-500 border border-rose-200 dark:border-rose-900/50">
               <Wallet size={24} />
            </div>
         </div>
         <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg flex items-center justify-between">
            <div>
               <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">مصروفات هذا الشهر</p>
               <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{displayMoney(currentMonthExpenses)} <span className="text-sm text-slate-500">{systemCurrency}</span></h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-900/50">
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
                placeholder="بحث برقم السند، الوصف، أو المبلغ..." 
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
                        <th className="px-6 py-4">رقم السند</th>
                        <th className="px-6 py-4">الوصف</th>
                        <th className="px-6 py-4">التصنيف</th>
                        <th className="px-6 py-4">التاريخ</th>
                        <th className="px-6 py-4">المستخدم</th>
                        <th className="px-6 py-4">المبلغ ({systemCurrency})</th>
                        <th className="px-6 py-4 text-center">إجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group text-sm">
                            <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-xs">
                                {expense.referenceNo || '-'}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                {expense.description}
                            </td>
                            <td className="px-6 py-4">
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs border border-slate-200 dark:border-slate-700">
                                    {expense.category}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-mono">
                                {new Date(expense.date).toLocaleDateString('en-GB')}
                            </td>
                             <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                                {expense.createdBy || 'System'}
                            </td>
                            <td className="px-6 py-4">
                                <span className="font-mono font-bold text-base text-rose-600 dark:text-rose-400">
                                    {displayMoney(expense.amount)}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => handlePrintVoucher(expense)} title="طباعة سند صرف" className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-900/50 transition-colors">
                                        <Printer size={16} />
                                    </button>
                                    <button onClick={() => handleEdit(expense)} title="تعديل" className="p-1.5 bg-slate-200 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 rounded hover:bg-cyan-600 hover:text-white transition-colors">
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handleDelete(expense.id)}
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
            {filteredExpenses.length === 0 && (
                <div className="p-8 text-center text-slate-500">لا يوجد مصروفات مطابقة للبحث</div>
            )}
         </div>
      </div>

      {/* Create/Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                        <Banknote className="text-rose-500" size={20} />
                        {editingId ? 'تعديل بيانات المصروف' : 'تسجيل مصروف جديد'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                     <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Hash size={12} /> رقم السند / القيد (اختياري)</label>
                        <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-rose-500 focus:outline-none font-mono" placeholder="REF-001" />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">وصف المصروف / البيان *</label>
                        <input required type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-rose-500 focus:outline-none" placeholder="مثال: فاتورة كهرباء شهر 11" />
                    </div>
                    
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تصنيف المصروف</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-rose-500 focus:outline-none">
                            {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    {category === 'دفعات موردين' && (
                        <div className="animate-fade-in">
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Building2 size={12} /> اختر المورد</label>
                            <select 
                                value={selectedAgentId} 
                                onChange={(e) => setSelectedAgentId(e.target.value)} 
                                className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-rose-500 focus:outline-none"
                            >
                                <option value="">-- اختر مورد من القائمة --</option>
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.name} (رصيد: {convertAmount(agent.balance).toFixed(2)})</option>
                                ))}
                            </select>
                            {selectedAgentId && (
                                <p className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1">* سيتم خصم المبلغ من رصيد المورد تلقائياً.</p>
                            )}
                        </div>
                    )}

                    <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                         <div>
                            <label className="block text-xs text-rose-500 dark:text-rose-400 font-bold mb-1">قيمة المصروف (Original Amount)</label>
                            <div className="flex gap-2">
                                <input 
                                    autoFocus
                                    type="number" 
                                    min="0.01" 
                                    step="0.01" 
                                    value={amount} 
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => setAmount(e.target.value)} 
                                    className="flex-1 bg-slate-50 dark:bg-[#0f172a] border border-rose-600/50 dark:border-rose-700 rounded-lg p-2 text-slate-900 dark:text-white text-lg font-bold focus:outline-none focus:ring-1 focus:ring-rose-500" 
                                />
                                <select 
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value as Currency)}
                                    className="w-24 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white text-sm focus:border-rose-500 focus:outline-none font-bold"
                                >
                                    <option value="JOD">JOD</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="ILS">ILS</option>
                                    <option value="SAR">SAR</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-[10px] text-slate-500 dark:text-slate-500 mb-1 flex items-center gap-1"><Coins size={10}/> سعر الصرف</label>
                                <input 
                                    type="number" 
                                    step="any"
                                    value={exchangeRate}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => setExchangeRate(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-slate-800 dark:text-white text-sm focus:border-rose-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] text-slate-500 dark:text-slate-500 mb-1 font-bold">المعادل (JOD)</label>
                                <div className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-slate-600 dark:text-slate-300 font-bold text-sm">
                                    {(Number(amount) * (parseFloat(exchangeRate) || 0)).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                     {/* Treasury Selection */}
                     <div>
                         <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Landmark size={12}/> الصندوق (يصرف من)</label>
                         <select value={selectedTreasuryId} onChange={(e) => setSelectedTreasuryId(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white text-sm focus:border-cyan-500 focus:outline-none">
                             {treasury.map(t => (
                                 <option key={t.id} value={t.id}>{t.name} - الرصيد: {t.balance.toFixed(2)}</option>
                             ))}
                         </select>
                     </div>

                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Calendar size={12} /> تاريخ العملية</label>
                        <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-rose-500 focus:outline-none" />
                    </div>

                    <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors mt-4 shadow-lg">
                        {editingId ? 'حفظ التعديلات' : 'إضافة المصروف'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900/50">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-slate-800 dark:text-white text-lg font-bold mb-2">تأكيد الحذف</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">هل أنت متأكد من حذف هذا المصروف؟ سيتم خصمه من الحسابات.</p>
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

export default ExpensesList;
