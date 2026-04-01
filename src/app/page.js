"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Auth from '@/components/Auth';
import InvestmentPortfolio from '@/components/investment/InvestmentPortfolio';
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
  X,
  LogOut,
  Moon,
  Sun,
  Download,
  FileSpreadsheet,
  TrendingUp
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
} from 'recharts';
import CustomTooltip from '@/components/charts/ChartTooltip';

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
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'investments'

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Food',
    type: 'expense'
  });

  // Check for session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Dark Mode Logic
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 1. Fetch data from Supabase
  const fetchTransactions = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching:', error);
    else setTransactions(data || []);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session, fetchTransactions]);

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
      amount: parseFloat(formData.amount),
      user_id: session.user.id
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

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No transaction data to export.');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        `"${t.description.replace(/"/g, '""')}"`,
        t.category,
        t.amount,
        t.type
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = async () => {
    if (filteredTransactions.length === 0) {
      alert('No transaction data to export.');
      return;
    }

    const xlsx = await import('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(filteredTransactions.map(t => ({
      Date: new Date(t.created_at).toLocaleDateString(),
      Description: t.description,
      Category: t.category,
      Amount: t.amount,
      Type: t.type
    })));
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    xlsx.writeFile(workbook, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300 bg-app-bg text-app-fg p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">

        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Finance Pro</h1>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl transition-all bg-card-bg text-gold border border-card-border shadow-sm hover:border-gold/50"
              >
                {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
              </button>
            </div>
            <p className="text-muted">Intelligent money management for your goals.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <select 
                className="pl-10 pr-8 py-2 border border-card-border bg-card-bg text-app-fg rounded-xl outline-none focus:ring-2 focus:ring-gold appearance-none text-sm font-medium"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="All">All Months</option>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div className="relative">
              <select 
                className="px-4 py-2 border border-card-border bg-card-bg text-app-fg rounded-xl outline-none focus:ring-2 focus:ring-gold appearance-none text-sm font-medium"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="All">All Years</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl transition-all bg-card-bg text-rose-500 border border-card-border hover:bg-rose-500/10"
              title="Logout"
            >
              <LogOut size={20}/>
            </button>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8 p-1 w-fit rounded-2xl bg-card-bg border border-card-border">
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'transactions' 
                ? 'bg-gold text-black shadow-lg shadow-gold/20' 
                : 'text-muted hover:text-gold'
            }`}
          >
            <Wallet size={18} />
            Transactions
          </button>
          <button 
            onClick={() => setActiveTab('investments')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'investments' 
                ? 'bg-gold text-black shadow-lg shadow-gold/20' 
                : 'text-muted hover:text-gold'
            }`}
          >
            <TrendingUp size={18} />
            Investment Portfolio
          </button>
        </div>

        {activeTab === 'transactions' ? (
          <>
            {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-card-bg border-card-border p-6 rounded-2xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gold/10 text-gold rounded-xl"><Wallet size={24}/></div>
              <div>
                <p className="text-sm font-medium text-muted">Total Balance</p>
                <p className={`text-2xl font-bold ${balance < 0 ? 'text-rose-500' : 'text-app-fg'}`}>
                  ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card-bg border-card-border p-6 rounded-2xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><ArrowUpCircle size={24}/></div>
              <div>
                <p className="text-sm font-medium text-muted">Income</p>
                <p className="text-2xl font-bold text-emerald-500">+₹{income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="bg-card-bg border-card-border p-6 rounded-2xl shadow-sm border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><ArrowDownCircle size={24}/></div>
              <div>
                <p className="text-sm font-medium text-muted">Expenses</p>
                <p className="text-2xl font-bold text-rose-500">-₹{expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-card-bg border-card-border p-6 rounded-2xl shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {editingId ? <Edit2 size={20} className="text-gold"/> : <Plus size={20} className="text-gold"/>}
                  {editingId ? 'Update Transaction' : 'Add Transaction'}
                </h2>
                {editingId && (
                  <button onClick={resetForm} className="text-muted hover:text-app-fg">
                    <X size={20}/>
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted">Description</label>
                  <input 
                    required
                    type="text" 
                    className="w-full mt-1 p-2 border border-card-border bg-input-bg text-app-fg rounded-lg outline-none focus:ring-2 focus:ring-gold placeholder:text-muted/50"
                    placeholder="e.g. Monthly Rent"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted">Amount (₹)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    className="w-full mt-1 p-2 border border-card-border bg-input-bg text-app-fg rounded-lg outline-none focus:ring-2 focus:ring-gold placeholder:text-muted/50"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted">Type</label>
                    <select 
                      className="w-full mt-1 p-2 border border-card-border bg-input-bg text-app-fg rounded-lg outline-none focus:ring-2 focus:ring-gold"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted">Category</label>
                    <select 
                      className="w-full mt-1 p-2 border border-card-border bg-input-bg text-app-fg rounded-lg outline-none focus:ring-2 focus:ring-gold"
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
                <button type="submit" className="w-full py-3 rounded-xl font-bold transition-all shadow-lg bg-gold text-black hover:bg-gold-hover shadow-gold/20">
                  {editingId ? 'Update Record' : 'Save Transaction'}
                </button>
              </form>
            </div>

            <div className="bg-card-bg border-card-border p-6 rounded-2xl shadow-sm border">
              <h2 className="text-lg font-bold mb-6">Spending by Category</h2>
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
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {categoryData.map((cat, index) => (
                      <div key={cat.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-muted">₹{cat.value.toLocaleString('en-IN')} ({cat.percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-app-bg h-2 rounded-full overflow-hidden border border-card-border">
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
                <div className="py-10 text-center text-muted">
                  No expense data to display for this period.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-card-bg border-card-border rounded-2xl shadow-sm border overflow-hidden">
              <div className="p-6 border-b border-card-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold">Transaction History</h2>
                <div className="flex wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search transactions..."
                      className="w-full pl-10 pr-4 py-2 border border-card-border bg-input-bg text-app-fg rounded-xl outline-none focus:ring-2 focus:ring-gold text-sm placeholder:text-muted/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={exportToCSV}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-card-bg text-gold border border-card-border hover:bg-gold/10"
                      title="Export CSV"
                    >
                      <Download size={16} />
                      <span className="hidden md:inline">CSV</span>
                    </button>
                    <button 
                      onClick={exportToExcel}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-card-bg text-gold border border-card-border hover:bg-gold/10"
                      title="Export Excel"
                    >
                      <FileSpreadsheet size={16} />
                      <span className="hidden md:inline">Excel</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-card-border">
                {loading ? (
                  <div className="p-20 flex flex-col items-center justify-center text-muted">
                    <Loader2 className="animate-spin mb-4 text-gold" size={32} />
                    <p>Loading transactions...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="p-20 text-center flex flex-col items-center justify-center text-muted">
                    <Filter size={48} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">No results found</p>
                    <p className="text-sm">Try adjusting your filters or search query.</p>
                  </div>
                ) : (
                  filteredTransactions.map((t) => (
                    <div 
                      key={t.id} 
                      className={`p-4 flex items-center justify-between transition-all cursor-pointer group border-l-4 border-transparent ${
                        editingId === t.id 
                          ? 'bg-gold/5 border-gold shadow-[inset_0_0_20px_rgba(212,175,55,0.05)]' 
                          : 'hover:bg-app-bg'
                      }`}
                      onClick={() => startEdit(t)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl flex items-center justify-center border ${
                          t.type === 'income' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                          {getCategoryIcon(t.category)}
                        </div>
                        <div>
                          <p className="font-bold">{t.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted font-medium">
                            <span className="bg-app-bg text-gold border border-card-border px-2 py-0.5 rounded-md uppercase tracking-wider">{t.category}</span>
                            <span>•</span>
                            <span>{new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-black text-lg ${t.type === 'income' ? 'text-emerald-500' : 'text-gold'}`}>
                            {t.type === 'income' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); startEdit(t); }} 
                            className="p-2 rounded-lg transition-colors text-muted hover:text-gold hover:bg-card-bg border border-transparent hover:border-card-border"
                          >
                            <Edit2 size={16}/>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteTransaction(t.id); }} 
                            className="p-2 rounded-lg transition-colors text-muted hover:text-rose-500 hover:bg-card-bg border border-transparent hover:border-card-border"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 border-t border-card-border bg-app-bg/50 flex justify-between items-center text-xs text-muted font-medium">
                <span>Showing {filteredTransactions.length} of {transactions.length} items</span>
                <span>Sorted by Newest</span>
              </div>
            </div>
          </div>
        </div>
          </>
        ) : (
          <InvestmentPortfolio session={session} darkMode={darkMode} />
        )}
      </div>
    </div>
  );
}
