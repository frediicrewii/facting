import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface ActivityLogProps {
  logs: LogEntry[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[300px]">
      <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-300 font-mono">SYSTEM LOGS</h3>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500"></div>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 italic text-center mt-10">Waiting for activity...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3">
              <span className="text-slate-500 shrink-0">
                [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]
              </span>
              <span className={`break-all ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-emerald-400' :
                log.type === 'warning' ? 'text-amber-400' :
                'text-slate-300'
              }`}>
                {log.type === 'info' && '> '}
                {log.type === 'success' && '✔ '}
                {log.type === 'error' && '✖ '}
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};