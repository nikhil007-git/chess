import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Users, Clock, Swords, ArrowLeft, Award, Calendar, ListOrdered } from 'lucide-react';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setTournament(data);
      })
      .catch((err) => console.error('Failed to fetch tournament detail', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Loading tournament details...</span>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="space-y-4">
        <Link to="/tournaments" className="text-sm text-slate-400 hover:text-amber-400 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tournaments</span>
        </Link>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          Tournament not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <Link
        to="/tournaments"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Tournaments</span>
      </Link>

      {/* Tournament Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  tournament.status === 'IN_PROGRESS'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : tournament.status === 'COMPLETED'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {tournament.status.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                {tournament.format.replace('_', ' ')}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {tournament.name}
            </h1>
            {tournament.description && (
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                {tournament.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{tournament.timeControlMinutes}m + {tournament.incrementSeconds}s Rapid</span>
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{tournament.roundsCount} Rounds</span>
              </span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{tournament.participants?.length || 0} Registered Competitors</span>
              </span>
            </div>
          </div>

          {/* Quick Sub-navigation */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
            {tournament.format === 'SWISS' ? (
              <>
                <Link
                  to={`/tournaments/${tournament.id}/standings`}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
                >
                  <Trophy className="w-4 h-4" />
                  <span>View Swiss Standings</span>
                </Link>
                <Link
                  to={`/tournaments/${tournament.id}/pairings`}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <Swords className="w-4 h-4 text-amber-400" />
                  <span>Pairings & Results</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={`/tournaments/${tournament.id}/bracket`}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
                >
                  <Swords className="w-4 h-4" />
                  <span>Interactive Bracket</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>Official Competitors ({tournament.participants?.length || 0})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-3.5 font-semibold text-center w-12 sm:w-16">Seed</th>
                <th className="px-3 sm:px-6 py-3 sm:py-3.5 font-semibold">Player</th>
                <th className="hidden sm:table-cell px-6 py-3.5 font-semibold">Club / Org</th>
                <th className="px-3 sm:px-6 py-3 sm:py-3.5 font-semibold font-mono">Rating</th>
                <th className="px-3 sm:px-6 py-3 sm:py-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tournament.participants?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    No participants registered for this event yet.
                  </td>
                </tr>
              ) : (
                tournament.participants?.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono font-bold text-amber-400 text-center">
                      #{p.seedNumber}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <Link
                        to={`/players/${p.playerId}`}
                        className="font-bold text-white hover:text-amber-400 transition-colors block text-xs sm:text-sm truncate max-w-[130px] sm:max-w-none"
                      >
                        {p.player?.fullName}
                      </Link>
                      <div className="text-[10px] text-slate-400 sm:hidden truncate max-w-[120px]">
                        {p.player?.club || 'Independent'}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-slate-400 text-xs">
                      {p.player?.club || 'Independent'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono font-bold text-slate-300 text-xs">
                      {p.initialRating}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
