"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  Loader2, 
  Trash2, 
  Search, 
  Filter, 
  Utensils, 
  Car, 
  Home, 
  Briefcase, 
  Tag, 
  Edit2, 
  Calendar,
  X
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';

// Helper for Smart Icons
const getCategoryIcon = (category) => {
  switch (category) {
    case 'Food': return <Utensils size={18} />;
    case 'Transport': return <Car size={18} />;
    case 'Rent': return <Home size={18} />;
    case 'Salary': return <Briefcase size={18} />;
    default: return <Tag size={18} />;
  }
};

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = [2024, 2025, 2026];

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Food',
    type: 'expense'
  });

  // 1. Fetch data from Supabase
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching:', error);
    else setTransactions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, [fetchTransactions]);

  // 2. Filtered Transactions Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = new Date(t.created_at);
      const matchesMonth = selectedMonth === 'All' || date.getMonth() === Number(selectedMonth);
      const matchesYear = selectedYear === 'All' || date.getFullYear() === Number(selectedYear);
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMonth && matchesYear && matchesSearch;
    });
  }, [transactions, selectedMonth, selectedYear, searchQuery]);

  // 3. Stats Calculation (based on filtered view)
  const { income, expenses, balance } = useMemo(() => {
    const inc = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    const exp = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    return { income: inc, expenses: exp, balance: inc - exp };
  }, [filteredTransactions]);

  // 4. Category Breakdown Logic
  const categoryData = useMemo(() => {
    const breakdown = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + Number(curr.amount);
        return acc;
      }, {});

    return Object.keys(breakdown).map(name => ({
      name,
      value: breakdown[name],
      percentage: expenses > 0 ? (breakdown[name] / expenses) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions, expenses]);

  // 5. Handle Form Submission (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount)
    };

    if (editingId) {
      const { error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', editingId);
      
      if (error) alert(error.message);
      else {
        setEditingId(null);
        resetForm();
        fetchTransactions();
      }
    } else {
      const { error } = await supabase
        .from('transactions')
        .insert([payload]);

      if (error) alert(error.message);
      else {
        resetForm();
        fetchTransactions();
      }
    }
  };

  const resetForm = () => {
    setFormData({ description: '', amount: '', category: 'Food', type: 'expense' });
    setEditingId(null);
  };

  const startEdit = (transaction) => {
    setEditingId(transaction.id);
    setFormData({
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      type: transaction.type
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteTransaction = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchTransactions();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Finance Pro</h1>
            <p className="text-slate-500">Intelligent money management for your goals.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-sm font-medium"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="All">All Months</option>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div className="relative">
              <select 
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-sm font-medium"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="All">All Years</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Wallet size={24}/></div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Balance</p>
                <p className={`text-2xl font-bold ${balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><ArrowUpCircle size={24}/></div>
              <div>
                <p className="text-sm font-medium text-slate-500">Income</p>
                <p className="text-2xl font-bold text-emerald-600">+${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><ArrowDownCircle size={24}/></div>
              <div>
                <p className="text-sm font-medium text-slate-500">Expenses</p>
                <p className="text-2xl font-bold text-rose-600">-${expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form & Category Breakdown */}
          <div className="lg:col-span-4 space-y-8">
            {/* Form Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  {editingId ? <Edit2 size={20} className="text-indigo-600"/> : <Plus size={20} className="text-indigo-600"/>}
                  {editingId ? 'Update Transaction' : 'Add Transaction'}
                </h2>
                {editingId && (
                  <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                    <X size={20}/>
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Description</label>
                  <input 
                    required
                    type="text" 
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Monthly Rent"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Amount ($)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400">Type</label>
                    <select 
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400">Category</label>
                    <select 
                      className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="Food">Food</option>
                      <option value="Rent">Rent</option>
                      <option value="Transport">Transport</option>
                      <option value="Salary">Salary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                  {editingId ? 'Update Record' : 'Save Transaction'}
                </button>
              </form>
            </div>

            {/* Category Breakdown Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-6 text-slate-800">Spending by Category</h2>
              
              {categoryData.length > 0 ? (
                <>
                  <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    {categoryData.map((cat, index) => (
                      <div key={cat.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700">{cat.name}</span>
                          <span className="text-slate-500">${cat.value.toFixed(0)} ({cat.percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${cat.percentage}%`, 
                              backgroundColor: COLORS[index % COLORS.length] 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-slate-400">
                  No expense data to display for this period.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Transactions List */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-800">Transaction History</h2>
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search transactions..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="p-20 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p>Loading transactions...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="p-20 text-center flex flex-col items-center justify-center text-slate-400">
                    <Filter size={48} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">No results found</p>
                    <p className="text-sm">Try adjusting your filters or search query.</p>
                  </div>
                ) : (
                  filteredTransactions.map((t) => (
                    <div 
                      key={t.id} 
                      className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group ${editingId === t.id ? 'bg-indigo-50/50 ring-1 ring-inset ring-indigo-200' : ''}`}
                      onClick={() => startEdit(t)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl flex items-center justify-center ${
                          t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {getCategoryIcon(t.category)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{t.description}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{t.category}</span>
                            <span>•</span>
                            <span>{new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-black text-lg ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); startEdit(t); }} 
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16}/>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteTransaction(t.id); }} 
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-medium">
                <span>Showing {filteredTransactions.length} of {transactions.length} items</span>
                <span>Sorted by Newest</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}