"use client";
import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  BarChart2, 
  ShieldCheck, 
  AlertCircle,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { useStockData } from '@/hooks/useStockData';
import AdvancedStockChart from '@/components/charts/AdvancedStockChart';
import { RSIChart, MACDChart } from '@/components/charts/TechnicalIndicatorsChart';

const RANGES = [
  { label: '1D', value: '1d', interval: '5m' },
  { label: '5D', value: '5d', interval: '15m' },
  { label: '1M', value: '1mo', interval: '1d' },
  { label: '6M', value: '6mo', interval: '1d' },
  { label: '1Y', value: '1y', interval: '1d' },
  { label: '5Y', value: '5y', interval: '1wk' }
];

export default function StockAnalysisModal({ symbol, onClose, darkMode }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [range, setRange] = useState('1y');
  const [interval, setInterval] = useState('1d');

  const { data, loading, error, analysis } = useStockData(symbol, range, interval);

  if (!symbol) return null;

  const currentRange = RANGES.find(r => r.value === range);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card-bg text-app-fg border-card-border w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-card-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border bg-gold/10 border-gold/20 text-gold dark:bg-gold/10 dark:border-gold/30">
              {symbol.split('.')[0].slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black uppercase tracking-tight">{symbol.split('.')[0]}</h3>
                {analysis && (
                   <span className={`px-2 py-0.5 rounded text-xs font-bold ${analysis.change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {analysis.change >= 0 ? '+' : ''}{analysis.changePercent.toFixed(2)}%
                   </span>
                )}
              </div>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Quantum Analysis Engine • {currentRange.label} View</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex p-1 rounded-xl bg-app-bg border border-card-border">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => { setRange(r.value); setInterval(r.interval); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    range === r.value 
                      ? 'bg-gold text-black shadow-lg shadow-gold/20'
                      : 'text-muted hover:text-app-fg'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="p-2 rounded-xl transition-all hover:bg-gold/10 text-muted hover:text-gold border border-transparent hover:border-gold/20">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-6 px-6 border-b border-card-border">
          {['overview', 'technicals', 'risk'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                activeTab === tab 
                  ? 'border-gold text-gold'
                  : 'border-transparent text-muted hover:text-app-fg'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <Activity className="animate-pulse text-gold" size={48} />
              <p className="text-xs font-black uppercase tracking-widest text-muted">Processing Market Data...</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
              <AlertCircle className="text-rose-500" size={48} />
              <p className="text-lg font-bold">Analysis Failed</p>
              <p className="text-sm text-muted max-w-xs">{error}</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="bg-app-bg border border-card-border p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-muted uppercase">Last Traded Price</p>
                        <p className="text-xl font-black mt-1">₹{analysis?.currentPrice.toLocaleString()}</p>
                     </div>
                     <div className="bg-app-bg border border-card-border p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-muted uppercase">SMA 50</p>
                        <p className={`text-xl font-black mt-1 ${analysis?.currentPrice > analysis?.technicals.sma50[analysis?.technicals.sma50.length-1] ? 'text-emerald-500' : 'text-rose-500'}`}>
                          ₹{analysis?.technicals.sma50[analysis?.technicals.sma50.length-1]?.toFixed(2) || 'N/A'}
                        </p>
                     </div>
                     <div className="bg-app-bg border border-card-border p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-muted uppercase">SMA 200</p>
                        <p className="text-xl font-black mt-1">₹{analysis?.technicals.sma200[analysis?.technicals.sma200.length-1]?.toFixed(2) || 'N/A'}</p>
                     </div>
                     <div className="bg-app-bg border border-card-border p-4 rounded-2xl">
                        <p className="text-[10px] font-bold text-muted uppercase">RSI (14)</p>
                        <p className={`text-xl font-black mt-1 ${analysis?.technicals.rsi[analysis?.technicals.rsi.length-1] > 70 ? 'text-rose-500' : analysis?.technicals.rsi[analysis?.technicals.rsi.length-1] < 30 ? 'text-emerald-500' : ''}`}>
                          {analysis?.technicals.rsi[analysis?.technicals.rsi.length-1]?.toFixed(2) || 'N/A'}
                        </p>
                     </div>
                  </div>
                  <AdvancedStockChart data={data} darkMode={darkMode} indicators={{ sma50: true, sma200: true }} />
                </div>
              )}

              {activeTab === 'technicals' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-app-bg border border-card-border p-6 rounded-3xl">
                       <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                         <Zap size={18} className="text-gold" /> Momentum
                       </h4>
                       <RSIChart data={data?.map((d, i) => ({ ...d, rsi: analysis.technicals.rsi[i] }))} darkMode={darkMode} />
                    </div>
                    <div className="bg-app-bg border border-card-border p-6 rounded-3xl">
                       <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                         <BarChart2 size={18} className="text-indigo-500" /> MACD Analysis
                       </h4>
                       <MACDChart data={data?.map((d, i) => ({ 
                         ...d, 
                         macdLine: analysis.technicals.macd.macdLine[i],
                         signalLine: analysis.technicals.macd.signalLine[i],
                         histogram: analysis.technicals.macd.histogram[i]
                       }))} darkMode={darkMode} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'risk' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-app-bg border border-card-border p-6 rounded-3xl text-center">
                      <Activity className="mx-auto mb-2 text-amber-500" size={32} />
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Annualized Volatility</p>
                      <p className="text-3xl font-black mt-2">{(analysis.risk.volatility * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-app-bg border border-card-border p-6 rounded-3xl text-center">
                      <ShieldCheck className="mx-auto mb-2 text-emerald-500" size={32} />
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Sharpe Ratio</p>
                      <p className="text-3xl font-black mt-2">{analysis.risk.sharpe.toFixed(2)}</p>
                    </div>
                    <div className="bg-app-bg border border-card-border p-6 rounded-3xl text-center">
                      <TrendingUp className="mx-auto mb-2 text-rose-500 rotate-180" size={32} />
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Max Drawdown</p>
                      <p className="text-3xl font-black mt-2">{(analysis.risk.drawdown.max * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                  
                  <div className="bg-app-bg border border-card-border p-6 rounded-3xl">
                    <div className="flex items-center gap-2 mb-4">
                      <Info size={18} className="text-muted" />
                      <h4 className="text-xs font-black uppercase tracking-widest">Quantitative Risk Insights</h4>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">
                      A Sharpe Ratio of <b>{analysis.risk.sharpe.toFixed(2)}</b> suggests that for every unit of risk taken, the security generates {analysis.risk.sharpe.toFixed(2)} units of excess return. 
                      Volatility is currently <b>{(analysis.risk.volatility * 100).toFixed(2)}%</b>, which represents the {range} price dispersion.
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 px-6 border-t border-card-border bg-app-bg/50 flex items-center justify-between">
          <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Finance Pro Quantitative Analysis Suite v2.0 • Standard NSE/BSE Protocols</p>
          <div className="flex items-center gap-2 text-[9px] font-black text-gold uppercase tracking-tighter">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             Live Data Engine
          </div>
        </div>
      </div>
    </div>
  );
}
