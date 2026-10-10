import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Trophy, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/players?search=${encodeURIComponent(search)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPlayers(data);
      })
      .catch((err) => console.error('Error fetching public players', err))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-400" />
            <span>Player Directory</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Registered tournament competitors, current ratings, and career records.
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>FIDE Elo Rated Roster</span>
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
          className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
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
          {players.map((p, idx) => (
            <Link
              key={p.id}
              to={`/players/${p.id}`}
              className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 hover:bg-slate-850/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                      {p.fullName}
                    </h3>
                    {p.username && (
                      <span className="text-xs text-slate-400">@{p.username}</span>
                    )}
                  </div>
                  <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {p.rating}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                  <span>{p.club || 'Independent Competitor'}</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>{p._count?.participants || 0} Tournaments</span>
                </span>
                <span className="text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                  <span>Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
