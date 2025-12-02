
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Task } from '../types';
import { CheckSquare, Plus, Calendar, User, Trash2, Edit, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

const TasksManager: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask, showNotification, users, currentUser } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [assignedTo, setAssignedTo] = useState('');

  // Filter State
  const [filter, setFilter] = useState<'All' | 'My' | 'Pending'>('Pending');

  const filteredTasks = tasks.filter(task => {
      if (filter === 'My' && task.assignedTo !== currentUser?.username) return false;
      if (filter === 'Pending' && task.status !== 'Pending') return false;
      return true;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDueDate(new Date().toISOString().split('T')[0]);
    setPriority('Medium');
    setAssignedTo(currentUser?.username || '');
    setIsModalOpen(true);
  };

  const handleEdit = (task: Task) => {
      setEditingId(task.id);
      setTitle(task.title);
      setDescription(task.description || '');
      setDueDate(task.dueDate);
      setPriority(task.priority);
      setAssignedTo(task.assignedTo || '');
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingId) {
          updateTask(editingId, { title, description, dueDate, priority, assignedTo });
          showNotification('تم تحديث المهمة', 'success');
      } else {
          addTask({ title, description, dueDate, priority, assignedTo, status: 'Pending' });
          showNotification('تم إضافة المهمة', 'success');
      }
      setIsModalOpen(false);
  };

  const toggleStatus = (task: Task) => {
      const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
      updateTask(task.id, { status: newStatus });
  };

  const getPriorityColor = (p: string) => {
      switch(p) {
          case 'High': return 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400';
          case 'Medium': return 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400';
          case 'Low': return 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
          default: return 'bg-slate-100 text-slate-600';
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CheckSquare className="text-cyan-600 dark:text-cyan-400" />
                إدارة المهام والمتابعة
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">تنظيم العمل ومتابعة طلبات العملاء</p>
        </div>
        <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20"
        >
          <Plus size={18} />
          <span>مهمة جديدة</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setFilter('Pending')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'Pending' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>قيد التنفيذ</button>
          <button onClick={() => setFilter('My')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'My' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>مهامي فقط</button>
          <button onClick={() => setFilter('All')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === 'All' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>الكل</button>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => (
              <div key={task.id} className={`bg-white dark:bg-[#1e293b] p-5 rounded-xl border shadow-sm hover:shadow-md transition-all group ${task.status === 'Completed' ? 'border-emerald-200 dark:border-emerald-900/30 opacity-75' : 'border-slate-200 dark:border-slate-800'}`}>
                  <div className="flex justify-between items-start mb-3">
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(task.priority)}`}>
                          {task.priority === 'High' ? 'عالي' : task.priority === 'Medium' ? 'متوسط' : 'منخفض'}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(task)} className="p-1 text-slate-400 hover:text-cyan-600"><Edit size={14}/></button>
                          <button onClick={() => deleteTask(task.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                      </div>
                  </div>
                  
                  <h3 className={`font-bold text-lg mb-2 ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                      {task.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[40px]">
                      {task.description || 'لا يوجد وصف'}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                              <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString('en-GB')}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                              <User size={12} /> {task.assignedTo}
                          </div>
                      </div>
                      <button onClick={() => toggleStatus(task)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {task.status === 'Completed' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                          {task.status === 'Completed' ? 'مكتمل' : 'إنجاز'}
                      </button>
                  </div>
              </div>
          ))}
          
          {filteredTasks.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">
                  <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
                  <p>لا توجد مهام لعرضها</p>
              </div>
          )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                    {editingId ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">العنوان</label>
                        <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">التفاصيل</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none h-24 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تاريخ الاستحقاق</label>
                            <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الأولوية</label>
                            <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none">
                                <option value="High">عالي</option>
                                <option value="Medium">متوسط</option>
                                <option value="Low">منخفض</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">تعيين إلى</label>
                        <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none">
                            <option value="">اختر موظف...</option>
                            {users.map(u => <option key={u.id} value={u.username}>{u.name}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">إلغاء</button>
                        <button type="submit" className="flex-1 py-2.5 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors">حفظ</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default TasksManager;
