import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Clock, Users, Swords, Search, ArrowRight, Shield, Sparkles, Filter } from 'lucide-react';
import { apiFetch } from '../utils/api';

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

    apiFetch(url)
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Official FIDE Arena
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
            <span>Tournaments Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse upcoming, live in-progress, and completed Swiss and Knockout championship events.
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-3.5 sm:p-4 rounded-2xl space-y-3 sm:space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tournaments by name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            />
          </div>

          {/* Format selector */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {['ALL', 'SWISS', 'SINGLE_ELIMINATION'].map((f) => (
              <button
                key={f}
                onClick={() => setFormatFilter(f)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  formatFilter === f
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'All Formats' : f === 'SWISS' ? 'Swiss' : 'Knockout'}
              </button>
            ))}
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-850">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'IN_PROGRESS', label: 'Live In Progress' },
            { id: 'UPCOMING', label: 'Upcoming' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st.id
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              {st.label}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tournaments.map((t) => (
            <Link
              key={t.id}
              to={`/tournaments/${t.id}`}
              className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 shadow-xl hover:shadow-amber-500/10 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      t.status === 'IN_PROGRESS'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse'
                        : t.status === 'COMPLETED'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                    {t.format.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                    {t.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {t.description || 'FIDE standard competition with official pairings, ratings, and standings.'}
                  </p>
                </div>

                <div className="space-y-2 pt-1 text-xs text-slate-400">
                  <div className="flex items-center justify-between py-1.5 border-t border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Time Control</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-200">
                      {t.timeControlMinutes}m + {t.incrementSeconds}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-t border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Competitors</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-200">
                      {t._count?.participants || 0} players
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                <span>Enter Tournament Arena</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
