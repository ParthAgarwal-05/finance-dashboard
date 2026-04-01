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
  AlertTriangle,
  PieChart as PieChartIcon,
  Maximize2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import StockAnalysisModal from './StockAnalysisModal';
import CustomTooltip from './charts/ChartTooltip';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

export default function StockPortfolio({ session, darkMode }) {
  // Core State
  const [portfolio, setPortfolio] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  
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

  // Portfolio Calculations
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

  // Enhanced Analytics
  const insights = useMemo(() => {
    if (portfolio.length === 0) return null;

    const itemsWithPerformance = portfolio.map(item => {
      const priceData = prices[item.symbol];
      const currentPrice = priceData?.price || item.avg_cost;
      const profitPercent = item.avg_cost > 0 ? (currentPrice - item.avg_cost) / item.avg_cost * 100 : 0;
      const marketValue = currentPrice * item.shares;
      return { ...item, profitPercent, marketValue };
    });

    const sortedByPerformance = [...itemsWithPerformance].sort((a, b) => b.profitPercent - a.profitPercent);
    const topGainer = sortedByPerformance[0];
    const topLoser = sortedByPerformance[sortedByPerformance.length - 1];

    const allocationData = itemsWithPerformance.map(item => ({
      name: item.symbol.split('.')[0],
      value: item.marketValue
    })).sort((a, b) => b.value - a.value);

    const totalValue = itemsWithPerformance.reduce((acc, i) => acc + i.marketValue, 0);
    const hhi = itemsWithPerformance.reduce((acc, i) => acc + Math.pow((i.marketValue / totalValue) * 100, 2), 0);
    const diversificationScore = Math.max(0, 100 - (hhi / 100));

    return { topGainer, topLoser, allocationData, diversificationScore };
  }, [portfolio, prices]);

  // Actions
  const handleAddStock = async (e) => {
    e.preventDefault();
    const sharesNum = parseFloat(formData.shares);
    const costNum = parseFloat(formData.avg_cost);
    
    if (isNaN(sharesNum) || sharesNum <= 0) return handleError('Input Error', 'Quantity must be a valid number greater than 0.');
    if (isNaN(costNum) || costNum < 0) return handleError('Input Error', 'Avg. Buy Price must be 0 or greater.');

    let symbol = formData.symbol.toUpperCase().trim();
    if (!symbol) return handleError('Input Error', 'Stock symbol is required.');
    symbol = symbol.split('.')[0] + exchange;

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

  const handleError = (title, message) => setErrorDialog({ show: true, title, message });
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {selectedStock && (
        <StockAnalysisModal 
          symbol={selectedStock} 
          onClose={() => setSelectedStock(null)} 
          darkMode={darkMode} 
        />
      )}

      {successMsg && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-right-4">
          <CheckCircle2 size={18} />
          <p className="font-bold text-sm">{successMsg}</p>
        </div>
      )}

      {errorDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-card-bg border-card-border text-app-fg w-full max-w-sm rounded-2xl shadow-2xl border p-6 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full mb-4">
                <ShieldAlert size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">{errorDialog.title}</h3>
              <p className="text-sm mb-6 text-muted">{errorDialog.message}</p>
              <button 
                onClick={() => setErrorDialog({ show: false, title: '', message: '' })}
                className="w-full py-3 bg-app-fg text-app-bg font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card-bg border-card-border text-app-fg p-6 rounded-2xl shadow-lg border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
            <BarChart3 size={120} />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Net Asset Value</p>
            <h2 className="text-3xl font-black text-app-fg">
              ₹{stats.currentTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-app-bg border border-card-border text-muted uppercase">
                COST BASIS: ₹{stats.costBasis.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card-bg border-card-border text-app-fg p-6 rounded-2xl shadow-lg border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
            {stats.totalPL >= 0 ? <TrendingUp size={120} /> : <TrendingDown size={120} />}
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Unrealized Profit/Loss</p>
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

      {/* Portfolio Insights */}
      {portfolio.length > 0 && insights && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-card-bg border-card-border text-app-fg p-6 rounded-2xl shadow-lg border col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                 <PieChartIcon size={18} className="text-gold" /> Allocation Breakdown
               </h3>
               <div className="text-right">
                  <p className="text-[10px] text-muted font-bold uppercase">Diversification Score</p>
                  <p className={`text-lg font-black ${insights.diversificationScore > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {insights.diversificationScore.toFixed(0)}/100
                  </p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={insights.allocationData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {insights.allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>                  </ResponsiveContainer>
               </div>
               <div className="space-y-4">
                  {insights.allocationData.slice(0, 4).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-xs font-bold uppercase">{item.name}</span>
                       </div>
                       <span className="text-xs font-black">
                         {((item.value / stats.currentTotal) * 100).toFixed(1)}%
                       </span>
                    </div>
                  ))}
                  {insights.allocationData.length > 4 && (
                    <p className="text-[10px] text-muted font-bold text-center">+{insights.allocationData.length - 4} other assets</p>
                  )}
               </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-card-bg border-card-border text-app-fg p-6 rounded-2xl shadow-lg border">
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-4">Top Performer</p>
                <div className="flex items-center justify-between">
                   <div>
                      <p className="text-lg font-black uppercase">{insights.topGainer.symbol.split('.')[0]}</p>
                      <p className="text-emerald-500 font-bold text-sm">+{insights.topGainer.profitPercent.toFixed(2)}% ROI</p>
                   </div>
                   <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                      <TrendingUp size={24} />
                   </div>
                </div>
             </div>
             <div className="bg-card-bg border-card-border text-app-fg p-6 rounded-2xl shadow-lg border">
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mb-4">Underperformer</p>
                <div className="flex items-center justify-between">
                   <div>
                      <p className="text-lg font-black uppercase">{insights.topLoser.symbol.split('.')[0]}</p>
                      <p className="text-rose-500 font-bold text-sm">{insights.topLoser.profitPercent.toFixed(2)}% ROI</p>
                   </div>
                   <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
                      <TrendingDown size={24} />
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Stock List Table */}
      <div className="bg-card-bg border-card-border rounded-2xl shadow-xl border overflow-hidden">
        <div className="p-5 border-b border-card-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gold/10 rounded-lg">
              <TrendingUp className="text-gold" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-app-fg">Active Portfolio</h2>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest flex items-center gap-1">
                Market Status: {fetchingPrices ? 'Updating...' : 'Live Data Connected'} 
                <span className={`w-1.5 h-1.5 rounded-full ${fetchingPrices ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchPrices(portfolio.map(i => i.symbol))}
              className="p-2.5 rounded-xl transition-all border border-card-border bg-app-bg text-muted hover:text-gold hover:border-gold/50"
              disabled={fetchingPrices}
            >
              <RefreshCw size={18} className={fetchingPrices ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-md bg-gold text-black hover:scale-[1.02]"
            >
              <Plus size={18} /> Add Script
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-app-bg text-[10px] uppercase font-black tracking-widest text-muted">
              <tr>
                <th className="px-6 py-4">Symbol / Script</th>
                <th className="px-6 py-4">LTP (₹)</th>
                <th className="px-6 py-4">Day %</th>
                <th className="px-6 py-4">Holdings</th>
                <th className="px-6 py-4 text-right">Market Value</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-gold" size={32} />
                    <p className="text-muted text-xs font-bold uppercase tracking-widest">Securing Cloud Data...</p>
                  </td>
                </tr>
              ) : portfolio.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-20 text-center">
                    <Info className="mx-auto mb-4 text-muted/30" size={48} />
                    <p className="text-lg font-bold text-app-fg">No Stocks Found</p>
                    <p className="text-sm text-muted mb-6">Start building your Indian stock portfolio today.</p>
                    <button 
                      onClick={() => setShowAddForm(true)}
                      className="px-6 py-2 bg-gold text-black rounded-lg text-sm font-bold"
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
                    <tr key={item.id} className="hover:bg-app-bg transition-all group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${
                            item.symbol.endsWith('.NS') 
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' 
                              : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                          }`}>
                            {item.symbol.split('.')[0].slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-black text-sm flex items-center gap-2 text-app-fg">
                              {item.symbol.split('.')[0]}
                              {data?.error && <AlertTriangle size={14} className="text-rose-500" title={data.error} />}
                              <ChevronRight size={12} className="text-muted" />
                            </div>
                            <div className="text-[10px] font-bold text-muted uppercase tracking-tighter">
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
                        <div className="font-black text-sm text-app-fg">
                          {currentPrice 
                            ? `₹${currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
                            : <span className="text-muted">---</span>}
                        </div>
                        {data?.updatedAt && !data.error && <p className="text-[9px] text-muted">at {data.updatedAt}</p>}
                      </td>
                      <td className="px-6 py-5">
                        {data && !data.error ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black ${data.change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {data.change >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                          </div>
                        ) : (
                          <span className="text-muted">---</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-black text-app-fg">{item.shares} <span className="text-[10px] text-muted font-bold uppercase">Qty</span></div>
                        <div className="text-[10px] font-bold text-muted">Avg Cost: ₹{item.avg_cost.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="font-black text-sm text-app-fg">
                          ₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        {currentPrice && !data.error && (
                          <div className={`text-[10px] font-black ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {profit >= 0 ? '+' : ''}₹{Math.abs(profit).toLocaleString('en-IN')} ({profitPercent.toFixed(1)}%)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => setSelectedStock(item.symbol)}
                            className="p-2 rounded-xl transition-all text-muted hover:text-gold hover:bg-card-bg border border-transparent hover:border-card-border"
                            title="Advanced Analysis"
                          >
                            <Maximize2 size={16} />
                          </button>
                          <button 
                            onClick={() => deleteStock(item.id, item.symbol)}
                            className="p-2 rounded-xl transition-all text-muted hover:text-rose-500 hover:bg-card-bg border border-transparent hover:border-card-border"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
          <div className="bg-card-bg border-card-border text-app-fg w-full max-w-md rounded-3xl shadow-2xl border p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Add Indian Asset</h3>
                <p className="text-xs text-muted font-bold mt-1 uppercase tracking-widest">NSE/BSE Market Tracker</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="p-2 rounded-xl transition-all hover:bg-rose-500/10 text-muted hover:text-rose-500">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddStock} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Exchange Node</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setExchange('.NS')}
                    className={`py-3 rounded-xl text-xs font-black border transition-all ${
                      exchange === '.NS' 
                        ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' 
                        : 'bg-app-bg border-card-border text-muted hover:text-app-fg'
                    }`}
                  >
                    NSE (Nifty)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setExchange('.BO')}
                    className={`py-3 rounded-xl text-xs font-black border transition-all ${
                      exchange === '.BO' 
                        ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' 
                        : 'bg-app-bg border-card-border text-muted hover:text-app-fg'
                    }`}
                  >
                    BSE (Sensex)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-2">Security Symbol</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-4 border border-card-border bg-input-bg text-app-fg rounded-2xl outline-none focus:ring-4 focus:ring-gold/10 transition-all placeholder:text-muted/50"
                  placeholder={exchange === '.NS' ? 'e.g. RELIANCE, TCS' : 'e.g. 500325 (BSE Code)'}
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-2">Quantity</label>
                  <input 
                    required
                    type="number" 
                    step="any"
                    className="w-full p-4 border border-card-border bg-input-bg text-app-fg rounded-2xl outline-none focus:ring-4 focus:ring-gold/10 transition-all"
                    placeholder="0"
                    value={formData.shares}
                    onChange={(e) => setFormData({...formData, shares: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted block mb-2">Avg. Buy Price (₹)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    className="w-full p-4 border border-card-border bg-input-bg text-app-fg rounded-2xl outline-none focus:ring-4 focus:ring-gold/10 transition-all"
                    placeholder="0.00"
                    value={formData.avg_cost}
                    onChange={(e) => setFormData({...formData, avg_cost: e.target.value})}
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl flex items-start gap-3 border bg-gold/5 border-gold/20 text-gold">
                <Info size={18} className="mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-bold leading-relaxed">
                  System maps to <b>{exchange}</b> automatically. Values are calculated using standard NSE/BSE delayed market protocols.
                </p>
              </div>

              <button type="submit" className="w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl bg-gold text-black hover:bg-white hover:scale-[1.01] shadow-gold/20">
                Add to Portfolio
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer Disclaimer */}
      <div className="p-5 rounded-2xl border border-card-border bg-card-bg text-muted flex flex-col md:flex-row md:items-center justify-between gap-4">
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
