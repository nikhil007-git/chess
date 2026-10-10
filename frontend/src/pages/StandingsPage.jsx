import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Swords, ArrowLeft, Award, Medal, Users, HelpCircle, Crown, Sparkles } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function StandingsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/tournaments/${id}/standings`)
      .then((res) => res.json())
      .then((resData) => {
        if (!resData.error) setData(resData);
      })
      .catch((err) => console.error('Failed to fetch standings', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Loading Swiss standings...</span>
      </div>
    );
  }

  if (!data || !data.tournament) {
    return (
      <div className="space-y-4">
        <Link to="/tournaments" className="text-sm text-slate-400 hover:text-amber-400 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tournaments</span>
        </Link>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          Tournament standings not available.
        </div>
      </div>
    );
  }

  const { tournament, standings } = data;
  const top1 = standings[0];
  const top2 = standings[1];
  const top3 = standings[2];

  return (
    <div className="space-y-8">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to={`/tournaments/${tournament.id}`} className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tournament Overview</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>{tournament.name} — Standings</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/tournaments/${tournament.id}/pairings`}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Swords className="w-4 h-4 text-amber-400" />
            <span>Round Pairings</span>
          </Link>
        </div>
      </div>

      {/* Top 3 Podium Spotlight (if at least 1 player has played or is seeded) */}
      {standings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* 2nd Place */}
          {top2 ? (
            <div className="order-2 sm:order-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow">
                  2
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Runner Up</span>
              </div>
              <div>
                <Link to={`/players/${top2.playerId}`} className="font-extrabold text-white text-base hover:text-amber-400 transition-colors block line-clamp-1">
                  {top2.player?.fullName}
                </Link>
                <span className="text-xs text-slate-400 block">{top2.player?.club || 'Independent'}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Score</span>
                <span className="font-mono font-black text-base text-white">{top2.points} pts</span>
              </div>
            </div>
          ) : (
            <div className="order-2 sm:order-1 hidden sm:block" />
          )}

          {/* 1st Place Champion */}
          {top1 && (
            <div className="order-1 sm:order-2 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 border-2 border-amber-400/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl shadow-amber-500/10 relative overflow-hidden sm:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-amber-500/30">
                    1
                  </span>
                  <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Tournament Leader
                </span>
              </div>
              <div>
                <Link to={`/players/${top1.playerId}`} className="font-black text-white text-lg sm:text-xl hover:text-amber-400 transition-colors block line-clamp-1">
                  {top1.player?.fullName}
                </Link>
                <span className="text-xs text-slate-400 block">{top1.player?.club || 'Independent'}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs">
                <span className="text-amber-300 font-semibold">Total Points</span>
                <span className="font-mono font-black text-xl text-amber-400">{top1.points} pts</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 ? (
            <div className="order-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="w-7 h-7 rounded-full bg-amber-800 text-amber-100 font-black text-xs flex items-center justify-center shadow">
                  3
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">3rd Place</span>
              </div>
              <div>
                <Link to={`/players/${top3.playerId}`} className="font-extrabold text-white text-base hover:text-amber-400 transition-colors block line-clamp-1">
                  {top3.player?.fullName}
                </Link>
                <span className="text-xs text-slate-400 block">{top3.player?.club || 'Independent'}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Score</span>
                <span className="font-mono font-black text-base text-white">{top3.points} pts</span>
              </div>
            </div>
          ) : (
            <div className="order-3 hidden sm:block" />
          )}
        </div>
      )}

      {/* Standings Table Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">Full Table Classification</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {standings.length} Competitors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300 min-w-[580px] sm:min-w-full">
            <thead className="bg-slate-950/70 text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 sm:px-6 py-3.5 sm:py-4 font-semibold text-center w-12 sm:w-16">Rank</th>
                <th className="px-3 sm:px-6 py-3.5 sm:py-4 font-semibold">Player</th>
                <th className="px-2 sm:px-6 py-3.5 sm:py-4 font-semibold font-mono">Rating</th>
                <th className="px-2 sm:px-6 py-3.5 sm:py-4 font-semibold text-center font-mono">Pld</th>
                <th className="px-2 sm:px-6 py-3.5 sm:py-4 font-semibold text-center font-mono">W/D/L</th>
                <th className="px-2 sm:px-6 py-3.5 sm:py-4 font-semibold text-center font-mono">Bye</th>
                <th className="px-3 sm:px-6 py-3.5 sm:py-4 font-semibold text-center font-mono text-amber-400">Pts</th>
                <th className="px-3 sm:px-6 py-3.5 sm:py-4 font-semibold text-right font-mono" title="Buchholz Tie-Break Score">
                  BH
                </th>
                <th className="px-3 sm:px-6 py-3.5 sm:py-4 font-semibold text-right font-mono" title="Sonneborn-Berger Tie-Break Score">
                  SB
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {standings.map((s) => {
                return (
                  <tr
                    key={s.playerId}
                    className={`transition-colors ${
                      s.rank === 1
                        ? 'bg-amber-500/10 hover:bg-amber-500/15'
                        : s.rank <= 3
                        ? 'bg-slate-800/30 hover:bg-slate-800/50'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Rank with medal styling */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      {s.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20">
                          1
                        </span>
                      ) : s.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs">
                          2
                        </span>
                      ) : s.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs">
                          3
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-slate-400 font-bold">
                          {s.rank}
                        </span>
                      )}
                    </td>

                    {/* Player Info */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <Link
                        to={`/players/${s.playerId}`}
                        className="font-bold text-white hover:text-amber-400 transition-colors block text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none"
                      >
                        {s.player?.fullName}
                      </Link>
                      <div className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[120px] sm:max-w-none">
                        {s.player?.club || 'Independent'}
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-2 sm:px-6 py-3 sm:py-4 font-mono font-bold text-slate-400 text-xs">
                      {s.initialRating}
                    </td>

                    {/* Games Played */}
                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-center font-mono text-slate-300 text-xs">
                      {s.played}
                    </td>

                    {/* Win / Draw / Loss */}
                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-center font-mono text-[11px] sm:text-xs">
                      <span className="text-emerald-400 font-semibold">{s.wins}</span>
                      <span className="text-slate-500 mx-0.5 sm:mx-1">/</span>
                      <span className="text-amber-400 font-semibold">{s.draws}</span>
                      <span className="text-slate-500 mx-0.5 sm:mx-1">/</span>
                      <span className="text-red-400 font-semibold">{s.losses}</span>
                    </td>

                    {/* Byes */}
                    <td className="px-2 sm:px-6 py-3 sm:py-4 text-center font-mono text-xs text-slate-400">
                      {s.byes > 0 ? (
                        <span className="px-1.5 sm:px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[10px]">
                          {s.byes}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Total Points */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center font-mono text-sm sm:text-base font-black text-amber-400">
                      {s.points}
                    </td>

                    {/* Buchholz Tie-break */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-mono text-xs font-semibold text-slate-300">
                      {s.buchholz}
                    </td>

                    {/* Sonneborn-Berger Tie-break */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-mono text-xs font-semibold text-slate-400">
                      {s.sonnebornBerger}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tiebreak Explanations Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-300">FIDE Tie-Breaks:</span>
          </div>
          <span><strong>BH (Buchholz):</strong> Total score of all opponents played.</span>
          <span><strong>SB (Sonneborn-Berger):</strong> Opponent quality weighting for draws & wins.</span>
        </div>
      </div>
    </div>
  );
}
