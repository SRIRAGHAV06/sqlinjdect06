
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Shield, Search, History, AlertTriangle, CheckCircle, Code, Info, Trash2, Cpu, Loader2, Zap, XCircle, Copy, Check } from 'lucide-react';
import { AnalysisResult, HistoryItem, ThreatLevel } from './types';
import { analyzeQuery, quickCheckQuery, QuickCheckResult } from './services/geminiService';
import HistorySidebar from './components/HistorySidebar';
import ThreatBadge from './components/ThreatBadge';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const App: React.FC = () => {
  const [inputQuery, setInputQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Real-time states
  const [realtimeResult, setRealtimeResult] = useState<QuickCheckResult | null>(null);
  const [isQuickChecking, setIsQuickChecking] = useState(false);
  const debounceTimer = useRef<number | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sql_shield_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('sql_shield_history', JSON.stringify(history));
  }, [history]);

  // Real-time analysis logic
  useEffect(() => {
    if (!inputQuery.trim()) {
      setRealtimeResult(null);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = window.setTimeout(async () => {
      setIsQuickChecking(true);
      try {
        const check = await quickCheckQuery(inputQuery);
        setRealtimeResult(check);
      } catch (err) {
        console.error("Quick check failed", err);
      } finally {
        setIsQuickChecking(false);
      }
    }, 800);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [inputQuery]);

  const handleAnalyze = async () => {
    if (!inputQuery.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeQuery(inputQuery);
      setResult(analysis);
      
      const newItem: HistoryItem = {
        ...analysis,
        id: Math.random().toString(36).substr(2, 9),
      };
      setHistory(prev => [newItem, ...prev].slice(0, 50));
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your entire history?')) {
      setHistory([]);
      localStorage.removeItem('sql_shield_history');
      setResult(null);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.secureVersion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 20) return '#10b981';
    if (score < 50) return '#3b82f6';
    if (score < 75) return '#f59e0b';
    return '#ef4444';
  };

  const riskData = result ? [
    { name: 'Risk', value: result.riskScore },
    { name: 'Safety', value: 100 - result.riskScore },
  ] : [];

  const getRealtimeIndicator = () => {
    if (isQuickChecking) return <div className="flex items-center space-x-1 text-slate-500 animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> <span className="text-[10px]">Checking...</span></div>;
    if (!realtimeResult) return null;

    const colors = {
      safe: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      suspicious: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      malicious: 'text-red-400 bg-red-400/10 border-red-400/20'
    };

    return (
      <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${colors[realtimeResult.label]}`}>
        <Zap className="w-3 h-3 fill-current" />
        <span>{realtimeResult.label}</span>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar for Desktop */}
      <div className="hidden md:block">
        <HistorySidebar 
          history={history} 
          onSelect={(item) => {
            setResult(item);
            setInputQuery(item.query);
            setError(null);
          }}
          onClearHistory={clearHistory}
          activeId={result ? (result as any).id : undefined}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800 z-10">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">SQL-SHIELD</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Advanced Threat Detection</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span>System Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-5xl mx-auto w-full">
          {/* Hero Section */}
          <section className="space-y-4">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mb-3">
                Intelligent SQL Injection Detection
              </h2>
              <p className="text-slate-400 text-lg">
                Leverage advanced linguistic modeling to understand intent, detect hidden patterns, and secure your database queries.
              </p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-slate-900 ring-1 ring-slate-800 rounded-xl p-4 shadow-2xl">
                <div className="absolute top-6 right-6 z-20">
                  {getRealtimeIndicator()}
                </div>
                <textarea
                  value={inputQuery}
                  onChange={(e) => {
                    setInputQuery(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter SQL query to analyze... (e.g. SELECT * FROM users WHERE id = '1' OR '1'='1')"
                  className="w-full h-32 bg-slate-800 text-slate-200 p-4 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm resize-none border border-slate-700 placeholder-slate-500 transition-all duration-300"
                />
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-[10px] text-slate-500 italic">
                    {inputQuery.length > 0 ? `${inputQuery.length} characters entered` : 'Ready for input'}
                  </p>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !inputQuery.trim()}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-bold transition-all ${
                      isAnalyzing 
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analyzing Core...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        <span>Run Full Security Scan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start space-x-3 text-red-400 animate-in fade-in slide-in-from-top-2 duration-300">
              <XCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-1">Analysis Blocked</h4>
                <p className="text-sm opacity-90">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="mt-2 text-xs font-bold underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary Card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      {result.status === 'Malicious' ? (
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-white">Analysis Overview</h3>
                        <p className="text-sm text-slate-400">Status: <span className={result.status === 'Malicious' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{result.status}</span></p>
                      </div>
                    </div>
                    <ThreatBadge level={result.threatLevel} />
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="flex items-center space-x-2 text-sm font-semibold text-slate-300 mb-2">
                        <Info className="w-4 h-4 text-indigo-400" />
                        <span>Detailed Vulnerability Analysis</span>
                      </h4>
                      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-slate-300 text-sm leading-relaxed">
                        {result.analysis}
                      </div>
                    </div>

                    {result.attackType && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Primary Attack Vector:</span>
                        <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">{result.attackType}</span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="flex items-center space-x-2 text-sm font-semibold text-slate-300">
                          <Code className="w-4 h-4 text-emerald-400" />
                          <span>Recommended Secure Version</span>
                        </h4>
                        <button 
                          onClick={handleCopy}
                          className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                            copied 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 active:scale-95'
                          }`}
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Secure Code</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="relative group">
                        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                          {result.secureVersion}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Score Card */}
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Cumulative Risk Score</h3>
                  <div className="relative w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill={getRiskColor(result.riskScore)} />
                          <Cell fill="#1e293b" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-white">{result.riskScore}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Points</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-400">
                      Threat severity assessed as <span style={{ color: getRiskColor(result.riskScore) }}>{result.threatLevel}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Security Tips</h3>
                  <ul className="space-y-3 text-xs text-slate-400">
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1"></div>
                      <span>Always use Parameterized Queries or Prepared Statements to separate code from data.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1"></div>
                      <span>Implement the Principle of Least Privilege for database users.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1"></div>
                      <span>Use modern ORMs like Prisma or Sequelize which have built-in SQLi protection.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!result && !isAnalyzing && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
              <Shield className="w-20 h-20 mb-4 opacity-10" />
              <p className="text-center italic">Awaiting query input for security audit...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
