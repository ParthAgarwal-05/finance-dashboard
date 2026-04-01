"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    username: '', 
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const email = `${formData.username.trim()}@finance-app.local`;

    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          }
        }
      });

      if (error) setError(error.message);
      else {
        if (data?.user?.identities?.length === 0) {
            setError("User already exists");
        } else {
            alert("Signup successful! You can now log in.");
            setIsSignUp(false);
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error) setError(error.message);
      else onAuthSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg text-app-fg px-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-card-bg rounded-3xl shadow-xl border border-card-border p-8 md:p-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-gold rounded-2xl text-black mb-4 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
            <User size={32} />
          </div>
          <h2 className="text-3xl font-bold text-app-fg tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-muted mt-2">
            {isSignUp ? 'Start managing your finances today.' : 'Sign in to access your dashboard.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {error && (
            <div className="bg-rose-500/10 text-rose-500 p-4 rounded-xl text-sm font-medium border border-rose-500/20 animate-pulse">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase text-muted mb-1 block tracking-wider">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                required
                name="username"
                type="text"
                placeholder="Enter your username"
                className="w-full pl-10 pr-4 py-3 bg-app-bg border border-card-border rounded-xl outline-none focus:ring-2 focus:ring-gold transition-all text-app-fg placeholder:text-muted/50"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-muted mb-1 block tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input
                required
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-app-bg border border-card-border rounded-xl outline-none focus:ring-2 focus:ring-gold transition-all text-app-fg placeholder:text-muted/50"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {isSignUp && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold uppercase text-muted mb-1 block tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  required
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-app-bg border border-card-border rounded-xl outline-none focus:ring-2 focus:ring-gold transition-all text-app-fg placeholder:text-muted/50"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-gold text-black py-4 rounded-2xl font-bold hover:bg-gold-hover transition-all shadow-lg shadow-gold/20 flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isSignUp ? 'Sign Up' : 'Sign In'}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-card-border text-center">
          <p className="text-muted text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="ml-2 text-gold font-bold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
