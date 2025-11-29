import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { analyzeFinancialQuery } from '../services/geminiService';
import { useData } from '../context/DataContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const AIFinancialAdvisor: React.FC = () => {
  const { bookings, transactions, stats } = useData();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: 'مرحباً بك! أنا المحلل الذكي لنظام هوانا. يمكنك سؤالي عن أداء المبيعات، تحليل المصروفات، أو نصائح لتحسين الربحية.',
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Prepare Live Context Data
    const contextData = JSON.stringify({
      summary: "HAWANA Tourism company accounting system.",
      currentStats: stats,
      recentBookings: bookings.slice(0, 10), // Give AI last 10 bookings
      recentTransactions: transactions.slice(0, 10)
    });

    const responseText = await analyzeFinancialQuery(userMessage.text, contextData);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: responseText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Sparkles className="text-cyan-600 dark:text-cyan-400" />
          المحلل الذكي
        </h2>
        <p className="text-slate-500 dark:text-slate-400">اسأل الذكاء الاصطناعي عن بيانات شركتك المالية للحصول على رؤى فورية.</p>
      </div>

      <div className="flex-1 bg-white dark:bg-[#1e293b] rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-[#0f172a]/50 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              }`}>
                {msg.role === 'user' ? <User size={20} className="text-slate-600 dark:text-slate-300" /> : <Bot size={20} />}
              </div>
              
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-tr-none border border-slate-300 dark:border-slate-600' 
                  : 'bg-cyan-50 dark:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-800 text-slate-800 dark:text-cyan-100 rounded-tl-none shadow-sm'
              }`}>
                <p className="leading-relaxed whitespace-pre-line text-sm md:text-base">{msg.text}</p>
                <span className={`text-[10px] mt-2 block opacity-60 ${msg.role === 'user' ? 'text-left' : 'text-right'}`}>
                  {msg.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/20">
                    <Bot size={20} />
                </div>
                <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                    <Loader2 className="animate-spin text-cyan-600 dark:text-cyan-400" size={18} />
                    <span className="text-slate-500 dark:text-slate-400 text-sm">جارٍ التحليل...</span>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-[#1e293b] border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب سؤالك هنا..."
                className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-3 pr-4 pl-12 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all placeholder-slate-400 dark:placeholder-slate-600"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-cyan-600 text-white px-6 rounded-xl hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-cyan-600/20"
            >
              <Send size={20} className={document.dir === 'rtl' ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFinancialAdvisor;