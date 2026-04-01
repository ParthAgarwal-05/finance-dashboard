"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Info,
  ChevronRight,
  Maximize2,
  X,
  PieChart as PieChartIcon,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react';
import UpdateNavModal from './UpdateNavModal';

export default function MutualFundsSection({ session, darkMode }) {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [updatingFund, setUpdatingFund] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [formData, setFormData] = useState({
    fund_name: '',
    invested_amount: '',
    units: '',
    current_nav: ''
  });

  const fetchFunds = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('mutual_funds')
      .select('*')
      .eq('user_id', session.user.id)
      .order('fund_name', { ascending: true });

    if (!error) setFunds(data || []);
    setLoading(false);
  }, [session]);

  useEffect(() => { fetchFunds(); }, [fetchFunds]);

  const stats = useMemo(() => {
    const totalInvested = funds.reduce((acc, f) => acc + Number(f.invested_amount), 0);
    const currentValue = funds.reduce((acc, f) => acc + (Number(f.units) * (Number(f.current_nav) || Number(f.avg_nav))), 0);
    const totalPL = currentValue - totalInvested;
    const plPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;
    return { totalInvested, currentValue, totalPL, plPercent };
  }, [funds]);

  const handleAddFund = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      user_id: session.user.id,
      invested_amount: parseFloat(formData.invested_amount),
      units: parseFloat(formData.units),
      current_nav: parseFloat(formData.current_nav) || null,
      avg_nav: parseFloat(formData.invested_amount) / parseFloat(formData.units)
    };

    const { error } = await supabase.from('mutual_funds').insert([payload]);
    if (!error) {
      setShowAddForm(false);
      setFormData({ fund_name: '', invested_amount: '', units: '', current_nav: '' });
      showSuccess(`Added ${payload.fund_name} to portfolio.`);
      fetchFunds();
    }
  };

  const deleteFund = async (id) => {
    if (!confirm('Remove this mutual fund?')) return;
    await supabase.from('mutual_funds').delete().eq('id', id);
    showSuccess(`Fund removed from portfolio.`);
    fetchFunds();
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Success Notification */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-[150] flex items-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl animate-in fade-in slide-in-from-right-4">
          <CheckCircle2 size={18} />
          <p className="font-bold text-sm">{successMsg}</p>
        </div>
      )}

      {/* Update NAV Modal */}
      {updatingFund && (
        <UpdateNavModal 
          fund={updatingFund} 
          onClose={() => setUpdatingFund(null)} 
          onUpdateSuccess={() => {
            showSuccess(`NAV updated for ${updatingFund.fund_name}`);
            fetchFunds();
          }}
        />
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card-bg border-card-border p-6 rounded-2xl shadow-lg border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
            <Coins size={120} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Total Mutual Funds Value</p>
            <h2 className="text-3xl font-black text-app-fg">₹{stats.currentValue.toLocaleString('en-IN')}</h2>
            <p className="text-[10px] font-bold mt-2 text-muted">INVESTED: ₹{stats.totalInvested.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="bg-card-bg border-card-border p-6 rounded-2xl shadow-lg border">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Total Returns</p>
          <h2 className={`text-3xl font-black ${stats.totalPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {stats.totalPL >= 0 ? '+' : ''}₹{Math.abs(stats.totalPL).toLocaleString('en-IN')}
          </h2>
          <p className={`text-[10px] font-bold mt-2 ${stats.totalPL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {stats.plPercent.toFixed(2)}% Overall ROI
          </p>
        </div>
      </div>

      {/* Funds Table */}
      <div className="bg-card-bg border-card-border rounded-2xl shadow-xl border overflow-hidden">
        <div className="p-5 border-b border-card-border flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-gold/10 rounded-lg"><Coins className="text-gold" size={20} /></div>
             <h2 className="text-lg font-black uppercase tracking-tight text-app-fg">MF Portfolio</h2>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-md bg-gold text-black hover:scale-[1.02]"
          >
            <Plus size={18} /> Add Fund
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-app-bg text-[10px] uppercase font-black tracking-widest text-muted">
              <tr>
                <th className="px-6 py-4">Fund Name</th>
                <th className="px-6 py-4 text-right">Current Value (₹)</th>
                <th className="px-6 py-4 text-right">Invested (₹)</th>
                <th className="px-6 py-4 text-right">Returns</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {loading ? (
                <tr><td colSpan="5" className="p-10 text-center text-muted"><Loader2 className="animate-spin mx-auto mb-2" /> Loading...</td></tr>
              ) : funds.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-muted"><Info className="mx-auto mb-2" /> No mutual funds tracked yet.</td></tr>
              ) : (
                funds.map((fund) => {
                  const currentValue = Number(fund.units) * (Number(fund.current_nav) || Number(fund.avg_nav));
                  const pl = currentValue - Number(fund.invested_amount);
                  const plPerc = (pl / Number(fund.invested_amount)) * 100;
                  return (
                    <tr key={fund.id} className="hover:bg-app-bg transition-all group">
                      <td className="px-6 py-5">
                        <p className="font-black text-sm text-app-fg">{fund.fund_name}</p>
                        <p className="text-[10px] font-bold text-muted">{fund.units} Units @ ₹{Number(fund.avg_nav).toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-sm text-app-fg">₹{currentValue.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-5 text-right font-bold text-sm text-muted">₹{Number(fund.invested_amount).toLocaleString('en-IN')}</td>
                      <td className={`px-6 py-5 text-right text-xs font-black ${pl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {pl >= 0 ? '+' : ''}{plPerc.toFixed(1)}%
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setUpdatingFund(fund)}
                            className="p-2 rounded-lg text-muted hover:text-gold hover:bg-gold/5 transition-all"
                            title="Update NAV"
                          >
                            <RefreshCcw size={16} />
                          </button>
                          <button 
                            onClick={() => deleteFund(fund.id)} 
                            className="p-2 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/5 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal (Simple) */}
      {showAddForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card-bg border-card-border text-app-fg w-full max-w-md rounded-3xl shadow-2xl border p-8 animate-in zoom-in-95">
             <div className="flex justify-between mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight">Add Mutual Fund</h3>
                <button onClick={() => setShowAddForm(false)} className="text-muted"><X size={24} /></button>
             </div>
             <form onSubmit={handleAddFund} className="space-y-4">
                <input required placeholder="Fund Name" className="w-full p-4 border border-card-border bg-input-bg text-app-fg rounded-xl outline-none focus:ring-4 focus:ring-gold/10" value={formData.fund_name} onChange={(e) => setFormData({...formData, fund_name: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" step="any" placeholder="Invested Amount" className="p-4 border border-card-border bg-input-bg text-app-fg rounded-xl outline-none focus:ring-4 focus:ring-gold/10" value={formData.invested_amount} onChange={(e) => setFormData({...formData, invested_amount: e.target.value})} />
                  <input required type="number" step="any" placeholder="Units" className="p-4 border border-card-border bg-input-bg text-app-fg rounded-xl outline-none focus:ring-4 focus:ring-gold/10" value={formData.units} onChange={(e) => setFormData({...formData, units: e.target.value})} />
                </div>
                <input type="number" step="any" placeholder="Current NAV (Optional)" className="w-full p-4 border border-card-border bg-input-bg text-app-fg rounded-xl outline-none focus:ring-4 focus:ring-gold/10" value={formData.current_nav} onChange={(e) => setFormData({...formData, current_nav: e.target.value})} />
                <button type="submit" className="w-full py-4 bg-gold text-black rounded-xl font-black uppercase tracking-widest shadow-lg shadow-gold/20">Save Investment</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
