import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { Loader2, Mail, Lock, User } from 'lucide-react';

export function LoginPage() {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/success" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });
        if (error) throw error;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 rounded-2xl border-2 border-gray-800 p-8">
          <div className="text-center mb-8">
            <img
              src="/2tr-logo-final-transparent.png"
              alt="Two Tuft Rugs Logo"
              className="w-24 h-24 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-400">
              {isLogin ? 'Sign in to your account' : 'Join Two Tuft Rugs today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-white font-medium mb-2">Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                    placeholder="Your full name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-white font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border-2 border-red-600 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-orange-500 hover:text-orange-400 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}