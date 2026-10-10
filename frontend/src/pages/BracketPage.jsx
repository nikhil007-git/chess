import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Swords, ArrowLeft, Play, Award, CheckCircle2, AlertCircle, X, Shield, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BracketPage() {
  const { id } = useParams();
  const { admin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Result entry modal state
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [resultOutcome, setResultOutcome] = useState('WHITE_WIN');
  const [winnerId, setWinnerId] = useState('');
  const [tiebreakMethod, setTiebreakMethod] = useState('Blitz Playoff (3+2)');
  const [submittingResult, setSubmittingResult] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchBracket = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tournaments/${id}/bracket`);
      const resData = await res.json();
      if (!resData.error) setData(resData);
    } catch (err) {
      console.error('Failed to fetch bracket data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBracket();
  }, [id]);

  const handleGenerateBracket = async () => {
    try {
      setGenerating(true);
      const res = await fetch(`/api/admin/tournaments/${id}/rounds`, {
        method: 'POST',
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to generate bracket');
      fetchBracket();
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const openResultModal = (match) => {
    setSelectedMatch(match);
    setResultOutcome('WHITE_WIN');
    setWinnerId(match.whitePlayerId || '');
    setTiebreakMethod('Blitz Playoff (3+2)');
    setModalError('');
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmittingResult(true);

    try {
      const payload = {
        result: resultOutcome,
        winnerId: resultOutcome === 'DRAW' ? winnerId : undefined,
        tiebreakResolution: resultOutcome === 'DRAW' ? tiebreakMethod : undefined,
      };

      const res = await fetch(`/api/admin/matches/${selectedMatch.id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to submit result');

      setSelectedMatch(null);
      fetchBracket();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmittingResult(false);
    }
  };

  const getRoundLabel = (roundIndex, totalRounds) => {
    const diff = totalRounds - roundIndex;
    if (diff === 1) return 'Final';
    if (diff === 2) return 'Semifinals';
    if (diff === 3) return 'Quarterfinals';
    if (diff === 4) return 'Round of 16';
    return `Round ${roundIndex + 1}`;
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Loading tournament bracket...</span>
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
            <span>{tournament.name} — Knockout Bracket</span>
          </h1>
        </div>

        {admin && rounds.length === 0 && (
          <button
            onClick={handleGenerateBracket}
            disabled={generating}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{generating ? 'Generating Bracket...' : 'Generate Knockout Bracket'}</span>
          </button>
        )}
      </div>

      {rounds.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-4">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Knockout Bracket Not Yet Generated</h3>
          <p className="text-xs max-w-md mx-auto text-slate-400">
            Once tournament registration is confirmed, the arbiter will seed and generate the official single-elimination bracket.
          </p>
          {admin && (
            <button
              onClick={handleGenerateBracket}
              disabled={generating}
              className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Generate Bracket Now</span>
            </button>
          )}
        </div>
      ) : (
        /* Bracket Columns Viewer */
        <div className="space-y-3">
          {/* Mobile Round Navigation Bar */}
          <div className="flex sm:hidden items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs">
            <span className="text-slate-400">Swipe bracket horizontally</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span>{rounds.length} Rounds</span>
              <span>↔</span>
            </span>
          </div>

          <div className="overflow-x-auto pb-6 scroll-smooth touch-pan-x">
            <div className="flex gap-4 sm:gap-8 min-w-max items-stretch">
              {rounds.map((round, rIdx) => (
                <div key={round.id} className="w-64 sm:w-72 flex flex-col">
                  {/* Round Header */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 mb-3 sm:mb-4 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      {getRoundLabel(rIdx, rounds.length)}
                    </span>
                  </div>

                {/* Matches in Round */}
                <div className="flex flex-col justify-around flex-1 gap-6">
                  {round.matches.map((m) => {
                    const whiteWon = m.winnerId === m.whitePlayerId && m.status === 'COMPLETED';
                    const blackWon = m.winnerId === m.blackPlayerId && m.status === 'COMPLETED';

                    return (
                      <div
                        key={m.id}
                        className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all shadow-lg ${
                          m.status === 'IN_PROGRESS'
                            ? 'border-emerald-500/50 shadow-emerald-500/10'
                            : m.status === 'COMPLETED'
                            ? 'border-slate-800 hover:border-slate-700'
                            : 'border-slate-800/80'
                        }`}
                      >
                        {/* Board header */}
                        <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-mono">Board {m.boardNumber}</span>
                          <span
                            className={`font-semibold uppercase text-[10px] ${
                              m.status === 'IN_PROGRESS'
                                ? 'text-emerald-400 animate-pulse'
                                : m.status === 'COMPLETED'
                                ? 'text-slate-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>

                        {/* Player 1 (White) */}
                        <div
                          className={`p-3 flex items-center justify-between border-b border-slate-800/60 transition-colors ${
                            whiteWon ? 'bg-amber-500/10 text-amber-300 font-bold' : 'text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0 border border-slate-600"></span>
                            <span className="text-xs truncate">
                              {m.whitePlayer ? m.whitePlayer.fullName : <span className="text-slate-500 italic">TBD</span>}
                            </span>
                          </div>
                          {m.whitePlayer && (
                            <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0 ml-2">
                              {m.whitePlayer.rating}
                            </span>
                          )}
                        </div>

                        {/* Player 2 (Black) */}
                        <div
                          className={`p-3 flex items-center justify-between transition-colors ${
                            blackWon ? 'bg-amber-500/10 text-amber-300 font-bold' : 'text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 shrink-0 border border-slate-600"></span>
                            <span className="text-xs truncate">
                              {m.blackPlayer ? m.blackPlayer.fullName : <span className="text-slate-500 italic">TBD</span>}
                            </span>
                          </div>
                          {m.blackPlayer && (
                            <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0 ml-2">
                              {m.blackPlayer.rating}
                            </span>
                          )}
                        </div>

                        {/* Footer action bar */}
                        <div className="p-2 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <Link
                            to={`/matches/${m.id}`}
                            className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors px-1 py-0.5"
                          >
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Match Arena</span>
                          </Link>

                          {admin && m.status !== 'COMPLETED' && m.whitePlayerId && m.blackPlayerId && (
                            <button
                              onClick={() => openResultModal(m)}
                              className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                            >
                              Enter Result
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Admin Result Adjudication Modal */}
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
              <h3 className="text-lg font-bold text-white">Record Knockout Result</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Confirm winner for Board {selectedMatch.boardNumber} to advance to the next round.
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
                    onClick={() => {
                      setResultOutcome('WHITE_WIN');
                      setWinnerId(selectedMatch.whitePlayerId);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      resultOutcome === 'WHITE_WIN'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    White Wins
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResultOutcome('DRAW');
                      setWinnerId(selectedMatch.whitePlayerId);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      resultOutcome === 'DRAW'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    Draw (Playoff)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResultOutcome('BLACK_WIN');
                      setWinnerId(selectedMatch.blackPlayerId);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      resultOutcome === 'BLACK_WIN'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    Black Wins
                  </button>
                </div>
              </div>

              {/* If Draw, show PRD 7.1 Playoff resolution requirement */}
              {resultOutcome === 'DRAW' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                    PRD Knockout Draw Handling
                  </span>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Playoff Resolution Method</label>
                    <select
                      value={tiebreakMethod}
                      onChange={(e) => setTiebreakMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      <option value="Rapid Playoff (10+0)">Rapid Playoff (10+0)</option>
                      <option value="Blitz Playoff (3+2)">Blitz Playoff (3+2)</option>
                      <option value="Armageddon (5 min vs 4 min)">Armageddon Playoff</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Playoff Winner</label>
                    <select
                      value={winnerId}
                      onChange={(e) => setWinnerId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      <option value={selectedMatch.whitePlayerId}>
                        White: {selectedMatch.whitePlayer?.fullName}
                      </option>
                      <option value={selectedMatch.blackPlayerId}>
                        Black: {selectedMatch.blackPlayer?.fullName}
                      </option>
                    </select>
                  </div>
                </div>
              )}

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
                  {submittingResult ? 'Advancing...' : 'Confirm & Advance Winner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
