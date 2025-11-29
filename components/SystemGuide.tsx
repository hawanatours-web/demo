
import React from 'react';
import { BookOpen, LayoutDashboard, Ticket, Users, Wallet, Building2, FileText, CreditCard, Shield, BrainCircuit, Map, CheckSquare, ShieldAlert, Plane, FileCheck } from 'lucide-react';

const SystemGuide: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-cyan-600 p-3 rounded-xl shadow-lg shadow-cyan-900/20">
            <BookOpen size={32} className="text-white" />
        </div>
        <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">دليل استخدام نظام هوانا</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">شرح تفصيلي لكافة وظائف النظام وكيفية إدارة العمليات المحاسبية والسياحية (محدث V2.4)</p>
        </div>
      </div>

      {/* Section: Introduction */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <LayoutDashboard className="text-cyan-600 dark:text-cyan-400" />
            1. لوحة التحكم (Dashboard)
        </h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
            تعتبر لوحة التحكم المركز الرئيسي للنظام. هنا يمكنك رؤية ملخص سريع لأداء الشركة:
        </p>
        <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 text-sm space-y-2">
            <li><strong className="text-slate-800 dark:text-white">البطاقات العلوية:</strong> تعرض إجمالي المبيعات، المبالغ المحصلة، والديون المتبقية (الذمم).</li>
            <li><strong className="text-slate-800 dark:text-white">جدول الرحلات الأسبوعي:</strong> يعرض الحجوزات القادمة خلال 7 أيام لسهولة المتابعة.</li>
            <li><strong className="text-slate-800 dark:text-white">المؤشرات:</strong> توضح نسبة تحقيق الأهداف وأكثر الوكلاء نشاطاً.</li>
            <li><strong className="text-slate-800 dark:text-white">تغيير العملة:</strong> يمكنك تغيير عملة العرض (JOD, USD, EUR...) من القائمة العلوية، وسيقوم النظام بتحويل كل الأرقام تلقائياً.</li>
        </ul>
      </div>

      {/* Section: Bookings */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Ticket className="text-cyan-600 dark:text-cyan-400" />
            2. إدارة الحجوزات (Bookings)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-3">
                    هذا هو الجزء الأهم في النظام. لإنشاء ملف حجز جديد:
                </p>
                <ol className="list-decimal list-inside text-slate-500 dark:text-slate-400 text-sm space-y-2">
                    <li>اضغط على زر <span className="text-cyan-600 dark:text-cyan-400 font-bold">"فتح ملف جديد"</span>.</li>
                    <li>أدخل بيانات العميل (الاسم ورقم الهاتف). سيتم استدعاء رقم الهاتف تلقائياً للعملاء المسجلين.</li>
                    <li>
                        <strong>بيانات المسافرين:</strong> يمكنك الآن تحديد اللقب (MR, MRS, INF, CHD...)، النوع (بالغ، طفل، رضيع)، وتحديد ما إذا تم <span className="text-emerald-600 font-bold">استلام الجواز</span> أم لا.
                    </li>
                    <li>
                        <strong>الخدمات:</strong> عند إضافة رحلة طيران، يمكنك تحديد <strong className="text-blue-600">وقت الإقلاع والوصول</strong> بدقة.
                    </li>
                    <li>يقوم النظام بحساب الربح آلياً بناءً على (سعر البيع - التكلفة).</li>
                </ol>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="text-slate-800 dark:text-white font-bold text-sm mb-2">ميزات إضافية:</h4>
                <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-300">
                    <li className="flex items-center gap-2"><Plane size={14} className="text-blue-500 dark:text-blue-400"/> <strong>تفاصيل الطيران:</strong> تظهر أوقات الرحلات بوضوح في الجدول.</li>
                    <li className="flex items-center gap-2"><FileCheck size={14} className="text-emerald-600 dark:text-emerald-400"/> <strong>استلام الجوازات:</strong> تتبع حالة جوازات السفر لكل مسافر.</li>
                    <li className="flex items-center gap-2"><CreditCard size={14} className="text-purple-600 dark:text-purple-400"/> <strong>المالية:</strong> عرض التكلفة والربح بشكل فوري بجانب كل خدمة.</li>
                </ul>
            </div>
        </div>
      </div>

      {/* Section: Itinerary Builder (NEW) */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Map className="text-cyan-600 dark:text-cyan-400" />
            3. صانع عروض الأسعار (Itinerary Builder) <span className="text-xs bg-cyan-100 text-cyan-600 px-2 rounded-full">جديد</span>
        </h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-3">
            أداة تسويقية قوية تتيح لك تصميم برامج سياحية احترافية وجذابة للعملاء قبل الحجز الفعلي:
        </p>
        <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 text-sm space-y-2">
            <li>إنشاء برنامج يومي (اليوم الأول، الثاني...) مع صور ووصف للأحداث.</li>
            <li>تحديد ما يشمله العرض (Inclusions) وما لا يشمله (Exclusions).</li>
            <li>تحديد السعر الإجمالي والعملة.</li>
            <li><strong>المخرجات:</strong> طباعة ملف PDF بتصميم "مجلة" احترافي يحتوي على غلاف وصور لإرساله للعميل.</li>
        </ul>
      </div>

      {/* Section: Task Management (NEW) */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <CheckSquare className="text-cyan-600 dark:text-cyan-400" />
            4. إدارة المهام (Task Manager / CRM) <span className="text-xs bg-cyan-100 text-cyan-600 px-2 rounded-full">جديد</span>
        </h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-3">
            نظام لمتابعة الأعمال اليومية وعدم نسيان طلبات العملاء:
        </p>
        <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 text-sm space-y-2">
            <li>تسجيل مهام جديدة (مثل: "متابعة فيزا العميل X" أو "تحصيل دفعة").</li>
            <li>تعيين المهام لموظفين محددين وتحديد تاريخ الاستحقاق والأولوية.</li>
            <li>تنبيهات ذكية تظهر تلقائياً عند اقتراب موعد المهمة.</li>
        </ul>
      </div>

      {/* Section: Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agents */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <Building2 className="text-rose-500 dark:text-rose-400" />
                5. الوكلاء والموردين
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <li>• النظام يسجل <strong className="text-rose-500 dark:text-rose-400">الذمم المستحقة للموردين</strong> تلقائياً عند إضافة أي خدمة.</li>
                <li>• يمكنك تحديد عملة خاصة لكل مورد (دولار، يورو..) وسيتم التحويل آلياً.</li>
                <li>• يمكنك تسجيل "سند صرف" لتسديد دفعات للموردين.</li>
            </ul>
          </div>

          {/* Clients */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <Users className="text-emerald-600 dark:text-emerald-400" />
                6. العملاء والذمم
            </h3>
             <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <li>• النظام يسجل <strong className="text-emerald-600 dark:text-emerald-400">الذمم على العملاء</strong> تلقائياً عند إنشاء حجز.</li>
                <li>• يمكنك تسجيل "سند قبض" (نقدي أو شيك) لتسديد الحساب.</li>
                <li>• يمكن استخراج "كشف حساب عميل" يوضح كافة الحركات.</li>
            </ul>
          </div>
      </div>

      {/* Section: Treasury & Expenses */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <CreditCard className="text-purple-600 dark:text-purple-400" />
                    7. الخزينة والبنوك
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    إدارة الأموال الفعلية. يمكنك تعريف:
                    <br/>- <strong>صناديق نقدية (Cash)</strong>.
                    <br/>- <strong>حسابات بنكية (Bank)</strong>.
                    <br/>- <strong>حافظة شيكات (Checks)</strong>.
                    <br/>أي عملية مالية في النظام تؤثر فوراً على رصيد الصندوق المختار.
                </p>
            </div>
             <div className="w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
             <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <Wallet className="text-amber-600 dark:text-amber-400" />
                    8. المصروفات
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    لتسجيل المصاريف التشغيلية (إيجار، رواتب، كهرباء).
                    يتم خصم هذه المصاريف من الخزينة وتقلل من صافي أرباح الشركة في التقارير.
                </p>
            </div>
        </div>
      </div>

      {/* Section: Advanced Features & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <BrainCircuit className="text-cyan-600 dark:text-cyan-400" />
                9. المساعد الذكي (AI Advisor)
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
                ميزة فريدة تمكنك من سؤال النظام بلغتك الطبيعية عن وضع الشركة المالي.
                <br/>مثال: <em>"كم إجمالي أرباحنا هذا الشهر؟"</em>
                <br/>يقوم الذكاء الاصطناعي بتحليل البيانات والإجابة فوراً.
            </p>
          </div>

           <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <ShieldAlert className="text-rose-600 dark:text-rose-400" />
                10. الأمان وسجل الحركات
            </h3>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2">
                <li><strong>المستخدمين:</strong> إضافة موظفين وتحديد صلاحياتهم بدقة.</li>
                <li><strong>سجل الحركات (Audit Log):</strong> <span className="text-xs bg-rose-100 text-rose-600 px-1.5 rounded">جديد</span> ميزة للمدير فقط تتيح تتبع كل عملية إضافة أو تعديل أو حذف تمت في النظام، مع ذكر اسم المستخدم والتوقيت والتفاصيل القديمة والجديدة.</li>
            </ul>
          </div>
      </div>

      <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-800">
        <p className="text-slate-500 text-sm">نظام هوانا للسياحة والسفر © 2025</p>
      </div>
    </div>
  );
};

export default SystemGuide;