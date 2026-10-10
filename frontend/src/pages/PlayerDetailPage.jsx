import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Swords, Award, Calendar, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function PlayerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/players/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.error) setData(result);
      })
      .catch((err) => console.error('Failed to fetch player details', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Loading player profile...</span>
      </div>
    );
  }

  if (!data || !data.player) {
    return (
      <div className="space-y-4">
        <Link to="/players" className="text-sm text-slate-400 hover:text-amber-400 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Player Directory</span>
        </Link>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          Player not found.
        </div>
      </div>
    );
  }

  const { player, stats, tournaments, recentMatches } = data;

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/players"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Player Directory</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-extrabold text-2xl text-slate-950 shadow-lg shadow-amber-500/20">
            {player.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {player.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
              {player.username && <span className="font-medium text-slate-300">@{player.username}</span>}
              <span>•</span>
              <span>{player.club || 'Independent'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(player.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 self-start md:self-auto">
          <div className="bg-slate-950 border border-slate-800 px-5 py-3 rounded-2xl text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Current Rating
            </span>
            <span className="text-2xl font-black font-mono text-amber-400">
              {player.rating}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs uppercase tracking-wider text-slate-400 block font-semibold">Total Matches</span>
          <span className="text-2xl font-black text-white mt-1 block font-mono">{stats.totalMatches}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs uppercase tracking-wider text-emerald-400 block font-semibold">Wins</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block font-mono">{stats.wins}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs uppercase tracking-wider text-amber-400 block font-semibold">Draws</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block font-mono">{stats.draws}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs uppercase tracking-wider text-slate-400 block font-semibold">Win Rate</span>
          <span className="text-2xl font-black text-white mt-1 block font-mono">{stats.winRate}</span>
        </div>
      </div>

      {/* Tournaments and Match History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tournaments History */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Tournament History</span>
          </h2>
          {tournaments.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No tournament participations recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {tournaments.map((t) => (
                <Link
                  key={t.id}
                  to={`/tournaments/${t.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-sm text-white">{t.name}</h3>
                    <span className="text-xs text-slate-500 uppercase">{t.format.replace('_', ' ')}</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {t.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Matches */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <span>Recent Matches</span>
          </h2>
          {recentMatches.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No completed matches on record yet.</p>
          ) : (
            <div className="space-y-3">
              {recentMatches.map((m) => {
                const opponent = m.playerColor === 'WHITE' ? m.blackPlayer : m.whitePlayer;
                const isWin = m.winnerId === player.id;
                const isDraw = m.result === 'DRAW';

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">{m.tournament?.name}</div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>vs {opponent?.fullName || 'TBD'}</span>
                        <span className="text-xs text-slate-400">({m.playerColor})</span>
                      </div>
                    </div>
                    <div>
                      {isDraw ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                          <MinusCircle className="w-3.5 h-3.5" /> Draw
                        </span>
                      ) : isWin ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Won
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                          <XCircle className="w-3.5 h-3.5" /> Lost
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
