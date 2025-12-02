
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Treasury, Currency, TransactionType, Transaction } from '../types';
import { Plus, Edit, Trash2, Landmark, Wallet, AlertTriangle, X, Search, FileText, Filter, ArrowUpCircle, ArrowDownCircle, Printer, ScrollText, CalendarClock, Building, CheckCircle2, Coins, Hash, User, Calendar, FileEdit, ArrowLeftRight, ChevronLeft, ChevronRight, Repeat, RotateCcw } from 'lucide-react';

const TreasuryList: React.FC = () => {
  const { treasury, transactions, allTransactions, addTreasury, updateTreasury, deleteTreasury, addTransaction, transferTransaction, deleteTransaction, showNotification, systemCurrency, convertAmount, companySettings, fetchTransactions, transactionsPage, transactionsTotal } = useData();
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false); // Account Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false); // Check Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false); // Record Transfer Modal
  const [isFundTransferModalOpen, setIsFundTransferModalOpen] = useState(false); // NEW: Fund Transfer Modal
  const [isUndoModalOpen, setIsUndoModalOpen] = useState(false); // NEW: Undo Transaction Modal

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [transactionToUndoId, setTransactionToUndoId] = useState<string | null>(null);

  // Filter State
  const [selectedTreasuryFilter, setSelectedTreasuryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Account Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'Cash' | 'Bank' | 'Checks'>('Cash');
  const [balance, setBalance] = useState<string>(''); // Changed to string
  const [currency, setCurrency] = useState<Currency>('JOD');
  const [accountNumber, setAccountNumber] = useState('');

  // Transfer State (Move Record)
  const [transactionToTransfer, setTransactionToTransfer] = useState<Transaction | null>(null);
  const [targetTreasuryId, setTargetTreasuryId] = useState<string>('');

  // NEW: Fund Transfer State
  const [fundTransferData, setFundTransferData] = useState({
      fromTreasuryId: '',
      toTreasuryId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
  });

  // Check Form State
  const [checkData, setCheckData] = useState<{
      checkNumber: string;
      bankName: string;
      dueDate: string;
      clientName: string;
      amount: string; // Changed to string
      description: string;
  }>({
      checkNumber: '',
      bankName: '',
      dueDate: '',
      clientName: '',
      amount: '',
      description: ''
  });
  const [checkCurrency, setCheckCurrency] = useState<Currency>('JOD');
  const [checkExchangeRate, setCheckExchangeRate] = useState<string>('1'); // Changed to string

  const displayMoney = (amountInJOD: number) => {
    return convertAmount(amountInJOD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Effect for Check Exchange Rate
  useEffect(() => {
    if (checkCurrency === 'JOD') setCheckExchangeRate('1');
    else if (checkCurrency === 'USD') setCheckExchangeRate('0.71');
    else if (checkCurrency === 'EUR') setCheckExchangeRate('0.75');
    else if (checkCurrency === 'ILS') setCheckExchangeRate('0.20');
    else if (checkCurrency === 'SAR') setCheckExchangeRate('0.19');
  }, [checkCurrency]);

  // Trigger server-side fetch when filters change (with debounce for search)
  useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
          fetchTransactions(1, searchTerm, { treasuryId: selectedTreasuryFilter });
      }, 500);

      return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedTreasuryFilter]);

  const handlePageChange = (newPage: number) => {
      fetchTransactions(newPage, searchTerm, { treasuryId: selectedTreasuryFilter });
  };

  const totalPages = Math.ceil(transactionsTotal / 25); // 25 is PAGE_SIZE

  // --- Summary Calculation (Using ALL data) ---
  const filteredAllTransactions = allTransactions.filter(t => 
      selectedTreasuryFilter === 'ALL' || t.treasuryId === selectedTreasuryFilter
  );

  const totalIncome = filteredAllTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredAllTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const netMovement = totalIncome - totalExpense;

  // Check if current view is specifically a Checks Fund
  const isChecksView = () => {
      if (selectedTreasuryFilter === 'ALL') return false;
      const selected = treasury.find(t => t.id === selectedTreasuryFilter);
      return selected?.type === 'Checks';
  };

  // --- Actions ---

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setType('Cash');
    setBalance('');
    setCurrency('JOD');
    setAccountNumber('');
    setIsModalOpen(true);
  };

  const handleEdit = (t: Treasury) => {
    setEditingId(t.id);
    setName(t.name);
    setType(t.type);
    setBalance(t.balance.toString()); 
    setCurrency('JOD'); 
    setAccountNumber(t.accountNumber || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBalance = balance === '' ? 0 : Number(balance);
    const data = { name, type, balance: finalBalance, currency, accountNumber };
    
    if (editingId) {
      updateTreasury(editingId, data);
      showNotification('تم تحديث بيانات الصندوق/البنك بنجاح', 'success');
    } else {
      addTreasury(data);
      showNotification('تم إضافة الصندوق/البنك بنجاح', 'success');
    }
    setIsModalOpen(false);
  };

  // Handle Transfer Modal (Move Record)
  const handleOpenTransfer = (transaction: Transaction) => {
      setTransactionToTransfer(transaction);
      setTargetTreasuryId('');
      setIsTransferModalOpen(true);
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
      e.preventDefault();
      if (transactionToTransfer && targetTreasuryId) {
          transferTransaction(transactionToTransfer.id, targetTreasuryId);
          setIsTransferModalOpen(false);
      } else {
          showNotification('يرجى اختيار الصندوق الهدف', 'error');
      }
  };

  // Handle Undo Transaction
  const handleUndo = (id: string) => {
      setTransactionToUndoId(id);
      setIsUndoModalOpen(true);
  };

  const confirmUndo = () => {
      if (transactionToUndoId) {
          deleteTransaction(transactionToUndoId);
          showNotification('تم التراجع عن الحركة وتصحيح الرصيد', 'success');
          setIsUndoModalOpen(false);
          setTransactionToUndoId(null);
      }
  };

  // NEW: Handle Fund Transfer (Internal Transfer)
  const handleOpenFundTransfer = () => {
      setFundTransferData({
          fromTreasuryId: '',
          toTreasuryId: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: ''
      });
      setIsFundTransferModalOpen(true);
  };

  const handleSubmitFundTransfer = async (e: React.FormEvent) => {
      e.preventDefault();
      const amountVal = parseFloat(fundTransferData.amount);
      
      if (!fundTransferData.fromTreasuryId || !fundTransferData.toTreasuryId) {
          showNotification('يرجى اختيار الحسابات (المصدر والمستلم)', 'error');
          return;
      }
      if (fundTransferData.fromTreasuryId === fundTransferData.toTreasuryId) {
          showNotification('لا يمكن التحويل لنفس الحساب', 'error');
          return;
      }
      if (isNaN(amountVal) || amountVal <= 0) {
          showNotification('يرجى إدخال مبلغ صحيح', 'error');
          return;
      }

      const fromTreasury = treasury.find(t => t.id === fundTransferData.fromTreasuryId);
      const toTreasury = treasury.find(t => t.id === fundTransferData.toTreasuryId);

      if (fromTreasury && fromTreasury.balance < amountVal) {
          showNotification('تنبيه: رصيد الصندوق المصدر أقل من المبلغ المحول، سيتم التسجيل بالسالب', 'info');
      }

      // 1. Expense from Source
      await addTransaction({
          description: `تحويل صادر إلى: ${toTreasury?.name} - ${fundTransferData.description}`,
          amount: amountVal,
          date: fundTransferData.date,
          type: TransactionType.EXPENSE,
          category: 'تحويل داخلي', // Internal Transfer
          treasuryId: fundTransferData.fromTreasuryId,
          currency: 'JOD', 
          exchangeRate: 1
      });

      // 2. Income to Dest
      await addTransaction({
          description: `تحويل وارد من: ${fromTreasury?.name} - ${fundTransferData.description}`,
          amount: amountVal,
          date: fundTransferData.date,
          type: TransactionType.INCOME,
          category: 'تحويل داخلي',
          treasuryId: fundTransferData.toTreasuryId,
          currency: 'JOD',
          exchangeRate: 1
      });

      showNotification('تم تحويل الأموال بنجاح', 'success');
      setIsFundTransferModalOpen(false);
  };

  // Handle Check Registration
  const handleOpenCheckModal = () => {
      const checksFund = selectedTreasuryFilter !== 'ALL' 
        ? treasury.find(t => t.id === selectedTreasuryFilter && t.type === 'Checks')
        : treasury.find(t => t.type === 'Checks');
      
      if (!checksFund && selectedTreasuryFilter !== 'ALL') {
          showNotification('يرجى اختيار حافظة شيكات أولاً', 'error');
          return;
      }
      
      setCheckData({
          checkNumber: '',
          bankName: '',
          dueDate: '',
          clientName: '',
          amount: '',
          description: 'شيك وارد - دفعة'
      });
      setCheckCurrency('JOD');
      setCheckExchangeRate('1');
      setIsCheckModalOpen(true);
  };

  const handleSubmitCheck = (e: React.FormEvent) => {
      e.preventDefault();
      
      let targetTreasuryId = selectedTreasuryFilter;
      if (selectedTreasuryFilter === 'ALL') {
          const defaultChecks = treasury.find(t => t.type === 'Checks');
          if (defaultChecks) targetTreasuryId = defaultChecks.id;
          else {
              showNotification('لا توجد حافظة شيكات معرفة في النظام', 'error');
              return;
          }
      }

      const rateValue = parseFloat(checkExchangeRate);
      const finalAmountJOD = Number(checkData.amount) * (isNaN(rateValue) ? 1 : rateValue);

      addTransaction({
          description: checkData.description,
          amount: finalAmountJOD,
          date: new Date().toISOString().split('T')[0],
          type: TransactionType.INCOME,
          category: 'شيكات',
          treasuryId: targetTreasuryId,
          currency: checkCurrency,
          exchangeRate: rateValue,
          checkDetails: {
              checkNumber: checkData.checkNumber,
              bankName: checkData.bankName,
              dueDate: checkData.dueDate,
              clientName: checkData.clientName,
              status: 'Pending'
          }
      });
      
      showNotification('تم تسجيل الشيك في الحافظة بنجاح', 'success');
      setIsCheckModalOpen(false);
  };

  const confirmDelete = () => {
      if(deleteId) {
          deleteTreasury(deleteId);
          showNotification('تم الحذف بنجاح', 'success');
          setIsDeleteModalOpen(false);
      }
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const accountName = selectedTreasuryFilter === 'ALL' ? 'All Accounts' : treasury.find(t => t.id === selectedTreasuryFilter)?.name || 'Unknown';
    const currentDate = new Date().toLocaleDateString('en-GB');
    const isCheckReport = isChecksView();

    const showLogo = companySettings.logoUrl && (companySettings.logoVisibility === 'both' || companySettings.logoVisibility === 'print');

    const logoHtml = showLogo 
        ? `<img src="${companySettings.logoUrl}" style="max-height: 80px; max-width: 200px; object-fit: contain;" />`
        : `<div class="logo">${companySettings.logoText}</div>`;

    // For print report, we likely want ALL transactions for this account, not just the page
    const reportTransactions = filteredAllTransactions; 

    const reportHTML = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <title>Treasury Report</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            @page { size: A4 ${isCheckReport ? 'landscape' : ''}; margin: 0; }
            body { 
                font-family: 'Cairo', sans-serif; 
                background: #fff; 
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
            
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0891b2; padding-bottom: 15px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 800; color: #0891b2; }
            .meta { font-size: 11px; color: #64748b; text-align: left; }
            
            .title { text-align: center; margin-bottom: 20px; }
            .title h2 { margin: 0; color: #0f172a; text-transform: uppercase; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
            thead { background: #0f172a; color: white; }
            th { padding: 10px; text-align: right; font-weight: 600; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
            tr:nth-child(even) { background-color: #f8fafc; }
            
            .status-badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; border: 1px solid #ccc; display: inline-block; }

            .footer { margin-top: auto; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="print-container">
            <div class="header">
                <div>
                    ${logoHtml}
                    <div style="font-weight:bold; margin-top:5px;">${companySettings.nameAr}</div>
                </div>
                <div class="meta">
                    <strong>${companySettings.nameEn}</strong><br>
                    Report Date: ${currentDate}<br>
                    Account: ${accountName}
                </div>
            </div>

            <div class="title">
                <h2>${isCheckReport ? 'Checks Registry Report' : 'Treasury Transaction Report'}</h2>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width:12%;">Date</th>
                        ${isCheckReport ? `
                            <th>Check No</th>
                            <th>Client / Drawer</th>
                            <th>Bank</th>
                            <th>Due Date</th>
                            <th>Status</th>
                        ` : `
                            <th style="width:10%;">Type</th>
                            <th>Description</th>
                            <th style="width:15%;">Category</th>
                            <th style="width:10%;">User</th>
                        `}
                        <th style="width:15%;">Amount (JOD)</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportTransactions.map(t => `
                    <tr>
                        <td style="color: #64748b; font-family: monospace;">${new Date(t.date).toLocaleDateString('en-GB')}</td>
                        ${isCheckReport ? `
                            <td style="font-weight: 600;">${t.checkDetails?.checkNumber || '-'}</td>
                            <td>${t.checkDetails?.clientName || '-'}</td>
                            <td>${t.checkDetails?.bankName || '-'}</td>
                            <td style="font-family: monospace;">${t.checkDetails?.dueDate || '-'}</td>
                            <td><span class="status-badge">${t.checkDetails?.status || 'Pending'}</span></td>
                        ` : `
                            <td>${t.type}</td>
                            <td>${t.description} ${t.referenceNo ? `(#${t.referenceNo})` : ''}</td>
                            <td style="color: #64748b;">${t.category}</td>
                            <td style="color: #64748b;">${t.createdBy || 'System'}</td>
                        `}
                        <td style="font-weight: 700; direction: ltr; text-align: right; color: ${t.type === 'دخل' ? '#10b981' : '#f43f5e'}">
                            ${t.type === 'دخل' ? '+' : '-'}${t.amount.toLocaleString('en-US')}
                        </td>
                    </tr>
                    `).join('')}
                    ${reportTransactions.length === 0 ? '<tr><td colspan="7" style="text-align:center; padding:20px;">No records found</td></tr>' : ''}
                </tbody>
            </table>

            <div class="footer">
                ${companySettings.nameEn} System - Generated Report
            </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(reportHTML);
    printWindow.document.close();
  };

  // Helper to get icon based on Treasury Type
  const getTreasuryIcon = (type: 'Cash' | 'Bank' | 'Checks') => {
      switch(type) {
          case 'Bank': return <Landmark size={20} />;
          case 'Checks': return <ScrollText size={20} />;
          default: return <Wallet size={20} />;
      }
  };

  // Helper to get color based on Treasury Type
  const getTreasuryColorClass = (type: 'Cash' | 'Bank' | 'Checks') => {
      switch(type) {
          case 'Bank': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:border-blue-500/50';
          case 'Checks': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:border-purple-500/50';
          default: return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:border-cyan-500/50';
      }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Landmark className="text-cyan-600 dark:text-cyan-400" />
                الخزينة والبنوك
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">إدارة الصناديق النقدية، الحسابات البنكية، وحافظة الشيكات</p>
        </div>
        <div className="flex gap-3">
             <button onClick={handleOpenFundTransfer} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20">
                <Repeat size={18} /> تحويل داخلي
            </button>
             <button onClick={handleOpenCheckModal} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20">
                <ScrollText size={18} /> تسجيل شيك
            </button>
            <button onClick={handleOpenCreate} className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-500 font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/20">
                <Plus size={18} /> إضافة حساب
            </button>
        </div>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div 
            onClick={() => setSelectedTreasuryFilter('ALL')}
            className={`p-6 rounded-xl border cursor-pointer transition-all relative overflow-hidden group ${
                selectedTreasuryFilter === 'ALL' 
                ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
            }`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${selectedTreasuryFilter === 'ALL' ? 'bg-cyan-600 dark:bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <Landmark size={24} />
                </div>
            </div>
            <h3 className="text-slate-800 dark:text-white font-bold mb-1">جميع الحسابات</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">عرض شامل لحركة الخزينة</p>
        </div>

        {treasury.map(t => (
            <div 
                key={t.id}
                onClick={() => setSelectedTreasuryFilter(t.id)}
                className={`p-6 rounded-xl border cursor-pointer transition-all relative overflow-hidden group ${
                    selectedTreasuryFilter === t.id 
                    ? 'bg-opacity-20 border-opacity-100 shadow-lg' 
                    : 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                } ${selectedTreasuryFilter === t.id ? getTreasuryColorClass(t.type).replace('group-hover:', '') + ' border-' + (t.type === 'Bank' ? 'blue' : t.type === 'Checks' ? 'purple' : 'emerald') + '-500' : ''}`}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg ${
                        t.type === 'Bank' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 
                        t.type === 'Checks' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' : 
                        'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                    }`}>
                        {getTreasuryIcon(t.type)}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(t); }} className="text-slate-400 hover:text-cyan-500 dark:text-slate-500 dark:hover:text-cyan-400"><Edit size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); setIsDeleteModalOpen(true); }} className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                </div>
                <h3 className="text-slate-800 dark:text-white font-bold mb-1 truncate">{t.name}</h3>
                <p className={`text-xl font-bold font-mono ${t.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                    {displayMoney(t.balance)} <span className="text-xs text-slate-500">JOD</span>
                </p>
                {t.accountNumber && <p className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-1"><Hash size={10}/> {t.accountNumber}</p>}
            </div>
        ))}
      </div>
      
      {/* Summary for selected view */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                    <ArrowDownCircle size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">مقبوضات (وارد) - الكلي</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{displayMoney(totalIncome)} JOD</p>
                </div>
           </div>
           <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                    <ArrowUpCircle size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">مصروفات (صادر) - الكلي</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{displayMoney(totalExpense)} JOD</p>
                </div>
           </div>
           <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                    <Wallet size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">صافي الحركة - الكلي</p>
                    <p className={`text-xl font-bold ${netMovement >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {netMovement > 0 ? '+' : ''}{displayMoney(netMovement)} JOD
                    </p>
                </div>
           </div>
      </div>

      {/* Transactions Table (Paginated) */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
         <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]">
            <div className="flex items-center gap-4">
                <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                    <FileText className="text-cyan-600 dark:text-cyan-400" size={20} />
                    سجل الحركات
                </h3>
                {/* Search inside Transactions */}
                <div className="relative w-64">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="بحث في الحركات..." 
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:border-cyan-500 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <button onClick={handlePrintReport} className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition-colors">
                <Printer size={14} /> طباعة تقرير شامل
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-100 dark:bg-[#0f172a] text-cyan-600 dark:text-cyan-400 text-xs uppercase">
                    <tr>
                        <th className="px-6 py-4">رقم السند</th>
                        <th className="px-6 py-4">نوع الحركة</th>
                        <th className="px-6 py-4">البيان / الوصف</th>
                        <th className="px-6 py-4">التاريخ</th>
                        <th className="px-6 py-4">التصنيف</th>
                        {isChecksView() && <th className="px-6 py-4">بيانات الشيك</th>}
                        <th className="px-6 py-4">المبلغ (JOD)</th>
                        <th className="px-6 py-4 text-center">إجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                            <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                                {t.referenceNo || t.id}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-[10px] border ${
                                    t.type === TransactionType.INCOME 
                                    ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' 
                                    : 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30'
                                }`}>
                                    {t.type}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-white max-w-xs truncate">
                                {t.description}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-mono">
                                {new Date(t.date).toLocaleDateString('en-GB')}
                            </td>
                            <td className="px-6 py-4">
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-[10px] border border-slate-200 dark:border-slate-700">
                                    {t.category}
                                </span>
                            </td>
                            {isChecksView() && (
                                <td className="px-6 py-4 text-xs text-purple-600 dark:text-purple-300">
                                    {t.checkDetails ? (
                                        <div>
                                            <div>{t.checkDetails.checkNumber} - {t.checkDetails.bankName}</div>
                                            <div className="text-[10px] text-slate-500">استحقاق: {t.checkDetails.dueDate}</div>
                                        </div>
                                    ) : '-'}
                                </td>
                            )}
                            <td className={`px-6 py-4 font-mono font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {t.type === TransactionType.INCOME ? '+' : '-'}{displayMoney(t.amount)}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => handleOpenTransfer(t)} 
                                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                        title="نقل الحركة إلى صندوق آخر"
                                    >
                                        <ArrowLeftRight size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleUndo(t.id)} 
                                        className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded transition-colors"
                                        title="تراجع عن الحركة (عكس العملية)"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {transactions.length === 0 && (
                <div className="p-8 text-center text-slate-500">لا يوجد حركات مالية مطابقة للبحث</div>
            )}
         </div>

         {/* Pagination Controls */}
         <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0f172a]">
             <div className="text-xs text-slate-500 dark:text-slate-400">
                 عرض {transactions.length} من {transactionsTotal} حركة
             </div>
             <div className="flex gap-2">
                 <button 
                    onClick={() => handlePageChange(transactionsPage - 1)} 
                    disabled={transactionsPage === 1}
                    className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 text-sm"
                 >
                     <ChevronRight size={16} /> السابق
                 </button>
                 <span className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm font-bold">
                     {transactionsPage} / {totalPages || 1}
                 </span>
                 <button 
                    onClick={() => handlePageChange(transactionsPage + 1)} 
                    disabled={transactionsPage >= totalPages}
                    className="px-3 py-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 text-sm"
                 >
                     التالي <ChevronLeft size={16} />
                 </button>
             </div>
         </div>
      </div>

      {/* Create/Edit Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-slate-800 dark:text-white font-bold">{editingId ? 'تعديل بيانات الحساب' : 'إضافة حساب جديد'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">اسم الحساب / الصندوق *</label>
                        <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" placeholder="مثال: الصندوق الرئيسي" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">النوع</label>
                        <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none">
                            <option value="Cash">صندوق نقدي (Cash)</option>
                            <option value="Bank">حساب بنكي (Bank)</option>
                            <option value="Checks">حافظة شيكات (Checks)</option>
                        </select>
                    </div>
                    {type === 'Bank' && (
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">رقم الحساب البنكي (IBAN)</label>
                            <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none font-mono" />
                        </div>
                    )}
                    <div>
                         <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الرصيد الافتتاحي (JOD)</label>
                         <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg mt-2 transition-colors">
                        {editingId ? 'حفظ التعديلات' : 'إضافة الحساب'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* NEW: Fund Transfer Modal (Internal Transfer) */}
      {isFundTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                        <Repeat size={20} className="text-blue-500" />
                        تحويل داخلي (نقل أموال)
                    </h3>
                    <button onClick={() => setIsFundTransferModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmitFundTransfer} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">من الحساب (المصدر)</label>
                        <select 
                            required
                            value={fundTransferData.fromTreasuryId} 
                            onChange={(e) => setFundTransferData({...fundTransferData, fromTreasuryId: e.target.value})} 
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none text-sm"
                        >
                            <option value="">-- اختر الحساب المصدر --</option>
                            {treasury.map(t => (
                                <option key={t.id} value={t.id}>{t.name} (رصيد: {displayMoney(t.balance)})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">إلى الحساب (المستلم)</label>
                        <select 
                            required
                            value={fundTransferData.toTreasuryId} 
                            onChange={(e) => setFundTransferData({...fundTransferData, toTreasuryId: e.target.value})} 
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none text-sm"
                        >
                            <option value="">-- اختر الحساب المستلم --</option>
                            {treasury.filter(t => t.id !== fundTransferData.fromTreasuryId).map(t => (
                                <option key={t.id} value={t.id}>{t.name} (رصيد: {displayMoney(t.balance)})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">المبلغ (JOD)</label>
                        <input 
                            required 
                            type="number" 
                            min="0.01"
                            step="0.01"
                            value={fundTransferData.amount} 
                            onChange={(e) => setFundTransferData({...fundTransferData, amount: e.target.value})} 
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none font-bold font-mono"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تاريخ التحويل</label>
                        <input 
                            required 
                            type="date" 
                            value={fundTransferData.date} 
                            onChange={(e) => setFundTransferData({...fundTransferData, date: e.target.value})} 
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">ملاحظات</label>
                        <textarea 
                            value={fundTransferData.description} 
                            onChange={(e) => setFundTransferData({...fundTransferData, description: e.target.value})} 
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none h-20 resize-none text-sm"
                            placeholder="سبب التحويل..."
                        />
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg mt-2 transition-colors shadow-lg shadow-blue-900/20">
                        تأكيد التحويل
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Existing Transaction Record Transfer Modal */}
      {isTransferModalOpen && transactionToTransfer && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                        <ArrowLeftRight size={20} className="text-blue-500" />
                        نقل حركة مالية
                    </h3>
                    <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmitTransfer} className="p-6 space-y-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">نقل الحركة رقم {transactionToTransfer.referenceNo || transactionToTransfer.id}</p>
                        <p className="font-bold text-slate-800 dark:text-white mt-1">{transactionToTransfer.description}</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2 dir-ltr">{displayMoney(transactionToTransfer.amount)} JOD</p>
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">إلى الصندوق / الحساب (الهدف)</label>
                        <select 
                            required
                            value={targetTreasuryId} 
                            onChange={(e) => setTargetTreasuryId(e.target.value)} 
                            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-blue-500 focus:outline-none text-sm"
                        >
                            <option value="">-- اختر الحساب المستلم --</option>
                            {treasury.filter(t => t.id !== transactionToTransfer.treasuryId).map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg mt-2 transition-colors">
                        تأكيد النقل
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* Undo Confirmation Modal */}
      {isUndoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-center">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-900/50">
                    <RotateCcw size={24} />
                </div>
                <h3 className="text-slate-800 dark:text-white text-lg font-bold mb-2">تراجع عن الحركة</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">هل أنت متأكد من عكس هذه الحركة المالية؟ سيتم إعادة الرصيد إلى حالته السابقة.</p>
                <div className="flex gap-3">
                    <button onClick={() => setIsUndoModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">إلغاء</button>
                    <button onClick={confirmUndo} className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors">تأكيد التراجع</button>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Account) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900/50">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-slate-800 dark:text-white text-lg font-bold mb-2">تأكيد حذف الحساب</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">هل أنت متأكد من حذف هذا الحساب؟ يجب التأكد من عدم وجود حركات مرتبطة به.</p>
                <div className="flex gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">إلغاء</button>
                    <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors">نعم، حذف</button>
                </div>
            </div>
        </div>
      )}

      {/* Check Registration Modal */}
      {isCheckModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                        <ScrollText size={20} className="text-purple-500" />
                        تسجيل شيك وارد
                    </h3>
                    <button onClick={() => setIsCheckModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmitCheck} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">رقم الشيك</label>
                            <input required type="text" value={checkData.checkNumber} onChange={(e) => setCheckData({...checkData, checkNumber: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-purple-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">البنك المسحوب عليه</label>
                            <input required type="text" value={checkData.bankName} onChange={(e) => setCheckData({...checkData, bankName: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-purple-500 focus:outline-none" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تاريخ الاستحقاق</label>
                        <input required type="date" value={checkData.dueDate} onChange={(e) => setCheckData({...checkData, dueDate: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-purple-500 focus:outline-none" />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">اسم العميل / الساحب</label>
                        <input required type="text" value={checkData.clientName} onChange={(e) => setCheckData({...checkData, clientName: e.target.value})} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-purple-500 focus:outline-none" />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">قيمة الشيك</label>
                        <div className="flex gap-2">
                            <input required type="number" step="0.01" value={checkData.amount} onChange={(e) => setCheckData({...checkData, amount: e.target.value})} className="flex-1 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-purple-500 focus:outline-none font-bold" />
                            <select value={checkCurrency} onChange={(e) => setCheckCurrency(e.target.value as Currency)} className="w-24 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-slate-800 dark:text-white text-sm focus:border-purple-500 focus:outline-none font-bold">
                                <option value="JOD">JOD</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="ILS">ILS</option>
                                <option value="SAR">SAR</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-[#0f172a] p-3 rounded border border-dashed border-slate-300 dark:border-slate-700">
                        <div>
                             <label className="block text-[10px] text-slate-500 mb-1 flex items-center gap-1"><Coins size={10}/> سعر الصرف</label>
                             <input type="number" step="any" value={checkExchangeRate} onChange={(e) => setCheckExchangeRate(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-slate-800 dark:text-white text-sm focus:border-purple-500 focus:outline-none" />
                        </div>
                         <div>
                             <label className="block text-[10px] text-emerald-600 dark:text-emerald-500 mb-1 font-bold">المعادل (JOD)</label>
                             <div className="w-full bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                {(Number(checkData.amount) * (parseFloat(checkExchangeRate) || 0)).toFixed(2)}
                             </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg mt-2 transition-colors shadow-lg shadow-purple-900/20">
                        إيداع الشيك
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default TreasuryList;