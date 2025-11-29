
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { UserRole, User, NavPage } from '../types';
import { Plus, Search, Edit, Trash2, Shield, User as UserIcon, X, Key, CheckSquare, Square } from 'lucide-react';

const UsersList: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, showNotification, currentUser } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<NavPage[]>([]);
  
  // Delete State
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PAGE_LABELS: Record<NavPage, string> = {
      [NavPage.DASHBOARD]: 'لوحة التحكم',
      [NavPage.BOOKINGS]: 'إدارة الحجوزات',
      [NavPage.ITINERARIES]: 'عروض الأسعار',
      [NavPage.TASKS]: 'المهام والمتابعة',
      [NavPage.REPORTS]: 'التقارير المالية',
      [NavPage.AGENTS]: 'الوكلاء والموردين',
      [NavPage.INVOICES]: 'العملاء والديون',
      [NavPage.EXPENSES]: 'المصروفات',
      [NavPage.TREASURY]: 'الخزينة والبنوك',
      [NavPage.INVENTORY]: 'المخزون',
      [NavPage.AI_ADVISOR]: 'المساعد المالي الذكي', 
      [NavPage.EXCHANGE_RATES]: 'أسعار الصرف', 
      [NavPage.USERS]: 'إدارة المستخدمين',
      [NavPage.AUDIT_LOG]: 'سجل الحركات',
      [NavPage.PROFILE]: 'الملف الشخصي',
      [NavPage.GUIDE]: 'دليل الاستخدام',
      [NavPage.SETTINGS]: 'إعدادات النظام'
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('Employee');
    setIsActive(true);
    // Default permissions for new user (Dashboard only)
    setSelectedPermissions([NavPage.DASHBOARD]);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password || '');
    setRole(user.role);
    setIsActive(user.isActive);
    setSelectedPermissions(user.permissions || []);
    setIsModalOpen(true);
  };

  const togglePermission = (page: NavPage) => {
      if (selectedPermissions.includes(page)) {
          setSelectedPermissions(prev => prev.filter(p => p !== page));
      } else {
          setSelectedPermissions(prev => [...prev, page]);
      }
  };

  const selectAllPermissions = () => {
      setSelectedPermissions(Object.values(NavPage).filter(p => p !== NavPage.PROFILE));
  };

  const deselectAllPermissions = () => {
      setSelectedPermissions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      updateUser(editingId, { name, username, password, role, isActive, permissions: selectedPermissions });
      showNotification('تم تحديث بيانات المستخدم بنجاح', 'success');
    } else {
        if (users.some(u => u.username === username)) {
            showNotification('اسم المستخدم موجود مسبقاً', 'error');
            return;
        }
      addUser({ name, username, password, role, isActive, permissions: selectedPermissions });
      showNotification('تم إضافة المستخدم الجديد بنجاح', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setUserToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDeleteId) {
        // Prevent deleting the last Admin
        const admins = users.filter(u => u.role === 'Admin');
        const isTargetAdmin = users.find(u => u.id === userToDeleteId)?.role === 'Admin';
        
        if (isTargetAdmin && admins.length <= 1) {
            showNotification('لا يمكن حذف المدير الوحيد في النظام', 'error');
            setIsDeleteModalOpen(false);
            return;
        }

      deleteUser(userToDeleteId);
      showNotification('تم حذف المستخدم بنجاح', 'success');
      setIsDeleteModalOpen(false);
      setUserToDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Shield className="text-cyan-600 dark:text-cyan-400" />
                إدارة المستخدمين
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">إدارة صلاحيات الموظفين والوصول للنظام</p>
        </div>
        {currentUser?.role === 'Admin' && (
            <button 
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-900/20"
            >
            <Plus size={18} />
            <span>إضافة مستخدم جديد</span>
            </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
         <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                <input 
                type="text" 
                placeholder="بحث باسم المستخدم أو الاسم..." 
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
                        <th className="px-6 py-4">اسم الموظف</th>
                        <th className="px-6 py-4">اسم المستخدم (Login)</th>
                        <th className="px-6 py-4">الصلاحية (Role)</th>
                        <th className="px-6 py-4">الحالة</th>
                        <th className="px-6 py-4 text-center">إجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <div className="bg-slate-200 dark:bg-slate-800 p-1.5 rounded-full text-slate-500 dark:text-slate-400">
                                    <UserIcon size={14} />
                                </div>
                                {user.name}
                            </td>
                            <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{user.username}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs border ${user.role === 'Admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`flex items-center gap-1 text-xs font-bold ${user.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-red-500 dark:bg-red-400'}`}></div>
                                    {user.isActive ? 'نشط' : 'معطل'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {currentUser?.role === 'Admin' && (
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleEdit(user)} className="p-1.5 bg-slate-200 dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 rounded hover:bg-cyan-600 hover:text-white transition-colors">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="p-1.5 bg-slate-200 dark:bg-slate-700 text-red-500 dark:text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>

      {/* Create/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="bg-slate-50 dark:bg-[#0f172a] p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 z-10">
                    <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                        <UserIcon className="text-cyan-600 dark:text-cyan-400" size={20} />
                        {editingId ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">اسم الموظف *</label>
                        <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" placeholder="الاسم الكامل" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">اسم المستخدم (Login) *</label>
                             <input required type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" placeholder="username" />
                        </div>
                         <div>
                             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Key size={12}/> كلمة المرور *</label>
                             <input required={!editingId} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none" placeholder="••••••" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الصلاحية (Role)</label>
                            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-cyan-500 focus:outline-none">
                                <option value="Employee">موظف (Employee)</option>
                                <option value="Admin">مدير (Admin)</option>
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">الحالة</label>
                             <button type="button" onClick={() => setIsActive(!isActive)} className={`w-full p-2 rounded border flex items-center justify-center gap-2 transition-colors ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                 {isActive ? 'نشط (Active)' : 'معطل (Inactive)'}
                             </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                         <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><Shield size={16} className="text-cyan-600"/> الصلاحيات (Permissions)</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={selectAllPermissions} className="text-[10px] text-cyan-600 hover:underline">تحديد الكل</button>
                                <button type="button" onClick={deselectAllPermissions} className="text-[10px] text-red-500 hover:underline">إلغاء الكل</button>
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                            {Object.values(NavPage).filter(p => p !== NavPage.PROFILE).map((page) => (
                                <label key={page} className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-all ${selectedPermissions.includes(page) ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800' : 'bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                    <div onClick={(e) => { e.preventDefault(); togglePermission(page); }}>
                                        {selectedPermissions.includes(page) ? <CheckSquare size={18} className="text-cyan-600 dark:text-cyan-400" /> : <Square size={18} className="text-slate-400" />}
                                    </div>
                                    <span className={`text-xs ${selectedPermissions.includes(page) ? 'text-slate-800 dark:text-white font-medium' : 'text-slate-500 dark:text-slate-400'}`}>{PAGE_LABELS[page]}</span>
                                </label>
                            ))}
                         </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-[#1e293b]">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg transition-colors">إلغاء</button>
                        <button type="submit" className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors">{editingId ? 'حفظ التعديلات' : 'إضافة المستخدم'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/90 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-6 text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200 dark:border-red-900/50">
                    <Trash2 size={24} />
                </div>
                <h3 className="text-slate-800 dark:text-white text-lg font-bold mb-2">تأكيد الحذف</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.</p>
                <div className="flex gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg transition-colors">إلغاء</button>
                    <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors">نعم، حذف</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default UsersList;
