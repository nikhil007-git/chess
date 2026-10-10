import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Swords, Timer, Award, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero section */}
      <section className="text-center py-12 md:py-20 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Award className="w-3.5 h-3.5" />
          FIDE Standard Swiss & Elimination Engine
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Tournament Management for <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Competitive Chess</span>
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
          Automated Swiss pairing algorithms, single-elimination brackets, server-authoritative live match timers, and real-time public standings.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/tournaments"
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 group"
          >
            <span>Explore Tournaments</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/players"
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium border border-slate-800 transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Player Directory</span>
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Swiss & Knockout</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Strict Swiss score bracket pairing, repeat prevention, White/Black balancing, and atomic single-elimination bracket advancement.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <Timer className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Authoritative Timer</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Server-synchronized chess clock with configurable controls (10+0 Rapid default, Blitz, Bullet), pause, adjust, and flag-fall detection.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <Swords className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Instant Public Access</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Spectators and players can track live pairings, standings, brackets, and active board clocks without requiring an account.
          </p>
        </div>
      </section>
    </div>
  );
}
