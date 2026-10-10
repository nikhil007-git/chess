import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Shield,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  X,
  History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Chessboard from '../components/Chessboard';

export default function MatchPage() {
  const { id } = useParams();
  const { admin } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live timer states (in seconds)
  const [whiteSeconds, setWhiteSeconds] = useState(600);
  const [blackSeconds, setBlackSeconds] = useState(600);
  const [clockStatus, setClockStatus] = useState('STOPPED');
  const [activePlayer, setActivePlayer] = useState('WHITE');

  // Time adjustment modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjWhite, setAdjWhite] = useState(600);
  const [adjBlack, setAdjBlack] = useState(600);
  const [adjReason, setAdjReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Fetch authoritative state from server
  const fetchMatchState = async () => {
    try {
      const res = await fetch(`/api/matches/${id}`);
      const data = await res.json();
      if (!data.error) {
        setMatch(data);
        if (data.authoritativeClock) {
          setWhiteSeconds(data.authoritativeClock.whiteTimeRemaining);
          setBlackSeconds(data.authoritativeClock.blackTimeRemaining);
          setClockStatus(data.authoritativeClock.clockStatus);
          setActivePlayer(data.authoritativeClock.activePlayer);
        }
      }
    } catch (err) {
      console.error('Failed to sync match state', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchState();
    // Poll server authoritative state every 3 seconds for reconnection resilience
    const pollInterval = setInterval(fetchMatchState, 3000);
    return () => clearInterval(pollInterval);
  }, [id]);

  // High precision local countdown ticker (100ms intervals)
  useEffect(() => {
    if (clockStatus !== 'RUNNING' || !activePlayer) return;

    const ticker = setInterval(() => {
      if (activePlayer === 'WHITE') {
        setWhiteSeconds((prev) => Math.max(0, prev - 0.1));
      } else if (activePlayer === 'BLACK') {
        setBlackSeconds((prev) => Math.max(0, prev - 0.1));
      }
    }, 100);

    return () => clearInterval(ticker);
  }, [clockStatus, activePlayer]);

  // Format seconds to MM:SS or MM:SS.S
  const formatTime = (secs) => {
    const totalSecs = Math.max(0, Math.floor(secs));
    const mins = Math.floor(totalSecs / 60);
    const remSecs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  const handleClockAction = async (action, extraParams = {}) => {
    try {
      const res = await fetch(`/api/admin/matches/${id}/clock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraParams }),
      });
      const data = await res.json();
      if (data.clockState) {
        setWhiteSeconds(data.clockState.whiteTimeRemaining);
        setBlackSeconds(data.clockState.blackTimeRemaining);
        setClockStatus(data.clockState.clockStatus);
        setActivePlayer(data.clockState.activePlayer);
      }
      fetchMatchState();
    } catch (err) {
      console.error('Clock action error', err);
    }
  };

  const handleMove = async (moveInfo) => {
    try {
      const res = await fetch(`/api/matches/${id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moveInfo),
      });
      const data = await res.json();
      if (data.authoritativeClock) {
        setWhiteSeconds(data.authoritativeClock.whiteTimeRemaining);
        setBlackSeconds(data.authoritativeClock.blackTimeRemaining);
        setClockStatus(data.authoritativeClock.clockStatus);
        setActivePlayer(data.authoritativeClock.activePlayer);
      }
      fetchMatchState();
    } catch (err) {
      console.error('Failed to submit move', err);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setAdjusting(true);
    try {
      await handleClockAction('ADJUST', {
        whiteSeconds: parseInt(adjWhite, 10),
        blackSeconds: parseInt(adjBlack, 10),
        reason: adjReason,
      });
      setIsAdjustModalOpen(false);
    } finally {
      setAdjusting(false);
    }
  };

  const handleQuickResult = async (result) => {
    try {
      await fetch(`/api/admin/matches/${id}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });
      fetchMatchState();
    } catch (err) {
      console.error('Result submit error', err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Connecting to Match Arena Clock...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        Match record not found.
      </div>
    );
  }

  const movesList = match.movesHistory ? JSON.parse(match.movesHistory) : [];
  const isWhiteLow = whiteSeconds < 30;
  const isBlackLow = blackSeconds < 30;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={match.tournament ? `/tournaments/${match.tournamentId}` : '/tournaments'}
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{match.tournament?.name || 'Tournament'}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Board {match.boardNumber} Arena</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                match.status === 'COMPLETED'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : clockStatus === 'RUNNING'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {match.status}
            </span>
          </h1>
        </div>

        {match.result && (
          <div className="bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-2xl flex items-center gap-2 text-amber-400 text-sm font-bold">
            <Trophy className="w-4 h-4" />
            <span>Final Result: {match.result.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {/* High-Contrast Match Clocks (PRD Section 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* White Player Clock */}
        <div
          className={`relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all flex flex-col justify-between ${
            activePlayer === 'WHITE' && clockStatus === 'RUNNING'
              ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/20'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-white border border-slate-400 shadow"></span>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  {match.whitePlayer?.fullName || 'White Player'}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Rating: {match.whitePlayer?.rating || 1200}
                </span>
              </div>
            </div>
            {activePlayer === 'WHITE' && clockStatus === 'RUNNING' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                On Move
              </span>
            )}
          </div>

          <div className="my-4 sm:my-6 text-center">
            <div
              className={`font-mono text-4xl sm:text-6xl font-black tracking-tight ${
                isWhiteLow && clockStatus === 'RUNNING'
                  ? 'text-red-400 animate-pulse'
                  : activePlayer === 'WHITE'
                  ? 'text-white'
                  : 'text-slate-400'
              }`}
            >
              {formatTime(whiteSeconds)}
            </div>
            {isWhiteLow && whiteSeconds > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 mt-1 inline-flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Time Trouble
              </span>
            )}
          </div>

          <div className="text-[11px] sm:text-xs text-slate-500 text-center font-mono">
            Time Control: {match.timeControlMinutes}m + {match.incrementSeconds}s
          </div>
        </div>

        {/* Black Player Clock */}
        <div
          className={`relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all flex flex-col justify-between ${
            activePlayer === 'BLACK' && clockStatus === 'RUNNING'
              ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/20'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-slate-950 border border-slate-600 shadow"></span>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  {match.blackPlayer?.fullName || 'Black Player'}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Rating: {match.blackPlayer?.rating || 1200}
                </span>
              </div>
            </div>
            {activePlayer === 'BLACK' && clockStatus === 'RUNNING' && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                On Move
              </span>
            )}
          </div>

          <div className="my-4 sm:my-6 text-center">
            <div
              className={`font-mono text-4xl sm:text-6xl font-black tracking-tight ${
                isBlackLow && clockStatus === 'RUNNING'
                  ? 'text-red-400 animate-pulse'
                  : activePlayer === 'BLACK'
                  ? 'text-white'
                  : 'text-slate-400'
              }`}
            >
              {formatTime(blackSeconds)}
            </div>
            {isBlackLow && blackSeconds > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 mt-1 inline-flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Time Trouble
              </span>
            )}
          </div>

          <div className="text-[11px] sm:text-xs text-slate-500 text-center font-mono">
            Time Control: {match.timeControlMinutes}m + {match.incrementSeconds}s
          </div>
        </div>
      </div>

      {/* Main Board & Moves History Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Playable Interactive Chessboard */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Playable Board (FIDE Validated)</span>
            <span>Click piece to view legal moves</span>
          </div>

          <Chessboard
            fen={match.currentFen}
            onMove={handleMove}
            disabled={match.status === 'COMPLETED'}
          />
        </div>

        {/* Moves Notation & Arbiter Controls Sidebar */}
        <div className="space-y-6">
          {/* Moves History Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>Move Notation</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">{movesList.length} ply</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 text-xs font-mono">
              {movesList.length === 0 ? (
                <p className="text-slate-500 py-6 text-center">No moves played yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {movesList.map((m, idx) => (
                    <div key={idx} className="flex gap-2 text-slate-300">
                      <span className="text-slate-500 w-6 text-right">
                        {idx % 2 === 0 ? `${Math.floor(idx / 2) + 1}.` : ''}
                      </span>
                      <span className="font-bold text-white">{m.san}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Arbiter Clock Controls (Admin) */}
          {admin && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-amber-400 pb-2 border-b border-slate-800">
                <Shield className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Official Arbiter Desk
                </h3>
              </div>

              {/* Main Clock Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {clockStatus === 'RUNNING' ? (
                  <button
                    onClick={() => handleClockAction('PAUSE')}
                    className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause Clock</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleClockAction('START')}
                    className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Clock</span>
                  </button>
                )}

                <button
                  onClick={() => handleClockAction('SWITCH')}
                  disabled={clockStatus !== 'RUNNING'}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Switch Turn</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAdjWhite(Math.floor(whiteSeconds));
                    setAdjBlack(Math.floor(blackSeconds));
                    setAdjReason('');
                    setIsAdjustModalOpen(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Adjust Clocks</span>
                </button>

                <button
                  onClick={() => handleClockAction('RESET')}
                  className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-400 hover:text-red-400 font-semibold text-xs"
                >
                  Reset
                </button>
              </div>

              {/* Quick Result Adjudication */}
              {match.status !== 'COMPLETED' && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Instant Result Recording
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleQuickResult('WHITE_WIN')}
                      className="py-1.5 rounded-lg bg-slate-950 hover:bg-amber-500 hover:text-slate-950 border border-slate-800 text-[11px] font-bold text-slate-200 transition-colors"
                    >
                      1 – 0
                    </button>
                    <button
                      onClick={() => handleQuickResult('DRAW')}
                      className="py-1.5 rounded-lg bg-slate-950 hover:bg-amber-500 hover:text-slate-950 border border-slate-800 text-[11px] font-bold text-slate-200 transition-colors"
                    >
                      ½ – ½
                    </button>
                    <button
                      onClick={() => handleQuickResult('BLACK_WIN')}
                      className="py-1.5 rounded-lg bg-slate-950 hover:bg-amber-500 hover:text-slate-950 border border-slate-800 text-[11px] font-bold text-slate-200 transition-colors"
                    >
                      0 – 1
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Adjust Time Modal (PRD Section 8.2) */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAdjustModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Sliders className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Adjust Match Clock</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Modify player countdown seconds. The reason will be permanently recorded in the audit log.
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    White (Seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adjWhite}
                    onChange={(e) => setAdjWhite(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Black (Seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adjBlack}
                    onChange={(e) => setAdjBlack(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Arbiter Reason *
                </label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Illegal move time penalty / clock glitch compensation"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  {adjusting ? 'Saving...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
