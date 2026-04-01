"use client";
import React, { useMemo } from 'react';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  Legend
} from 'recharts';
import { calculateSMA } from '@/lib/finance-utils';

export default function AdvancedStockChart({ data, darkMode, indicators = {} }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const sma50 = calculateSMA(data, 50);
    const sma200 = calculateSMA(data, 200);

    return data.map((d, i) => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: data.length > 100 ? '2-digit' : undefined
      }),
      sma50: sma50[i],
      sma200: sma200[i]
    }));
  }, [data]);

  if (!chartData.length) return null;

  const minPrice = Math.min(...chartData.map(d => d.close)) * 0.95;
  const maxPrice = Math.max(...chartData.map(d => d.close)) * 1.05;

  return (
    <div className="h-[400px] w-full mt-4 text-app-fg">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-gold)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--color-gold)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-card-border)" vertical={false} />
          <XAxis 
            dataKey="displayDate" 
            tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
            axisLine={false}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis 
            domain={[minPrice, maxPrice]} 
            orientation="right"
            tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `₹${val.toLocaleString()}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--color-card-bg)', 
              border: '1px solid var(--color-card-border)',
              borderRadius: '12px',
              fontSize: '12px',
              color: 'var(--color-app-fg)'
            }}
            itemStyle={{ padding: '2px 0' }}
          />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}/>
          
          <Area 
            type="monotone" 
            dataKey="close" 
            name="Price"
            stroke="var(--color-gold)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            dot={false}
          />

          {indicators.sma50 && (
            <Line 
              type="monotone" 
              dataKey="sma50" 
              name="SMA 50"
              stroke="#10b981" 
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="5 5"
            />
          )}

          {indicators.sma200 && (
            <Line 
              type="monotone" 
              dataKey="sma200" 
              name="SMA 200"
              stroke="#f43f5e" 
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="5 5"
            />
          )}

          <Bar 
            dataKey="volume" 
            name="Volume"
            yAxisId={0} 
            fill="var(--color-muted)" 
            opacity={0.2} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
