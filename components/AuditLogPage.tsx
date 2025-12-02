
import React from 'react';
import { useData } from '../context/DataContext';
import { ShieldAlert, Search, Clock, User } from 'lucide-react';

const AuditLogPage: React.FC = () => {
  const { auditLogs, currentUser } = useData();

  if (currentUser?.role !== 'Admin') {
      return <div className="p-10 text-center text-red-500">ليس لديك صلاحية الوصول لهذه الصفحة.</div>;
  }

  const getActionColor = (action: string) => {
      if (action.includes('DELETE')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      if (action.includes('UPDATE')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      if (action.includes('ADD')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ShieldAlert className="text-cyan-600 dark:text-cyan-400" />
                سجل الحركات (Audit Log)
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">تتبع العمليات الحساسة والتعديلات في النظام</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-100 dark:bg-[#0f172a] text-cyan-600 dark:text-cyan-400 text-xs uppercase">
                    <tr>
                        <th className="px-6 py-4">التوقيت</th>
                        <th className="px-6 py-4">المستخدم</th>
                        <th className="px-6 py-4">الحدث</th>
                        <th className="px-6 py-4">الكيان</th>
                        <th className="px-6 py-4 w-1/2">التفاصيل</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-mono flex items-center gap-2 whitespace-nowrap">
                                <Clock size={12}/> {new Date(log.timestamp).toLocaleString('en-GB')}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                <div className="flex items-center gap-2"><User size={14}/> {log.performedBy}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold border border-transparent ${getActionColor(log.action)}`}>
                                    {log.action}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                                {log.entityType}
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed text-xs">
                                {log.details}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {auditLogs.length === 0 && (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                    سجل الحركات فارغ حالياً.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
