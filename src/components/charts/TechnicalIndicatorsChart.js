"use client";
import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';

export function RSIChart({ data, darkMode }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => ({
      date: new Date(d.date).toLocaleDateString(),
      rsi: d.rsi
    })).filter(d => d.rsi !== null);
  }, [data]);

  return (
    <div className="h-[150px] w-full mt-4 text-app-fg">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Relative Strength Index (14)</p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis domain={[0, 100]} orientation="right" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--color-card-bg)', 
              border: '1px solid var(--color-card-border)',
              borderRadius: '12px',
              color: 'var(--color-app-fg)'
            }}
          />
          <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'right', value: '70', fill: '#f43f5e', fontSize: 10 }} />
          <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: '30', fill: '#10b981', fontSize: 10 }} />
          <Line type="monotone" dataKey="rsi" stroke="var(--color-gold)" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MACDChart({ data, darkMode }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => ({
      date: new Date(d.date).toLocaleDateString(),
      macd: d.macdLine,
      signal: d.signalLine,
      hist: d.histogram
    })).filter(d => d.macd !== null);
  }, [data]);

  return (
    <div className="h-[150px] w-full mt-8 text-app-fg">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">MACD (12, 26, 9)</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis orientation="right" tick={{ fontSize: 10, fill: 'var(--color-muted)' }} />
          <Tooltip 
             contentStyle={{ 
               backgroundColor: 'var(--color-card-bg)', 
               border: '1px solid var(--color-card-border)',
               borderRadius: '12px',
               color: 'var(--color-app-fg)'
             }}
          />
          <Bar dataKey="hist" fill={(val) => val >= 0 ? '#10b981' : '#f43f5e'} />
          <Line type="monotone" dataKey="macd" stroke="var(--color-gold)" dot={false} />
          <Line type="monotone" dataKey="signal" stroke="#6366f1" dot={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
