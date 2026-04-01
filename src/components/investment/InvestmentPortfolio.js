"use client";
import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Calculator, 
  LayoutDashboard,
  Coins
} from 'lucide-react';
import StocksSection from './StocksSection';
import MutualFundsSection from './MutualFundsSection';
import CalculatorsSection from './CalculatorsSection';
import InvestmentOverview from './InvestmentOverview';

export default function InvestmentPortfolio({ session, darkMode }) {
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'stocks', label: 'Stocks', icon: <TrendingUp size={16} /> },
    { id: 'mutual_funds', label: 'Mutual Funds', icon: <Coins size={16} /> },
    { id: 'calculators', label: 'Calculators', icon: <Calculator size={16} /> }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-card-bg border border-card-border w-fit shadow-sm">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeSubTab === tab.id 
                ? 'bg-gold text-black shadow-lg shadow-gold/20' 
                : 'text-muted hover:text-gold'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conditional Rendering of Sections */}
      <div className="transition-all duration-300">
        {activeSubTab === 'overview' && (
          <InvestmentOverview session={session} darkMode={darkMode} />
        )}
        {activeSubTab === 'stocks' && (
          <StocksSection session={session} darkMode={darkMode} />
        )}
        {activeSubTab === 'mutual_funds' && (
          <MutualFundsSection session={session} darkMode={darkMode} />
        )}
        {activeSubTab === 'calculators' && (
          <CalculatorsSection darkMode={darkMode} />
        )}
      </div>
    </div>
  );
}
