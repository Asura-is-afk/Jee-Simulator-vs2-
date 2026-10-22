import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, User, Lock, LogOut, CheckCircle } from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStats: {
    username: string;
    xp: number;
    level: number;
    rank: string;
    coins: number;
    streak: number;
  };
}

export function CloudSyncModal({ isOpen, onClose, currentStats }: CloudSyncModalProps) {
  const [session, setSession] = useState<any>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(currentStats.username);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'auth' | 'leaderboard'>('auth');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchLeaderboard();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchLeaderboard();
        syncProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncProfile = async (userId: string) => {
    await supabase.from('profiles').upsert({
      id: userId,
      username: username || 'Aspirant',
      xp: currentStats.xp,
      level: currentStats.level,
      rank: currentStats.rank,
      coins: currentStats.coins,
      streak: currentStats.streak,
      last_active: new Date().toISOString(),
    });
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('leaderboard')
      .select('*')
      .order('xp', { ascending: false })
      .limit(50);
    if (data) setLeaderboard(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Create initial profile row
        await supabase.from('profiles').insert({
          id: data.user.id,
          username: username || 'Aspirant',
          xp: currentStats.xp,
          level: currentStats.level,
          rank: currentStats.rank,
          coins: currentStats.coins,
          streak: currentStats.streak,
        });
      }
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="cyber-panel w-full max-w-md p-6 border border-cyber-green/40 shadow-neon-green">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-arcade text-cyber-green text-lg tracking-wider">
            // SYSTEM CLOUD LINK //
          </h2>
          <button onClick={onClose} className="text-cyber-muted hover:text-white font-mono">
            [ESC]
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 border-b border-cyber-border pb-3">
          <button
            onClick={() => setActiveTab('auth')}
            className={`px-4 py-2 font-arcade text-xs rounded transition-all ${
              activeTab === 'auth'
                ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/50'
                : 'text-cyber-muted hover:text-white'
            }`}
          >
            {session ? 'HUNTER PROFILE' : 'LOGIN / SIGNUP'}
          </button>
          <button
            onClick={() => {
              setActiveTab('leaderboard');
              fetchLeaderboard();
            }}
            className={`px-4 py-2 font-arcade text-xs rounded transition-all flex items-center gap-1 ${
              activeTab === 'leaderboard'
                ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/50'
                : 'text-cyber-muted hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> LEADERBOARD
          </button>
        </div>

        {activeTab === 'auth' ? (
          <div>
            {session ? (
              <div className="space-y-4 text-center">
                <div className="cyber-panel-inset p-4">
                  <p className="text-xs text-cyber-muted uppercase">Connected Hunter Email</p>
                  <p className="font-mono text-white text-sm mt-1">{session.user.email}</p>
                  <div className="flex justify-center items-center gap-2 mt-3 text-cyber-green text-xs font-mono">
                    <CheckCircle className="w-4 h-4" /> Cloud Sync Active & Leaderboard Enabled
                  </div>
                </div>
                <button
                  onClick={() => syncProfile(session.user.id)}
                  className="w-full py-2.5 bg-cyber-green/20 border border-cyber-green text-cyber-green font-arcade text-xs hover:bg-cyber-green/30 transition-all"
                >
                  FORCE SYNC STATS TO CLOUD
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="w-full py-2.5 bg-red-500/20 border border-red-500/50 text-red-400 font-arcade text-xs hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> DISCONNECT (LOGOUT)
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="text-xs text-cyber-muted uppercase block mb-1">Hunter Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-cyber-muted" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="SOLO_ASPIRANT"
                        className="w-full bg-cyber-dark border border-cyber-border rounded px-9 py-2 font-mono text-sm text-white focus:border-cyber-green outline-none"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-cyber-muted uppercase block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aspirant@jee.com"
                    className="w-full bg-cyber-dark border border-cyber-border rounded px-3 py-2 font-mono text-sm text-white focus:border-cyber-green outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-cyber-muted uppercase block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-cyber-muted" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-cyber-dark border border-cyber-border rounded px-9 py-2 font-mono text-sm text-white focus:border-cyber-green outline-none"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-cyber-green text-cyber-black font-arcade text-xs font-bold rounded hover:shadow-neon-green transition-all"
                >
                  {loading ? 'PROCESSING...' : isLogin ? 'INITIALIZE LOGIN' : 'REGISTER HUNTER'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-xs text-cyber-cyan hover:underline font-mono"
                  >
                    {isLogin ? "Don't have an account? Register here" : 'Already registered? Login'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            <p className="text-xs text-cyber-muted font-mono mb-2">// TOP GLOBAL RANKINGS //</p>
            {leaderboard.length === 0 ? (
              <p className="text-xs text-cyber-muted font-mono text-center py-6">No leaderboard data found yet.</p>
            ) : (
              leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className="cyber-panel-inset p-3 flex items-center justify-between font-mono text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${index === 0 ? 'text-yellow-400 text-sm' : 'text-cyber-muted'}`}>
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-white font-bold">{entry.username}</p>
                      <p className="text-[10px] text-cyber-cyan">Rank: {entry.rank} (Lvl {entry.level})</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-cyber-green font-bold">{entry.xp} XP</p>
                    <p className="text-[10px] text-yellow-500">{entry.coins} Coins</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
