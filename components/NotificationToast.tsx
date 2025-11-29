import React from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useData } from '../context/DataContext';

const NotificationToast: React.FC = () => {
  const { notification } = useData();

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={20} />;
      case 'error': return <XCircle className="text-red-600 dark:text-red-400" size={20} />;
      case 'info': return <Info className="text-cyan-600 dark:text-cyan-400" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success': return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-500/50 text-emerald-800 dark:text-white';
      case 'error': return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-500/50 text-red-800 dark:text-white';
      case 'info': return 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-500/50 text-cyan-800 dark:text-white';
    }
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-slide-down">
      <div className={`flex items-center gap-3 px-6 py-3 rounded-full border backdrop-blur-md shadow-2xl ${getBgColor()}`}>
        {getIcon()}
        <span className="text-sm font-medium">{notification.message}</span>
      </div>
    </div>
  );
};

export default NotificationToast;