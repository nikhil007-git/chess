import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Clock, Users, Swords, Search, ArrowRight, Shield } from 'lucide-react';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formatFilter, setFormatFilter] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    let url = `/api/tournaments?search=${encodeURIComponent(search)}`;
    if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
    if (formatFilter !== 'ALL') url += `&format=${formatFilter}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTournaments(data);
      })
      .catch((err) => console.error('Failed to fetch tournaments', err))
      .finally(() => setLoading(false));
  }, [search, statusFilter, formatFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span>Tournaments</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse upcoming, in-progress, and past Swiss and Knockout chess competitions.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tournaments by title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'IN_PROGRESS', 'UPCOMING', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === st
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="py-24 text-center text-slate-500">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span>Loading tournament events...</span>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          No published tournaments found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              to={`/tournaments/${t.id}`}
              className="group bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/40 hover:bg-slate-850/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      t.status === 'IN_PROGRESS'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : t.status === 'COMPLETED'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {t.format.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                  {t.name}
                </h3>
                {t.description && (
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                )}

                <div className="mt-5 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center justify-between py-1 border-t border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Time Control
                    </span>
                    <span className="font-mono text-slate-200">
                      {t.timeControlMinutes} min + {t.incrementSeconds}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400" /> Participants
                    </span>
                    <span className="font-mono text-slate-200">{t._count?.participants || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-semibold text-amber-400">
                <span>View Tournament</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
