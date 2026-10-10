import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Users,
  Swords,
  Timer,
  Award,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Clock,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function HomePage() {
  const [featuredTourneys, setFeaturedTourneys] = useState([]);
  const [stats, setStats] = useState({ tournaments: 0, players: 0 });

  useEffect(() => {
    // Load top active tournaments for quick access preview
    apiFetch('/api/tournaments')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFeaturedTourneys(data.slice(0, 3));
          setStats((prev) => ({ ...prev, tournaments: data.length }));
        }
      })
      .catch(() => {});

    apiFetch('/api/players')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStats((prev) => ({ ...prev, players: data.length }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8">
      {/* Hero Section */}
      <section className="relative text-center py-10 sm:py-16 md:py-24 overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-slate-950/80 p-6 sm:p-12 shadow-2xl backdrop-blur-xl">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* FIDE Standard Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold tracking-wider uppercase mb-6 shadow-sm shadow-amber-500/10">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>FIDE Standard Swiss & Elimination Engine</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Tournament Arena for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
            Elite Competitive Chess
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Server-authoritative 10+0 match clocks, FIDE Dutch Swiss pairing algorithms, single-elimination brackets, and real-time public standings.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            to="/tournaments"
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide transition-all shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 group"
          >
            <Trophy className="w-4 h-4 text-slate-950" />
            <span>Explore Tournaments</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/players"
            className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-sm border border-slate-700/80 hover:border-slate-600 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 shadow-lg"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Competitor Directory</span>
          </Link>
        </div>

        {/* Quick Highlights Counter */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-3.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Engine</span>
            <span className="text-base sm:text-lg font-black text-amber-400 font-mono">FIDE Swiss</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-3.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Standard</span>
            <span className="text-base sm:text-lg font-black text-white font-mono">10+0 Rapid</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-3.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Active Events</span>
            <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">{stats.tournaments} Events</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/60 rounded-2xl p-3.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Rated Roster</span>
            <span className="text-base sm:text-lg font-black text-blue-400 font-mono">{stats.players} Players</span>
          </div>
        </div>
      </section>

      {/* Featured / Active Tournaments Preview */}
      {featuredTourneys.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" />
                <span>Featured Competitions</span>
              </h2>
              <p className="text-xs text-slate-400">Live tournaments ready for spectating and pairings</p>
            </div>
            <Link
              to="/tournaments"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredTourneys.map((t) => (
              <Link
                key={t.id}
                to={`/tournaments/${t.id}`}
                className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        t.status === 'IN_PROGRESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 animate-pulse'
                          : t.status === 'COMPLETED'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                      {t.format}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors line-clamp-1">
                    {t.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {t.description || 'Official tournament event with authoritative clocks and live standings.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.timeControlMinutes}m+{t.incrementSeconds}s</span>
                  </span>
                  <span className="font-semibold text-white group-hover:text-amber-400 flex items-center gap-1 transition-colors">
                    <span>Arena</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Feature Pillar Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-500/40 transition-all hover:-translate-y-1 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-4 shadow-md shadow-amber-500/10">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">FIDE Swiss & Knockout</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Strict score bracket pairing, repeat opponent prevention, White/Black color balance, byes, and atomic single-elimination bracket advancement.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-500/40 transition-all hover:-translate-y-1 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-4 shadow-md shadow-emerald-500/10">
            <Timer className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Authoritative Timer</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Server-synchronized chess clocks with high precision (10+0 default), pause, arbiter clock adjustment, and instant flag-fall adjudication.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-amber-500/40 transition-all hover:-translate-y-1 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 mb-4 shadow-md shadow-blue-500/10">
            <Swords className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Live Public Arena</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Spectators and players can browse live board clocks, Swiss standings, and playoff brackets instantly without needing to register an account.
          </p>
        </div>
      </section>
    </div>
  );
}
