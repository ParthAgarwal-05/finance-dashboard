"use client";
import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  ArrowRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { calculateSIP, calculateLumpsum } from '@/lib/investment-logic';

export default function CalculatorsSection({ darkMode }) {
  const [calcType, setActiveCalc] = useState('sip'); // 'sip' or 'lumpsum'
  const [params, setParams] = useState({
    amount: 5000,
    rate: 12,
    years: 10
  });

  const result = useMemo(() => {
    return calcType === 'sip' 
      ? calculateSIP(params.amount, params.rate, params.years)
      : calculateLumpsum(params.amount, params.rate, params.years);
  }, [calcType, params]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Inputs Card */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-card-bg border-card-border p-6 rounded-3xl border shadow-xl">
          <div className="flex gap-2 mb-8 p-1 bg-app-bg border border-card-border rounded-xl">
            <button 
              onClick={() => setActiveCalc('sip')}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${calcType === 'sip' ? 'bg-gold text-black' : 'text-muted hover:text-app-fg'}`}
            >
              SIP
            </button>
            <button 
              onClick={() => setActiveCalc('lumpsum')}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${calcType === 'lumpsum' ? 'bg-gold text-black' : 'text-muted hover:text-app-fg'}`}
            >
              Lumpsum
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">
                {calcType === 'sip' ? 'Monthly Investment' : 'Total Investment'}
              </label>
              <input 
                type="number" 
                className="w-full p-4 bg-input-bg border border-card-border rounded-2xl text-app-fg font-black outline-none focus:ring-2 focus:ring-gold/20"
                value={params.amount}
                onChange={(e) => setParams({...params, amount: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Expected Return (%)</label>
              <input 
                type="number" 
                className="w-full p-4 bg-input-bg border border-card-border rounded-2xl text-app-fg font-black outline-none focus:ring-2 focus:ring-gold/20"
                value={params.rate}
                onChange={(e) => setParams({...params, rate: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Time Period (Years)</label>
              <input 
                type="number" 
                className="w-full p-4 bg-input-bg border border-card-border rounded-2xl text-app-fg font-black outline-none focus:ring-2 focus:ring-gold/20"
                value={params.years}
                onChange={(e) => setParams({...params, years: Number(e.target.value)})}
              />
            </div>
          </div>
        </div>

        {/* Results Small Grid */}
        <div className="grid grid-cols-1 gap-4">
           <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
              <p className="text-[9px] font-black text-emerald-500 uppercase">Estimated Returns</p>
              <p className="text-xl font-black text-app-fg">₹{Math.round(result.estimatedReturns).toLocaleString('en-IN')}</p>
           </div>
           <div className="bg-gold/5 border border-gold/10 p-4 rounded-2xl">
              <p className="text-[9px] font-black text-gold uppercase">Total Value</p>
              <p className="text-xl font-black text-app-fg">₹{Math.round(result.finalValue).toLocaleString('en-IN')}</p>
           </div>
        </div>
      </div>

      {/* Chart & Summary */}
      <div className="lg:col-span-8 bg-card-bg border-card-border p-8 rounded-3xl border shadow-xl flex flex-col">
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
               <TrendingUp size={18} className="text-gold" /> Projected Growth
            </h3>
            <div className="text-right">
               <p className="text-[10px] text-muted font-bold uppercase">Invested: ₹{result.totalInvested.toLocaleString('en-IN')}</p>
            </div>
         </div>

         <div className="flex-1 h-80 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={result.chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-gold)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-gold)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-muted)' }} axisLine={false} tickFormatter={(v) => `₹${(v/100000).toFixed(1)}L`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px' }}
                    formatter={(v) => `₹${v.toLocaleString('en-IN')}`}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--color-gold)" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                  <Area type="monotone" dataKey="invested" stroke="var(--color-muted)" fill="transparent" strokeDasharray="5 5" />
               </AreaChart>
            </ResponsiveContainer>
         </div>

         <div className="mt-8 flex items-center gap-3 p-4 bg-app-bg border border-card-border rounded-2xl">
            <Calculator size={20} className="text-gold" />
            <p className="text-xs text-muted font-bold leading-relaxed">
               At {params.rate}% returns, your wealth grows by <b>{((result.finalValue / result.totalInvested - 1) * 100).toFixed(0)}%</b> over {params.years} years.
            </p>
         </div>
      </div>

    </div>
  );
}
