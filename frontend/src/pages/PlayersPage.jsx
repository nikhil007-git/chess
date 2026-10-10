import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Trophy, ArrowRight, ShieldCheck, Award, Star } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/players?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPlayers(data);
      })
      .catch((err) => console.error('Error fetching public players', err))
      .finally(() => setLoading(false));
  }, [search]);

  const getRatingBadge = (rating) => {
    if (rating >= 2400) return { label: 'GM Tier', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
    if (rating >= 2000) return { label: 'Master', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    if (rating >= 1600) return { label: 'Expert', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
    return { label: 'Club', color: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              FIDE Official Rating Database
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
            <span>Player Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse registered competitors, current Elo ratings, affiliated clubs, and tournament records.
          </p>
        </div>
        <div className="text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2 self-start sm:self-auto shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">{players.length} Active Competitors</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by player name or club..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors shadow-inner"
        />
      </div>

      {/* Players Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span>Loading player directory...</span>
        </div>
      ) : players.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          No players match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {players.map((p) => {
            const badge = getRatingBadge(p.rating);
            const initials = p.fullName
              ? p.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : '??';

            return (
              <Link
                key={p.id}
                to={`/players/${p.id}`}
                className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200 shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar initials badge */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-white text-sm sm:text-base group-hover:text-amber-400 transition-colors truncate">
                          {p.fullName}
                        </h3>
                        {p.username && (
                          <span className="text-[11px] text-slate-400 block font-mono">@{p.username}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 block">
                        {p.rating}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border mt-1 inline-block ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-850">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                    <span className="truncate">{p.club || 'Independent Competitor'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono">{p._count?.participants || 0} Events</span>
                  </span>
                  <span className="text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold text-[11px]">
                    <span>View Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
