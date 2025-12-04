import React, { useState } from 'react';
import { BotStatus, Recipient, Topic } from '../types';

interface BotConfigProps {
  botToken: string;
  setBotToken: (val: string) => void;
  recipients: Recipient[];
  toggleRecipient: (chatId: string) => void;
  addManualRecipient: (chatId: string) => void;
  scanForRecipients: () => void;
  status: BotStatus;
  toggleBot: () => void;
  secondsUntilNext: number;
  topic: Topic;
  setTopic: (t: Topic) => void;
  intervalMinutes: number;
  setIntervalMinutes: (m: number) => void;
}

const TOPICS: Topic[] = ['Random', 'Science', 'History', 'Nature', 'Space', 'Technology', 'Art', 'Psychology'];

export const BotConfig: React.FC<BotConfigProps> = ({
  botToken,
  setBotToken,
  recipients,
  toggleRecipient,
  addManualRecipient,
  scanForRecipients,
  status,
  toggleBot,
  secondsUntilNext,
  topic,
  setTopic,
  intervalMinutes,
  setIntervalMinutes
}) => {
  const isRunning = status !== BotStatus.IDLE;
  const [manualId, setManualId] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleManualAdd = () => {
    if (manualId) {
      addManualRecipient(manualId);
      setManualId('');
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    await scanForRecipients();
    setIsScanning(false);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-telegram" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configuration
        </h2>
        {isRunning && (
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full text-xs font-mono font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            ACTIVE
          </div>
        )}
      </div>

      <div className="space-y-4 flex-1">
        {/* Token Input */}
        <div>
          <label className="block text-slate-400 text-sm font-medium mb-1">Telegram Bot Token</label>
          <input
            type="text"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            disabled={isRunning}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-telegram focus:border-transparent outline-none disabled:opacity-50 font-mono"
            placeholder="123456789:ABCdefGHIjklMNOpqrs..."
          />
        </div>

        {/* Content Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-1">Topic</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value as Topic)}
              disabled={isRunning}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-telegram focus:border-transparent outline-none disabled:opacity-50 appearance-none"
            >
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-sm font-medium mb-1">Interval (min)</label>
            <input
              type="number"
              min="1"
              max="1440"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              disabled={isRunning}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-telegram focus:border-transparent outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <label className="block text-slate-400 text-sm font-medium mb-2 flex justify-between items-center">
            <span>Target Recipients</span>
            <button 
              onClick={handleScan} 
              disabled={isScanning || isRunning}
              className="text-xs text-telegram hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50"
              title="Adds new subscribers and removes those who blocked the bot"
            >
              {isScanning ? (
                <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Sync Subscribers
            </button>
          </label>
          
          <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden mb-2 max-h-32 overflow-y-auto">
             {recipients.length === 0 ? (
               <div className="p-4 text-center text-xs text-slate-600">
                 No recipients found. <br/> Click "Sync Subscribers" after someone starts the bot, or add manually.
               </div>
             ) : (
               <div className="divide-y divide-slate-800">
                 {recipients.map(r => (
                   <label key={r.chatId} className="flex items-center px-3 py-2 hover:bg-slate-800 cursor-pointer transition-colors">
                     <input 
                       type="checkbox" 
                       checked={r.selected} 
                       onChange={() => toggleRecipient(r.chatId)}
                       disabled={isRunning}
                       className="w-4 h-4 rounded border-slate-600 text-telegram focus:ring-telegram bg-slate-800"
                     />
                     <div className="ml-3 flex-1 min-w-0">
                       <div className="text-sm font-medium text-slate-200 truncate">{r.name}</div>
                       <div className="text-xs text-slate-500 font-mono truncate">{r.chatId} • {r.type}</div>
                     </div>
                   </label>
                 ))}
               </div>
             )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
              disabled={isRunning}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-telegram focus:border-transparent outline-none disabled:opacity-50 font-mono"
              placeholder="@channel or ID"
            />
            <button 
              onClick={handleManualAdd}
              disabled={!manualId || isRunning}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between mt-auto">
          <button
            onClick={toggleBot}
            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all shadow-lg flex items-center gap-2 ${
              isRunning
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                : 'bg-telegram hover:bg-sky-500 text-white shadow-telegram/20'
            }`}
          >
            {isRunning ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                Stop Bot
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Start Auto-Post
              </>
            )}
          </button>
          
          {isRunning && (
            <div className="flex flex-col items-end">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Next Post</span>
              <span className="text-2xl font-mono text-white font-bold">{secondsUntilNext}s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};