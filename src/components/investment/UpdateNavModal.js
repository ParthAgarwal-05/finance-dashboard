"use client";
import React, { useState } from 'react';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function UpdateNavModal({ fund, onClose, onUpdateSuccess }) {
  const [nav, setNav] = useState(fund.current_nav || fund.avg_nav || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    const navNum = parseFloat(nav);

    if (isNaN(navNum) || navNum <= 0) {
      setError('NAV must be a positive number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('mutual_funds')
        .update({ current_nav: navNum })
        .eq('id', fund.id);

      if (updateError) throw updateError;

      onUpdateSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card-bg border-card-border text-app-fg w-full max-w-sm rounded-3xl shadow-2xl border p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">Update NAV</h3>
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{fund.fund_name}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-app-fg transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          {error && (
            <p className="text-xs font-bold text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 uppercase tracking-tighter">
              {error}
            </p>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 block">Current NAV (₹)</label>
            <div className="relative">
              <input
                required
                autoFocus
                type="number"
                step="any"
                className="w-full p-4 pr-12 bg-input-bg border border-card-border rounded-2xl text-app-fg font-black outline-none focus:ring-4 focus:ring-gold/10 transition-all placeholder:text-muted/50"
                placeholder="0.00"
                value={nav}
                onChange={(e) => setNav(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gold opacity-50">
                <RefreshCw size={18} />
              </div>
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-gold text-black rounded-xl font-black uppercase tracking-widest shadow-lg shadow-gold/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Now'}
          </button>
        </form>
      </div>
    </div>
  );
}
