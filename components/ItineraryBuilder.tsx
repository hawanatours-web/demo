
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Itinerary, ItineraryDay, Currency, BookingStatus } from '../types';
import { Map, Plus, Trash2, Printer, Save, X, Edit, Image as ImageIcon, FileText, Eye, AlertTriangle, Briefcase, CheckCircle2 } from 'lucide-react';

const ItineraryBuilder: React.FC = () => {
  const { itineraries, addItinerary, deleteItinerary, showNotification, companySettings, systemCurrency, addBooking } = useData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState(3);
  const [price, setPrice] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [days, setDays] = useState<ItineraryDay[]>([]);

  const handleOpenCreate = () => {
    setTitle('');
    setClientName('');
    setDestination('');
    setDuration(3);
    setPrice('');
    setCurrency('USD');
    setInclusions('');
    setExclusions('');
    
    // Initialize days
    const initialDays = Array.from({ length: 3 }, (_, i) => ({
        day: i + 1,
        title: `اليوم ${i + 1}`,
        description: '',
        imageUrl: ''
    }));
    setDays(initialDays);
    setIsModalOpen(true);
  };

  const handleDurationChange = (newDuration: number) => {
      setDuration(newDuration);
      setDays(prev => {
          const newDays = [...prev];
          if (newDuration > prev.length) {
              for (let i = prev.length; i < newDuration; i++) {
                  newDays.push({ day: i + 1, title: `اليوم ${i + 1}`, description: '', imageUrl: '' });
              }
          } else {
              newDays.splice(newDuration);
          }
          return newDays;
      });
  };

  const updateDay = (index: number, field: keyof ItineraryDay, value: string) => {
      const newDays = [...days];
      newDays[index] = { ...newDays[index], [field]: value };
      setDays(newDays);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      addItinerary({
          title,
          clientName,
          destination,
          duration,
          price: Number(price),
          currency,
          days,
          inclusions,
          exclusions
      });
      showNotification('تم إنشاء عرض السعر بنجاح', 'success');
      setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
      setItemToDelete(id);
      setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
      if (itemToDelete) {
          deleteItinerary(itemToDelete);
          showNotification('تم حذف عرض السعر بنجاح', 'success');
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
      }
  };

  // --- Convert Itinerary to Booking ---
  const handleConvertToBooking = (itinerary: Itinerary) => {
      const bookingAmount = itinerary.price || 0;
      // Assume cost is 0 initially, user updates it in Booking Edit
      const bookingCost = 0; 
      
      const newBooking = {
          clientName: itinerary.clientName,
          destination: itinerary.destination,
          date: new Date().toISOString().split('T')[0],
          type: 'Tourism', // Default to Tourism package
          status: BookingStatus.PENDING,
          amount: bookingAmount,
          paidAmount: 0,
          paymentStatus: 'Unpaid',
          cost: bookingCost,
          profit: bookingAmount - bookingCost,
          serviceCount: 1,
          // Create a generic service item for the package
          services: [{
              id: `s-${Date.now()}`,
              type: 'Tour',
              quantity: 1,
              costPrice: 0,
              sellingPrice: bookingAmount,
              details: itinerary.title,
              supplier: 'General', // Default
              date: new Date().toISOString().split('T')[0]
          }],
          passengers: [], // Empty initially
          payments: [],
          notes: `تم التحويل من عرض سعر: ${itinerary.title}\n\n[يشمل]:\n${itinerary.inclusions}\n\n[لا يشمل]:\n${itinerary.exclusions}`
      };

      // @ts-ignore - Ignoring strict type check for partial matches in quick conversion
      addBooking(newBooking);
      showNotification('تم تحويل العرض إلى ملف حجز بنجاح! يرجى مراجعة صفحة الحجوزات.', 'success');
  };

  const handlePrint = (itinerary: Itinerary) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const showLogo = companySettings.logoUrl && (companySettings.logoVisibility === 'both' || companySettings.logoVisibility === 'print');
      const logoHtml = showLogo 
          ? `<img src="${companySettings.logoUrl}" class="header-logo-img" />`
          : `<div class="header-logo-text">${companySettings.logoText}</div>`;

      const coverLogoHtml = showLogo 
          ? `<img src="${companySettings.logoUrl}" class="cover-logo-img" />`
          : `<div class="cover-logo-text">${companySettings.logoText}</div>`;

      const daysHtml = itinerary.days.map((d, i) => `
        <div class="timeline-item">
            <div class="timeline-marker">${d.day}</div>
            <div class="timeline-content">
                <h3 class="day-title">${d.title}</h3>
                <p class="day-desc">${d.description || 'لا توجد تفاصيل.'}</p>
                ${d.imageUrl ? `<img src="${d.imageUrl}" class="day-image" />` : ''}
            </div>
        </div>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <title>${itinerary.title}</title>
            <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
            <style>
                @page { size: A4; margin: 0; }
                
                :root {
                    --primary: #0891b2; /* Cyan 600 */
                    --secondary: #0f172a; /* Slate 900 */
                    --text: #334155;
                    --bg: #ffffff;
                    --light-bg: #f8fafc;
                }

                body {
                    font-family: 'Cairo', sans-serif;
                    margin: 0;
                    padding: 0;
                    background: var(--bg);
                    color: var(--text);
                    -webkit-print-color-adjust: exact;
                    direction: rtl;
                }

                /* --- Cover Page --- */
                .cover-page {
                    height: 297mm;
                    width: 210mm;
                    position: relative;
                    background-image: url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop');
                    background-size: cover;
                    background-position: center;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    color: white;
                    overflow: hidden;
                    page-break-after: always;
                }
                
                .cover-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.95));
                    z-index: 1;
                }

                .cover-content {
                    position: relative;
                    z-index: 2;
                    padding: 60px 50px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .cover-logo { margin-bottom: 80px; }
                .cover-logo-img { max-height: 120px; filter: brightness(0) invert(1); object-fit: contain; }
                .cover-logo-text { font-size: 42px; font-weight: 900; letter-spacing: 2px; }

                .cover-title-box {
                    border-right: 8px solid var(--primary);
                    padding-right: 40px;
                }

                .cover-subtitle {
                    font-size: 22px;
                    font-weight: 300;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    margin-bottom: 15px;
                    color: #cbd5e1;
                }

                .cover-title {
                    font-size: 68px;
                    font-weight: 900;
                    line-height: 1.1;
                    margin: 0;
                    text-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }

                .cover-destination {
                    font-size: 36px;
                    color: var(--primary); /* Cyan */
                    font-weight: 700;
                    margin-top: 15px;
                }

                .cover-footer {
                    margin-top: auto;
                    display: flex;
                    justify-content: space-between;
                    border-top: 1px solid rgba(255,255,255,0.2);
                    padding-top: 40px;
                }

                .cover-info-item h4 { margin: 0 0 5px; font-size: 12px; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; }
                .cover-info-item p { margin: 0; font-size: 18px; font-weight: 600; }

                /* --- Content Pages --- */
                .page {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 40px 50px;
                    box-sizing: border-box;
                    background: white;
                    position: relative;
                    page-break-after: always;
                }

                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 20px;
                    margin-bottom: 40px;
                }

                .header-logo .header-logo-img { height: 50px; object-fit: contain; }
                .header-logo .header-logo-text { font-size: 24px; font-weight: 800; color: var(--primary); }
                .header-contact { font-size: 10px; color: #64748b; text-align: left; line-height: 1.5; }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 30px;
                }
                .section-icon {
                    width: 40px;
                    height: 40px;
                    background: var(--primary);
                    color: white;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 20px;
                }
                .section-title {
                    font-size: 24px;
                    font-weight: 800;
                    color: var(--secondary);
                }

                /* --- Timeline --- */
                .timeline {
                    position: relative;
                    padding-right: 20px;
                }
                .timeline::before {
                    content: '';
                    position: absolute;
                    right: 14px;
                    top: 15px;
                    bottom: 0;
                    width: 2px;
                    background: #e2e8f0;
                }

                .timeline-item {
                    position: relative;
                    padding-right: 50px;
                    padding-bottom: 40px;
                    break-inside: avoid;
                }

                .timeline-marker {
                    position: absolute;
                    right: -9px;
                    top: 0;
                    width: 48px;
                    height: 48px;
                    background: var(--primary);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 18px;
                    border: 6px solid white;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    z-index: 1;
                }

                .timeline-content {
                    background: var(--light-bg);
                    border-radius: 16px;
                    padding: 25px;
                    border: 1px solid #e2e8f0;
                }

                .day-title {
                    margin: 0 0 10px;
                    font-size: 18px;
                    color: var(--secondary);
                    font-weight: 700;
                }

                .day-desc {
                    font-size: 13px;
                    color: #475569;
                    line-height: 1.8;
                    margin: 0;
                    white-space: pre-line;
                }

                .day-image {
                    margin-top: 20px;
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                }

                /* --- Pricing & Info --- */
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                }

                .info-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    background: white;
                }

                .card-header {
                    padding: 15px 20px;
                    font-weight: 700;
                    font-size: 14px;
                    color: white;
                }
                .card-header.green { background: #059669; }
                .card-header.red { background: #e11d48; }

                .card-body {
                    padding: 25px;
                    font-size: 12px;
                    line-height: 1.8;
                    color: #334155;
                    white-space: pre-line;
                }

                .price-section {
                    background: #1e293b;
                    color: white;
                    border-radius: 20px;
                    padding: 50px;
                    text-align: center;
                    margin-top: 40px;
                    position: relative;
                    overflow: hidden;
                    background-image: radial-gradient(circle at top right, #334155 0%, #1e293b 100%);
                }
                
                .price-label {
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    opacity: 0.7;
                    margin-bottom: 15px;
                }
                
                .price-amount {
                    font-size: 56px;
                    font-weight: 900;
                    color: #22d3ee; /* Cyan 400 */
                    line-height: 1;
                }
                
                .price-currency {
                    font-size: 24px;
                    color: white;
                    font-weight: 400;
                    margin-right: 10px;
                }

                .page-footer {
                    position: absolute;
                    bottom: 30px;
                    left: 50px;
                    right: 50px;
                    border-top: 1px solid #e2e8f0;
                    padding-top: 15px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 10px;
                    color: #94a3b8;
                }
            </style>
        </head>
        <body>
            
            <!-- COVER PAGE -->
            <div class="cover-page">
                <div class="cover-overlay"></div>
                <div class="cover-content">
                    <div class="cover-logo">${coverLogoHtml}</div>
                    
                    <div class="cover-title-box">
                        <div class="cover-subtitle">ITINERARY PROPOSAL</div>
                        <h1 class="cover-title">${itinerary.title}</h1>
                        <div class="cover-destination">${itinerary.destination}</div>
                    </div>

                    <div class="cover-footer">
                        <div class="cover-info-item">
                            <h4>PREPARED FOR</h4>
                            <p>${itinerary.clientName}</p>
                        </div>
                        <div class="cover-info-item">
                            <h4>DURATION</h4>
                            <p>${itinerary.duration} Days</p>
                        </div>
                        <div class="cover-info-item">
                            <h4>DATE</h4>
                            <p>${new Date().toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DETAILS PAGE -->
            <div class="page">
                <div class="page-header">
                    <div class="header-logo">${logoHtml}</div>
                    <div class="header-contact">
                        <strong>${companySettings.nameEn}</strong><br>
                        ${companySettings.phone}<br>
                        ${companySettings.email}
                    </div>
                </div>

                <div class="section-header">
                    <div class="section-icon">1</div>
                    <div class="section-title">تفاصيل الرحلة (Program Details)</div>
                </div>
                
                <div class="timeline">
                    ${daysHtml}
                </div>

                <div class="page-footer">
                    <div>${itinerary.title}</div>
                    <div>Page 1</div>
                </div>
            </div>

            <!-- PRICING PAGE -->
            <div class="page" style="min-height: auto;">
                <div class="page-header">
                    <div class="header-logo">${logoHtml}</div>
                </div>

                <div class="section-header">
                    <div class="section-icon">2</div>
                    <div class="section-title">التكلفة والشروط (Pricing & Terms)</div>
                </div>

                <div class="info-grid">
                    <div class="info-card">
                        <div class="card-header green">ما يشمله العرض (Inclusions)</div>
                        <div class="card-body">${itinerary.inclusions || 'لا يوجد تفاصيل إضافية.'}</div>
                    </div>
                    <div class="info-card">
                        <div class="card-header red">ما لا يشمله العرض (Exclusions)</div>
                        <div class="card-body">${itinerary.exclusions || 'لا يوجد تفاصيل إضافية.'}</div>
                    </div>
                </div>

                <div class="price-section">
                    <div class="price-label">Total Package Price</div>
                    <div class="price-amount">
                        ${itinerary.price ? itinerary.price.toLocaleString('en-US') : '---'}
                        <span class="price-currency">${itinerary.currency}</span>
                    </div>
                    <p style="font-size: 12px; opacity: 0.6; margin-top: 20px;">* الأسعار خاضعة للتوافر وقابلة للتغيير</p>
                </div>

                <div class="page-footer">
                    <div>${companySettings.nameEn}</div>
                    <div>Thank You!</div>
                </div>
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
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Map className="text-cyan-600 dark:text-cyan-400" />
                صانع عروض الأسعار
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">تصميم برامج سياحية جذابة واحترافية للعملاء</p>
        </div>
        <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20"
        >
          <Plus size={18} />
          <span>إنشاء عرض جديد</span>
        </button>
      </div>

      {/* Itinerary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itineraries.map(item => (
              <div key={item.id} className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden group hover:border-cyan-500 transition-all">
                  <div className="h-32 bg-slate-100 dark:bg-slate-800 relative">
                      <img 
                        src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop" 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/50 backdrop-blur px-2 py-1 rounded text-xs font-bold text-slate-800 dark:text-white">
                          {item.duration} أيام
                      </div>
                  </div>
                  <div className="p-5">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-4">
                          <Map size={14} /> {item.destination} • {item.clientName}
                      </p>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {item.price ? item.price.toLocaleString('en-US') : '---'} {item.currency}
                          </span>
                          <div className="flex gap-2">
                              <button onClick={() => handleConvertToBooking(item)} className="p-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors" title="تحويل إلى ملف حجز">
                                  <Briefcase size={16} />
                              </button>
                              <button onClick={() => handlePrint(item)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900 hover:text-cyan-600 transition-colors" title="طباعة / معاينة">
                                  <Printer size={16} />
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="p-2 bg-slate-100 dark:bg-slate-700 text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors" title="حذف">
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          ))}
          {itineraries.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <Map size={48} className="mx-auto mb-4 opacity-20" />
                  <p>لا توجد عروض أسعار حالياً. ابدأ بإنشاء عرضك الأول!</p>
              </div>
          )}
      </div>

      {/* Builder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-4xl rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl my-8">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Edit size={24} className="text-cyan-600" />
                        تصميم العرض السياحي
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={24} /></button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">عنوان العرض *</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:border-cyan-500 focus:outline-none" placeholder="مثال: بكج شهر عسل المالديف" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">اسم العميل</label>
                            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">الوجهة</label>
                            <input type="text" value={destination} onChange={e => setDestination(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">المدة (أيام)</label>
                                <input type="number" min="1" max="30" value={duration} onChange={e => handleDurationChange(Number(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:border-cyan-500 focus:outline-none" />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">السعر الإجمالي</label>
                                <div className="flex gap-2">
                                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:border-cyan-500 focus:outline-none" placeholder="0.00" />
                                    <select value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 text-sm font-bold dark:text-white">
                                        <option value="USD">USD</option>
                                        <option value="JOD">JOD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Days Builder */}
                    <div className="mb-8">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">البرنامج اليومي</h4>
                        <div className="space-y-4">
                            {days.map((day, idx) => (
                                <div key={idx} className="bg-slate-50 dark:bg-[#0f172a]/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded">اليوم {day.day}</div>
                                        <input 
                                            type="text" 
                                            value={day.title} 
                                            onChange={e => updateDay(idx, 'title', e.target.value)} 
                                            className="flex-1 bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-cyan-500 focus:outline-none text-sm font-bold dark:text-white"
                                            placeholder="عنوان اليوم (مثال: الوصول والاستقبال)" 
                                        />
                                    </div>
                                    <textarea 
                                        value={day.description} 
                                        onChange={e => updateDay(idx, 'description', e.target.value)}
                                        className="w-full bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm dark:text-slate-300 focus:border-cyan-500 focus:outline-none h-20 resize-none"
                                        placeholder="تفاصيل أحداث هذا اليوم..."
                                    ></textarea>
                                    <div className="mt-2 flex items-center gap-2">
                                        <ImageIcon size={14} className="text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={day.imageUrl || ''} 
                                            onChange={e => updateDay(idx, 'imageUrl', e.target.value)}
                                            className="flex-1 bg-transparent text-xs text-slate-500 focus:outline-none"
                                            placeholder="رابط صورة (اختياري)"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-emerald-600 mb-1">يشمل (Inclusions)</label>
                            <textarea value={inclusions} onChange={e => setInclusions(e.target.value)} className="w-full p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg dark:text-white focus:border-emerald-500 focus:outline-none h-32 resize-none" placeholder="- تذاكر الطيران الدولي&#10;- الاستقبال والتوديع" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-rose-600 mb-1">لا يشمل (Exclusions)</label>
                            <textarea value={exclusions} onChange={e => setExclusions(e.target.value)} className="w-full p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-lg dark:text-white focus:border-rose-500 focus:outline-none h-32 resize-none" placeholder="- المصاريف الشخصية&#10;- الإكراميات" />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors">إلغاء</button>
                        <button onClick={handleSubmit} className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 transition-colors flex justify-center items-center gap-2">
                            <Save size={18} /> حفظ العرض
                        </button>
                    </div>
                </div>
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
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">هل أنت متأكد من رغبتك في حذف هذا العرض؟ لا يمكن التراجع عن هذا الإجراء.</p>
                <div className="flex gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-lg transition-colors">إلغاء</button>
                    <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors">نعم، حذف</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryBuilder;
