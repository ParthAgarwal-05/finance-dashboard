"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Loader2, 
  RefreshCw,
  BarChart3,
  X,
  AlertCircle,
  ShieldAlert,
  Info,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function StockPortfolio({ session, darkMode }) {
  // Core State
  const [portfolio, setPortfolio] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchingPrices, setFetchingPrices] = useState(false);
  
  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [exchange, setExchange] = useState('.NS'); // .NS for NSE, .BO for BSE
  const [errorDialog, setErrorDialog] = useState({ show: false, title: '', message: '' });
  const [successMsg, setSuccessMsg] = useState('');
  
  const [formData, setFormData] = useState({
    symbol: '',
    shares: '',
    avg_cost: ''
  });

  // Fetch portfolio from Supabase
  const fetchPortfolio = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', session.user.id)
        .order('symbol', { ascending: true });

      if (error) throw error;
      
      setPortfolio(data || []);
      if (data && data.length > 0) {
        await fetchPrices(data.map(item => item.symbol));
      }
    } catch (err) {
      handleError('Database Error', 'Unable to load your portfolio: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Fetch real-time prices from our internal API
  const fetchPrices = async (symbols) => {
    if (!symbols || symbols.length === 0) return;
    
    setFetchingPrices(true);
    try {
      const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
      const url = `/api/stocks?symbols=${encodeURIComponent(symbolsParam)}`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'The stock data service is currently unavailable.');
      }
      
      const newPrices = { ...prices };
      result.data.forEach(stock => {
        // We store the stock info even if success is false, so the UI can show the specific error
        newPrices[stock.symbol] = {
          price: stock.price || null,
          change: stock.change || 0,
          changePercent: stock.changePercent || 0,
          currency: stock.currency || 'INR',
          name: stock.name || stock.symbol,
          error: stock.success ? null : (stock.error || 'Invalid Symbol'),
          updatedAt: new Date().toLocaleTimeString()
        };
      });
      
      setPrices(newPrices);
    } catch (err) {
      handleError('Market Data Error', err.message);
    } finally {
      setFetchingPrices(false);
    }
  };

  // Portfolio Calculations - Made super robust to handle NaNs or missing data
  const stats = useMemo(() => {
    let currentTotal = 0;
    let costBasis = 0;
    
    portfolio.forEach(item => {
      const priceData = prices[item.symbol];
      const shares = parseFloat(item.shares) || 0;
      const avgCost = parseFloat(item.avg_cost) || 0;
      
      const cost = avgCost * shares;
      costBasis += cost;
      
      if (priceData && priceData.price) {
        currentTotal += parseFloat(priceData.price) * shares;
      } else {
        currentTotal += cost;
      }
    });

    const totalPL = currentTotal - costBasis;
    const totalPLPercent = costBasis > 0 ? (totalPL / costBasis) * 100 : 0;
    
    return {
      currentTotal: isNaN(currentTotal) ? 0 : currentTotal,
      costBasis: isNaN(costBasis) ? 0 : costBasis,
      totalPL: isNaN(totalPL) ? 0 : totalPL,
      totalPLPercent: isNaN(totalPLPercent) ? 0 : totalPLPercent
    };
  }, [portfolio, prices]);

  // Actions
  const handleAddStock = async (e) => {
    e.preventDefault();
    
    // Validation
    const sharesNum = parseFloat(formData.shares);
    const costNum = parseFloat(formData.avg_cost);
    
    if (isNaN(sharesNum) || sharesNum <= 0) {
      return handleError('Input Error', 'Quantity must be a valid number greater than 0.');
    }
    if (isNaN(costNum) || costNum < 0) {
      return handleError('Input Error', 'Avg. Buy Price must be 0 or greater.');
    }

    let symbol = formData.symbol.toUpperCase().trim();
    if (!symbol) return handleError('Input Error', 'Stock symbol is required.');

    // Remove any exchange suffix user might have typed to re-apply correctly
    symbol = symbol.split('.')[0];
    symbol += exchange;

    const payload = {
      user_id: session.user.id,
      symbol: symbol,
      shares: sharesNum,
      avg_cost: costNum
    };

    try {
      const { error } = await supabase.from('portfolio').insert([payload]);
      if (error) throw error;
      
      setFormData({ symbol: '', shares: '', avg_cost: '' });
      setShowAddForm(false);
      showSuccess(`Added ${symbol} to portfolio.`);
      fetchPortfolio();
    } catch (err) {
      handleError('Add Stock Error', err.message);
    }
  };

  const deleteStock = async (id, symbol) => {
    if (!confirm(`Are you sure you want to remove ${symbol}?`)) return;
    
    try {
      const { error } = await supabase.from('portfolio').delete().eq('id', id);
      if (error) throw error;
      showSuccess(`Removed ${symbol} from portfolio.`);
      fetchPortfolio();
    } catch (err) {
      handleError('Delete Error', err.message);
    }
  };

  // Utility Functions
  const handleError = (title, message) => {
    setErrorDialog({ show: true, title, message });
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Success Notification */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-right-4">
          <CheckCircle2 size={18} />
          <p className="font-bold text-sm">{successMsg}</p>
        </div>
      )}

      {/* Error Dialog Modal */}
      {errorDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className={`${darkMode ? 'bg-zinc-900 border-rose-900/50' : 'bg-white border-rose-200'} w-full max-w-sm rounded-2xl shadow-2xl border p-6 animate-in zoom-in-95`}>
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full mb-4">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">{errorDialog.title}</h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{errorDialog.message}</p>
              <button 
                onClick={() => setErrorDialog({ show: false, title: '', message: '' })}
                className="w-full py-3 bg-slate-900 dark:bg-white dark:text-black text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-zinc-900 border-gold/20' : 'bg-white border-slate-200'} p-6 rounded-2xl shadow-lg border relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
            <BarChart3 size={120} />
          </div>
          <div className="flex flex-col">
            <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'} mb-1`}>Net Asset Value</p>
            <h2 className={`text-3xl font-black ${darkMode ? 'text-gold' : 'text-slate-900'}`}>
              ₹{stats.currentTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="mt-4 flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${darkMode ? 'bg-black border border-gold/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                COST BASIS: ₹{stats.costBasis.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-zinc-900 border-gold/20' : 'bg-white border-slate-200'} p-6 rounded-2xl shadow-lg border relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
            {stats.totalPL >= 0 ? <TrendingUp size={120} /> : <TrendingDown size={120} />}
          </div>
          <div className="flex flex-col">
            <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'} mb-1`}>Unrealized Profit/Loss</p>
            <h2 className={`text-3xl font-black ${stats.totalPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stats.totalPL >= 0 ? '+' : '-'}₹{Math.abs(stats.totalPL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <div className={`mt-4 flex items-center gap-1.5 font-bold text-sm ${stats.totalPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stats.totalPL >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
              {stats.totalPLPercent.toFixed(2)}% Over Cost
            </div>
          </div>
        </div>
      </div>

      {/* Stock List Table */}
      <div className={`${darkMode ? 'bg-zinc-900 border-gold/20' : 'bg-white border-slate-200'} rounded-2xl shadow-xl border overflow-hidden`}>
        <div className={`p-5 border-b flex items-center justify-between ${darkMode ? 'border-gold/10' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gold/10 rounded-lg">
              <TrendingUp className="text-gold" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Active Portfolio</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                Market Status: {fetchingPrices ? 'Updating...' : 'Live Data Connected'} 
                <span className={`w-1.5 h-1.5 rounded-full ${fetchingPrices ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchPrices(portfolio.map(i => i.symbol))}
              className={`p-2.5 rounded-xl transition-all border ${darkMode ? 'bg-black border-gold/20 text-slate-400 hover:text-gold hover:border-gold/50' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              disabled={fetchingPrices}
            >
              <RefreshCw size={18} className={fetchingPrices ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => setShowAddForm(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-md ${
                darkMode ? 'bg-gold text-black hover:scale-[1.02]' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Plus size={18} /> Add Script
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className={`${darkMode ? 'bg-black/40 text-slate-500' : 'bg-slate-50 text-slate-400'} text-[10px] uppercase font-black tracking-widest`}>
              <tr>
                <th className="px-6 py-4">Symbol / Script</th>
                <th className="px-6 py-4">LTP (₹)</th>
                <th className="px-6 py-4">Day %</th>
                <th className="px-6 py-4">Holdings</th>
                <th className="px-6 py-4 text-right">Market Value</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-gold/10' : 'divide-slate-100'}`}>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-gold" size={32} />
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Securing Cloud Data...</p>
                  </td>
                </tr>
              ) : portfolio.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <Info className="mx-auto mb-4 text-slate-300 dark:text-slate-700" size={48} />
                    <p className="text-lg font-bold">No Stocks Found</p>
                    <p className="text-sm text-slate-500 mb-6">Start building your Indian stock portfolio today.</p>
                    <button 
                      onClick={() => setShowAddForm(true)}
                      className="px-6 py-2 bg-indigo-600 text-white dark:bg-gold dark:text-black rounded-lg text-sm font-bold"
                    >
                      Add Your First Stock
                    </button>
                  </td>
                </tr>
              ) : (
                portfolio.map((item) => {
                  const data = prices[item.symbol];
                  const currentPrice = data?.price;
                  const value = currentPrice ? currentPrice * item.shares : (item.shares * item.avg_cost);
                  const profit = currentPrice ? (currentPrice - item.avg_cost) * item.shares : 0;
                  const profitPercent = (currentPrice && item.avg_cost > 0) ? (currentPrice - item.avg_cost) / item.avg_cost * 100 : 0;

                  return (
                    <tr key={item.id} className={`${darkMode ? 'hover:bg-black/20' : 'hover:bg-slate-50/50'} transition-all group`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${
                            item.symbol.endsWith('.NS') 
                              ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' 
                              : 'bg-orange-50 border-orange-100 text-orange-600 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400'
                          }`}>
                            {item.symbol.split('.')[0].slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-black text-sm flex items-center gap-2">
                              {item.symbol.split('.')[0]}
                              {data?.error && <AlertTriangle size={14} className="text-rose-500" title={data.error} />}
                              <ChevronRight size={12} className="text-slate-400" />
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                              {data?.error ? (
                                <span className="text-rose-500 font-black">{data.error}</span>
                              ) : (
                                data?.name || (item.symbol.endsWith('.NS') ? 'National Stock Exchange' : 'Bombay Stock Exchange')
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-black text-sm">
                          {currentPrice 
                            ? `₹${currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
                            : <span className="text-slate-400">---</span>}
                        </div>
                        {data?.updatedAt && !data.error && <p className="text-[9px] text-slate-500">at {data.updatedAt}</p>}
                      </td>
                      <td className="px-6 py-5">
                        {data && !data.error ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black ${data.change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {data.change >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                          </div>
                        ) : (
                          <span className="text-slate-400">---</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-black">{item.shares} <span className="text-[10px] text-slate-500 font-bold uppercase">Qty</span></div>
                        <div className="text-[10px] font-bold text-slate-400">Avg Cost: ₹{item.avg_cost.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="font-black text-sm">
                          ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {currentPrice && !data.error && (
                          <div className={`text-[10px] font-black ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {profit >= 0 ? '+' : ''}₹{Math.abs(profit).toLocaleString('en-IN')} ({profitPercent.toFixed(1)}%)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => deleteStock(item.id, item.symbol)}
                          className={`p-2 rounded-xl transition-all ${darkMode ? 'text-slate-500 hover:text-rose-400 hover:bg-black' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`${darkMode ? 'bg-zinc-900 border-gold/30 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} w-full max-w-md rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border p-8 animate-in zoom-in-95 duration-200`}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Add Indian Asset</h3>
                <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">NSE/BSE Market Tracker</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-black text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400'}`}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddStock} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Exchange Node</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setExchange('.NS')}
                    className={`py-3 rounded-xl text-xs font-black border transition-all ${
                      exchange === '.NS' 
                        ? (darkMode ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100') 
                        : (darkMode ? 'bg-black border-gold/10 text-slate-500 hover:text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100')
                    }`}
                  >
                    NSE (Nifty)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setExchange('.BO')}
                    className={`py-3 rounded-xl text-xs font-black border transition-all ${
                      exchange === '.BO' 
                        ? (darkMode ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100') 
                        : (darkMode ? 'bg-black border-gold/10 text-slate-500 hover:text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100')
                    }`}
                  >
                    BSE (Sensex)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Security Symbol</label>
                <input 
                  required
                  type="text" 
                  className={`w-full p-4 border rounded-2xl outline-none focus:ring-4 transition-all ${
                    darkMode ? 'bg-black border-gold/20 text-slate-100 focus:ring-gold/10 placeholder:text-zinc-700' : 'bg-slate-50 border-slate-200 focus:ring-indigo-50'
                  }`}
                  placeholder={exchange === '.NS' ? 'e.g. RELIANCE, TCS' : 'e.g. 500325 (BSE Code)'}
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Quantity</label>
                  <input 
                    required
                    type="number" 
                    step="any"
                    className={`w-full p-4 border rounded-2xl outline-none focus:ring-4 transition-all ${
                      darkMode ? 'bg-black border-gold/20 text-slate-100 focus:ring-gold/10' : 'bg-slate-50 border-slate-200 focus:ring-indigo-50'
                    }`}
                    placeholder="0"
                    value={formData.shares}
                    onChange={(e) => setFormData({...formData, shares: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Avg. Buy Price (₹)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    className={`w-full p-4 border rounded-2xl outline-none focus:ring-4 transition-all ${
                      darkMode ? 'bg-black border-gold/20 text-slate-100 focus:ring-gold/10' : 'bg-slate-50 border-slate-200 focus:ring-indigo-50'
                    }`}
                    placeholder="0.00"
                    value={formData.avg_cost}
                    onChange={(e) => setFormData({...formData, avg_cost: e.target.value})}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-2xl flex items-start gap-3 border ${darkMode ? 'bg-black border-gold/10' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                <Info size={18} className="mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-bold leading-relaxed">
                  System maps to <b>{exchange}</b> automatically. Values are calculated using standard NSE/BSE delayed market protocols.
                </p>
              </div>

              <button type="submit" className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${
                darkMode 
                  ? 'bg-gold text-black hover:bg-white hover:scale-[1.01] shadow-gold/20' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
              }`}>
                Add to Portfolio
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${darkMode ? 'bg-zinc-900 border-gold/10 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
          <ShieldAlert size={16} />
          <span>Market Data Powered by Yahoo Finance Cloud Engine</span>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest">
          15-Minute Delayed for NSE/BSE Exchange
        </div>
      </div>
    </div>
  );
}
