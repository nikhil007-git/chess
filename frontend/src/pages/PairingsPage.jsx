import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Swords, Trophy, ArrowLeft, Play, Clock, CheckCircle2, AlertCircle, X, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PairingsPage() {
  const { id } = useParams();
  const { admin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoundIndex, setSelectedRoundIndex] = useState(0);
  const [generating, setGenerating] = useState(false);

  // Result entry modal
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [resultOutcome, setResultOutcome] = useState('WHITE_WIN');
  const [submittingResult, setSubmittingResult] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchPairings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tournaments/${id}/pairings`);
      const resData = await res.json();
      if (!resData.error) {
        setData(resData);
        if (resData.rounds.length > 0) {
          // Select latest round by default
          setSelectedRoundIndex(resData.rounds.length - 1);
        }
      }
    } catch (err) {
      console.error('Failed to fetch pairings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPairings();
  }, [id]);

  const handleGenerateNextRound = async () => {
    try {
      setGenerating(true);
      const res = await fetch(`/api/admin/tournaments/${id}/rounds`, {
        method: 'POST',
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to generate round');
      fetchPairings();
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const openResultModal = (match) => {
    setSelectedMatch(match);
    setResultOutcome('WHITE_WIN');
    setModalError('');
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmittingResult(true);

    try {
      const res = await fetch(`/api/admin/matches/${selectedMatch.id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: resultOutcome }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to submit result');

      setSelectedMatch(null);
      fetchPairings();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmittingResult(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Loading tournament pairings...</span>
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
          Tournament not found.
        </div>
      </div>
    );
  }

  const { tournament, rounds } = data;
  const currentRound = rounds[selectedRoundIndex];

  return (
    <div className="space-y-8">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to={`/tournaments/${tournament.id}`} className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tournament Overview</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Swords className="w-7 h-7 text-amber-400" />
            <span>{tournament.name} — Round Pairings</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/tournaments/${tournament.id}/standings`}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Live Standings</span>
          </Link>

          {admin && (
            <button
              onClick={handleGenerateNextRound}
              disabled={generating}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{generating ? 'Generating...' : 'Generate Next Round'}</span>
            </button>
          )}
        </div>
      </div>

      {rounds.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-4">
          <Swords className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Rounds Generated Yet</h3>
          <p className="text-xs max-w-md mx-auto text-slate-400">
            Tournament rounds have not started. The arbiter can generate Round 1 once registrations are ready.
          </p>
          {admin && (
            <button
              onClick={handleGenerateNextRound}
              disabled={generating}
              className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Generate Round 1 Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Round Selector Tabs */}
          <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
            {rounds.map((r, idx) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoundIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedRoundIndex === idx
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Round {r.roundNumber}
              </button>
            ))}
          </div>

          {/* Current Round Matches Table */}
          {currentRound && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-white">Round {currentRound.roundNumber} Pairings</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-amber-400">
                    {currentRound.status}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {currentRound.matches.length} Matches
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold text-center w-16">Board</th>
                      <th className="px-6 py-3.5 font-semibold">White Player</th>
                      <th className="px-6 py-3.5 font-semibold text-center font-mono">Score / Result</th>
                      <th className="px-6 py-3.5 font-semibold">Black Player</th>
                      <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {currentRound.matches.map((m) => {
                      const isBye = m.result === 'BYE';
                      const isCompleted = m.status === 'COMPLETED';

                      let resultDisplay = 'vs';
                      if (m.result === 'WHITE_WIN') resultDisplay = '1 – 0';
                      else if (m.result === 'BLACK_WIN') resultDisplay = '0 – 1';
                      else if (m.result === 'DRAW') resultDisplay = '½ – ½';
                      else if (isBye) resultDisplay = 'BYE (1 pt)';

                      return (
                        <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-5 py-4 text-center font-mono font-bold text-amber-400">
                            #{m.boardNumber}
                          </td>

                          {/* White player */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0 border border-slate-600"></span>
                              <span className="font-semibold text-white">
                                {m.whitePlayer?.fullName || <span className="text-slate-500 italic">None</span>}
                              </span>
                              {m.whitePlayer && (
                                <span className="text-xs font-mono text-slate-400">
                                  ({m.whitePlayer.rating})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Result */}
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-lg font-mono font-bold text-xs ${
                                isCompleted
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {resultDisplay}
                            </span>
                          </td>

                          {/* Black player */}
                          <td className="px-6 py-4">
                            {isBye ? (
                              <span className="text-xs text-slate-500 italic">No Opponent (Unpaired Bye)</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-950 shrink-0 border border-slate-600"></span>
                                <span className="font-semibold text-white">
                                  {m.blackPlayer?.fullName || <span className="text-slate-500 italic">None</span>}
                                </span>
                                {m.blackPlayer && (
                                  <span className="text-xs font-mono text-slate-400">
                                    ({m.blackPlayer.rating})
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!isBye && (
                                <Link
                                  to={`/matches/${m.id}`}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 transition-colors flex items-center gap-1.5"
                                >
                                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Arena Clock</span>
                                </Link>
                              )}

                              {admin && !isCompleted && !isBye && (
                                <button
                                  onClick={() => openResultModal(m)}
                                  className="text-xs px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
                                >
                                  Enter Result
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Result Entry Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Shield className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Submit Round Result</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Board {selectedMatch.boardNumber}: {selectedMatch.whitePlayer?.fullName} vs {selectedMatch.blackPlayer?.fullName}
            </p>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleResultSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Match Outcome
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setResultOutcome('WHITE_WIN')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      resultOutcome === 'WHITE_WIN'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    1 – 0 (White)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultOutcome('DRAW')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      resultOutcome === 'DRAW'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    ½ – ½ (Draw)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultOutcome('BLACK_WIN')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      resultOutcome === 'BLACK_WIN'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    0 – 1 (Black)
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingResult}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {submittingResult ? 'Saving...' : 'Confirm Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
