import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Swords, Clock, PlusCircle, ArrowUpRight, Activity } from 'lucide-react';
import { apiFetch } from '../../utils/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalTournaments: 0,
    activeTournaments: 0,
    upcomingTournaments: 0,
    completedTournaments: 0,
    totalPlayers: 0,
    matchesInProgress: 0,
    matchesAwaitingResults: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard stats from API
    apiFetch('/api/admin/dashboard-stats')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setStats(data);
      })
      .catch((err) => console.log('Stats fetch fallback', err))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { title: 'Total Tournaments', value: stats.totalTournaments, icon: Trophy, color: 'text-amber-400' },
    { title: 'Registered Players', value: stats.totalPlayers, icon: Users, color: 'text-blue-400' },
    { title: 'Active Matches', value: stats.matchesInProgress, icon: Swords, color: 'text-emerald-400' },
    { title: 'Awaiting Results', value: stats.matchesAwaitingResults, icon: Clock, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Administrative Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time tournament metrics, participant status, and arbitrating controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin-panel/tournaments"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Tournament</span>
          </Link>
          <Link
            to="/admin-panel/players"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Add Player</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2 rounded-lg bg-slate-800/80 ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-white tracking-tight">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-amber-400" />
            <span>Quick Arbiter Operations</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin-panel/tournaments"
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-white group-hover:text-amber-400 transition-colors">
                  Manage Tournaments
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 mt-1">Configure Swiss rounds, elimination brackets, and clock presets.</p>
            </Link>

            <Link
              to="/admin-panel/players"
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-white group-hover:text-amber-400 transition-colors">
                  Roster & Seeding
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 mt-1">Register participants, adjust ratings, and manage player archives.</p>
            </Link>

            <Link
              to="/admin-panel/matches"
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-white group-hover:text-amber-400 transition-colors">
                  Match Arbiter Desk
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 mt-1">Start match clocks, record wins/draws, and resolve flag-falls.</p>
            </Link>

            <Link
              to="/tournaments"
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-white group-hover:text-amber-400 transition-colors">
                  View Public Portal
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <p className="text-xs text-slate-400 mt-1">Verify live spectator views, published pairings, and official standings.</p>
            </Link>
          </div>
        </div>

        {/* Security & System Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">System Integrity</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every result submission and winner advancement is executed in an isolated ACID transaction with full audit logging.
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                <span>Pairing Engine</span>
                <span className="text-amber-400 font-mono">FIDE Swiss / Single-Elim</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-400">
                <span>Clock Authority</span>
                <span className="text-emerald-400 font-mono">Server-Side Sync</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-400">
                <span>Session Security</span>
                <span className="text-blue-400 font-mono">HttpOnly Cookie</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            PRD Specification v1.0 Compliant
          </div>
        </div>
      </div>
    </div>
  );
}
