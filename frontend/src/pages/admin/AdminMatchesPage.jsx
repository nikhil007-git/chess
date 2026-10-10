import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swords, Clock, AlertTriangle, CheckCircle2, Search, Edit3, X, Shield, ArrowUpRight } from 'lucide-react';

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [loading, setLoading] = useState(true);

  // Correction Modal
  const [correctingMatch, setCorrectingMatch] = useState(null);
  const [newResult, setNewResult] = useState('WHITE_WIN');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const url = selectedTournament
        ? `/api/admin/matches?tournamentId=${selectedTournament}`
        : '/api/admin/matches';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setMatches(data);
    } catch (err) {
      console.error('Failed to fetch matches', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/admin/tournaments');
      const data = await res.json();
      if (Array.isArray(data)) setTournaments(data);
    } catch (err) {
      console.error('Failed to load tournaments', err);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [selectedTournament]);

  const openCorrectionModal = (match) => {
    setCorrectingMatch(match);
    setNewResult(match.result || 'WHITE_WIN');
    setCorrectionReason('');
    setErrorMsg('');
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      setErrorMsg('Please state a reason for this result correction (PRD requirement).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/matches/${correctingMatch.id}/result`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: newResult,
          reason: correctionReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Correction failed');

      setCorrectingMatch(null);
      fetchMatches();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Swords className="w-6 h-6 text-amber-400" />
            <span>Match & Result Arbiter Desk</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor match statuses, control live official clocks, and correct results with an immutable audit log.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-72">
          <select
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
          >
            <option value="">All Tournaments</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.format})
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Showing {matches.length} matches
        </span>
      </div>

      {/* Matches Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Tournament / Board</th>
                <th className="px-6 py-4 font-semibold">White Player</th>
                <th className="px-6 py-4 font-semibold text-center font-mono">Result</th>
                <th className="px-6 py-4 font-semibold">Black Player</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Arbiter Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading matches...</span>
                    </div>
                  </td>
                </tr>
              ) : matches.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No matches found for the selected filter.
                  </td>
                </tr>
              ) : (
                matches.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white text-xs">{m.tournament?.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Round {m.round?.roundNumber || 1} • Board {m.boardNumber}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-white">
                        {m.whitePlayer?.fullName || 'TBD'}
                      </div>
                      {m.whitePlayer && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Rating: {m.whitePlayer.rating}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {m.result ? m.result.replace('_', ' ') : 'vs'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-white">
                        {m.blackPlayer?.fullName || 'TBD'}
                      </div>
                      {m.blackPlayer && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          Rating: {m.blackPlayer.rating}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          m.status === 'COMPLETED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : m.status === 'IN_PROGRESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/matches/${m.id}`}
                          className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 transition-colors flex items-center gap-1"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Clock Arena</span>
                        </Link>

                        {m.status === 'COMPLETED' && (
                          <button
                            onClick={() => openCorrectionModal(m)}
                            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-semibold transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Correct Result</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result Correction Modal (PRD Section 7.2 & 9.3) */}
      {correctingMatch && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setCorrectingMatch(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Shield className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Correct Confirmed Result</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Board {correctingMatch.boardNumber}: {correctingMatch.whitePlayer?.fullName} vs {correctingMatch.blackPlayer?.fullName}
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 text-xs">
              <span className="text-slate-500 block">Current Recorded Result:</span>
              <span className="font-bold text-amber-400 font-mono">{correctingMatch.result || 'None'}</span>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCorrectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Corrected Outcome
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewResult('WHITE_WIN')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      newResult === 'WHITE_WIN'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    1 – 0 (White)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewResult('DRAW')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      newResult === 'DRAW'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    ½ – ½ (Draw)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewResult('BLACK_WIN')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      newResult === 'BLACK_WIN'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    0 – 1 (Black)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Arbiter Correction Reason (Audit Log) *
                </label>
                <input
                  type="text"
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Score sheet transcription error corrected by Head Arbiter"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCorrectingMatch(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  {isSubmitting ? 'Saving Correction...' : 'Confirm Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
