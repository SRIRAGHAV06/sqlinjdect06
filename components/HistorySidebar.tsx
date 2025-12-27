
import React from 'react';
import { HistoryItem } from '../types';
import ThreatBadge from './ThreatBadge';
import { Trash2 } from 'lucide-react';

interface HistorySidebarProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClearHistory: () => void;
  activeId?: string;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onSelect, onClearHistory, activeId }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-full md:w-80">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Analysis History</h2>
        {history.length > 0 && (
          <button 
            onClick={onClearHistory}
            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded hover:bg-slate-800"
            title="Clear History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-500 italic text-sm">
            No history yet
          </div>
        ) : (
          history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`w-full p-4 text-left border-b border-slate-800/50 transition-colors hover:bg-slate-800/50 ${
                activeId === item.id ? 'bg-slate-800 ring-1 ring-inset ring-indigo-500/50' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <ThreatBadge level={item.threatLevel} />
                <span className="text-[10px] text-slate-500">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono truncate">
                {item.query}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;
