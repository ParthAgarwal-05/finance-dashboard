"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  BarChart3, 
  TrendingUp, 
  Coins, 
  ArrowUpRight,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import CustomTooltip from '../charts/ChartTooltip';

const COLORS = ['#d4af37', '#6366f1'];

export default function InvestmentOverview({ session, darkMode }) {
  const [stocks, setStocks] = useState([]);
  const [prices, setPrices] = useState({});
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      if (!session?.user?.id) return;
      setLoading(true);
      
      const [stocksRes, fundsRes] = await Promise.all([
        supabase.from('portfolio').select('*').eq('user_id', session.user.id),
        supabase.from('mutual_funds').select('*').eq('user_id', session.user.id)
      ]);

      setStocks(stocksRes.data || []);
      setFunds(fundsRes.data || []);
      
      // Basic price fetch for stocks to get market value
      if (stocksRes.data?.length > 0) {
        const symbols = stocksRes.data.map(s => s.symbol).join(',');
        try {
          const res = await fetch(`/api/stocks?symbols=${symbols}`);
          const json = await res.json();
          if (json.success) {
            const pMap = {};
            json.data.forEach(s => pMap[s.symbol] = s.price);
            setPrices(pMap);
          }
        } catch (e) {}
      }
      setLoading(false);
    }
    loadAll();
  }, [session]);

  const stats = useMemo(() => {
    const stockValue = stocks.reduce((acc, s) => acc + (Number(s.shares) * (prices[s.symbol] || s.avg_cost)), 0);
    const fundValue = funds.reduce((acc, f) => acc + (Number(f.units) * (f.current_nav || f.avg_nav)), 0);
    const totalInvested = stocks.reduce((acc, s) => acc + (s.shares * s.avg_cost), 0) + 
                          funds.reduce((acc, f) => acc + Number(f.invested_amount), 0);
    
    const totalValue = stockValue + fundValue;
    
    return {
      totalValue,
      stockValue,
      fundValue,
      totalPL: totalValue - totalInvested,
      plPercent: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
      allocation: [
        { name: 'Stocks', value: stockValue },
        { name: 'Mutual Funds', value: fundValue }
      ]
    };
  }, [stocks, funds, prices]);

  if (loading) return <div className="p-20 text-center text-muted uppercase font-black tracking-widest animate-pulse">Aggregating Wealth Data...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Mega Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card-bg border-card-border p-8 rounded-3xl border shadow-xl flex flex-col justify-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-12 opacity-[0.02] rotate-12">
              <BarChart3 size={200} />
           </div>
           <p className="text-xs font-black uppercase tracking-widest text-muted mb-2">Net Portfolio Value</p>
           <h1 className="text-5xl font-black text-app-fg tracking-tighter">₹{stats.totalValue.toLocaleString('en-IN')}</h1>
           <div className={`mt-6 flex items-center gap-2 font-black text-sm ${stats.totalPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              <ArrowUpRight size={20} className={stats.totalPL < 0 ? 'rotate-90' : ''} />
              ₹{Math.abs(stats.totalPL).toLocaleString('en-IN')} ({stats.plPercent.toFixed(2)}%)
           </div>
        </div>

        <div className="bg-card-bg border-card-border p-8 rounded-3xl border shadow-xl">
           <p className="text-xs font-black uppercase tracking-widest text-muted mb-6">Asset Allocation</p>
           <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.allocation} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                    {stats.allocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-4 space-y-2">
              {stats.allocation.map((a, i) => (
                <div key={a.name} className="flex justify-between items-center text-xs font-bold uppercase">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                      {a.name}
                   </div>
                   <span>{stats.totalValue > 0 ? ((a.value/stats.totalValue)*100).toFixed(0) : 0}%</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="flex items-center gap-4 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <ShieldCheck className="text-emerald-500" size={32} />
            <div>
               <p className="text-xs font-black uppercase tracking-tighter">Safe & Secure</p>
               <p className="text-[10px] text-muted font-bold">256-bit encryption for MF data</p>
            </div>
         </div>
         <div className="flex items-center gap-4 p-6 bg-gold/5 border border-gold/10 rounded-2xl">
            <TrendingUp className="text-gold" size={32} />
            <div>
               <p className="text-xs font-black uppercase tracking-tighter">Growth Engine</p>
               <p className="text-[10px] text-muted font-bold">Real-time market insights</p>
            </div>
         </div>
         <div className="flex items-center gap-4 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
            <Globe className="text-indigo-500" size={32} />
            <div>
               <p className="text-xs font-black uppercase tracking-tighter">Diversified</p>
               <p className="text-[10px] text-muted font-bold">Multi-asset tracking enabled</p>
            </div>
         </div>
      </div>

    </div>
  );
}
