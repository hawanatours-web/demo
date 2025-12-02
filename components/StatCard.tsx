import React from 'react';
import { StatCardProps } from '../types';

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, color, currencyLabel = 'JOD' }) => {
  
  // Mapping logic for progress bar colors
  const getProgressBarColor = () => {
    switch (color) {
      case 'blue': return 'bg-cyan-500 dark:bg-cyan-400';
      case 'green': return 'bg-emerald-500 dark:bg-emerald-400';
      case 'red': return 'bg-rose-500 dark:bg-rose-400';
      case 'purple': return 'bg-purple-500 dark:bg-purple-400';
      case 'yellow': return 'bg-amber-500 dark:bg-amber-400';
      default: return 'bg-cyan-500 dark:bg-cyan-400';
    }
  };

  // Mock calculation for progress bar width based on trend or random for demo
  const progressWidth = trend ? Math.min(Math.abs(trend) * 5, 100) : 65; 

  return (
    <div className="bg-white dark:bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
        {trend !== undefined && (
           <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 ${trend > 0 ? 'text-emerald-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
             {trend > 0 ? '+' : ''}{trend}%
           </span>
        )}
      </div>

      <div className="flex items-end gap-2 mb-4">
         <span className="text-slate-500 dark:text-slate-400 text-xs mb-1 font-light">{currencyLabel}</span>
         <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</p>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>الهدف</span>
            <span>{progressWidth}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div 
                className={`h-1.5 rounded-full transition-all duration-1000 ${getProgressBarColor()}`} 
                style={{ width: `${progressWidth}%` }}
            ></div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;