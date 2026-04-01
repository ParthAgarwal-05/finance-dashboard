"use client";
import React from 'react';

export default function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div 
        className="rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-200"
        style={{ 
          backgroundColor: "var(--card-bg)", 
          color: "var(--app-fg)", 
          border: "1px solid var(--card-border)",
          backdropFilter: "blur(8px)"
        }}
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">
          {payload[0].name}
        </p>
        <p className="text-sm font-black flex items-center gap-2">
          ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          {data.percentage !== undefined && (
            <span className="text-[10px] text-gold">
              ({data.percentage.toFixed(1)}%)
            </span>
          )}
        </p>
      </div>
    );
  }
  return null;
}
