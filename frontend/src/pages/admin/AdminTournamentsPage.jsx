import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Plus,
  Play,
  CheckCircle,
  Eye,
  Clock,
  Users,
  Swords,
  ChevronRight,
  AlertCircle,
  X,
  UserPlus,
  Trash2,
} from 'lucide-react';

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: 'SWISS',
    roundsCount: 5,
    timeControlPreset: 'rapid_10_0',
    timeControlMinutes: 10,
    incrementSeconds: 0,
    visibility: 'PUBLIC',
    selectedPlayerIds: [],
  });
  const [wizardError, setWizardError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick player creation inside wizard
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRating, setNewPlayerRating] = useState(1200);
  const [newPlayerClub, setNewPlayerClub] = useState('');
  const [addingQuickPlayer, setAddingQuickPlayer] = useState(false);

  // Manage participants modal
  const [manageTourney, setManageTourney] = useState(null);
  const [tourneyParticipants, setTourneyParticipants] = useState([]);
  const [selectedAddPlayerId, setSelectedAddPlayerId] = useState('');

  // Time control presets per PRD section 8.1
  const timePresets = [
    { id: 'rapid_10_0', name: '10+0 Rapid (Default)', minutes: 10, increment: 0 },
    { id: 'rapid_10_5', name: '10+5 Rapid', minutes: 10, increment: 5 },
    { id: 'rapid_15_10', name: '15+10 Rapid', minutes: 15, increment: 10 },
    { id: 'blitz_5_0', name: '5+0 Blitz', minutes: 5, increment: 0 },
    { id: 'blitz_3_0', name: '3+0 Blitz', minutes: 3, increment: 0 },
    { id: 'bullet_1_0', name: '1+0 Bullet', minutes: 1, increment: 0 },
    { id: 'custom', name: 'Custom Control', minutes: 10, increment: 0 },
  ];

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/tournaments');
      const data = await res.json();
      if (Array.isArray(data)) setTournaments(data);
    } catch (err) {
      console.error('Failed to fetch tournaments', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/admin/players?status=ACTIVE');
      const data = await res.json();
      if (Array.isArray(data)) setPlayers(data);
    } catch (err) {
      console.error('Failed to fetch active players', err);
    }
  };

  useEffect(() => {
    fetchTournaments();
    fetchPlayers();
  }, []);

  const openWizard = () => {
    setStep(1);
    setFormData({
      name: '',
      description: '',
      format: 'SWISS',
      roundsCount: 5,
      timeControlPreset: 'rapid_10_0',
      timeControlMinutes: 10,
      incrementSeconds: 0,
      visibility: 'PUBLIC',
      selectedPlayerIds: [],
    });
    setWizardError('');
    setIsWizardOpen(true);
  };

  const handlePresetChange = (presetId) => {
    const preset = timePresets.find((p) => p.id === presetId);
    if (preset) {
      setFormData({
        ...formData,
        timeControlPreset: presetId,
        timeControlMinutes: preset.minutes,
        incrementSeconds: preset.increment,
      });
    }
  };

  const togglePlayerSelection = (playerId) => {
    const set = new Set(formData.selectedPlayerIds);
    if (set.has(playerId)) {
      set.delete(playerId);
    } else {
      set.add(playerId);
    }
    setFormData({ ...formData, selectedPlayerIds: Array.from(set) });
  };

  const handleQuickAddPlayer = async (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    setAddingQuickPlayer(true);
    try {
      const res = await fetch('/api/admin/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newPlayerName.trim(),
          rating: parseInt(newPlayerRating, 10) || 1200,
          club: newPlayerClub.trim() || undefined,
        }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error || 'Failed to add player');

      // Update local player list & select this player
      setPlayers((prev) => [created, ...prev]);
      setFormData((prev) => ({
        ...prev,
        selectedPlayerIds: [...prev.selectedPlayerIds, created.id],
      }));
      setNewPlayerName('');
      setNewPlayerClub('');
      setNewPlayerRating(1200);
    } catch (err) {
      setWizardError(err.message);
    } finally {
      setAddingQuickPlayer(false);
    }
  };

  const handleCreateTournament = async () => {
    setWizardError('');
    setSubmitting(true);
    try {
      if (!formData.name.trim()) throw new Error('Tournament name is required');

      const initialStatus = formData.selectedPlayerIds.length >= 2 ? 'UPCOMING' : 'DRAFT';

      const res = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          format: formData.format,
          status: initialStatus,
          visibility: formData.visibility,
          roundsCount: parseInt(formData.roundsCount, 10) || 5,
          timeControlMinutes: parseInt(formData.timeControlMinutes, 10) || 10,
          incrementSeconds: parseInt(formData.incrementSeconds, 10) || 0,
          playerIds: formData.selectedPlayerIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create tournament');

      setIsWizardOpen(false);
      fetchTournaments();
    } catch (err) {
      setWizardError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (tourneyId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/tournaments/${tourneyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchTournaments();
    } catch (err) {
      console.error('Failed to change tournament status', err);
    }
  };

  const openManageParticipants = async (tourney) => {
    setManageTourney(tourney);
    try {
      const res = await fetch(`/api/tournaments/${tourney.id}`);
      const data = await res.json();
      setTourneyParticipants(data.participants || []);
    } catch (err) {
      console.error('Failed to load participants', err);
    }
  };

  const handleAddParticipantToTournament = async () => {
    if (!selectedAddPlayerId || !manageTourney) return;
    try {
      const res = await fetch(`/api/admin/tournaments/${manageTourney.id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: [selectedAddPlayerId] }),
      });
      if (res.ok) {
        setSelectedAddPlayerId('');
        openManageParticipants(manageTourney);
        fetchTournaments();
      }
    } catch (err) {
      console.error('Failed to add participant', err);
    }
  };

  const handleRemoveParticipant = async (playerId) => {
    if (!manageTourney) return;
    try {
      const res = await fetch(`/api/admin/tournaments/${manageTourney.id}/participants/${playerId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        openManageParticipants(manageTourney);
        fetchTournaments();
      }
    } catch (err) {
      console.error('Failed to remove participant', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Tournaments Management</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create events, configure Swiss and Knockout pairing rules, and manage lifecycle.
          </p>
        </div>
        <button
          onClick={openWizard}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Tournament Wizard</span>
        </button>
      </div>

      {/* Tournaments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>Loading tournaments...</span>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-4">
            <Trophy className="w-12 h-12 text-amber-400/50 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Tournaments Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your database is clean. Click the button below to create your first tournament!
            </p>
            <button
              onClick={openWizard}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Tournament Now</span>
            </button>
          </div>
        ) : (
          tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-lg font-bold text-white">{t.name}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      t.status === 'IN_PROGRESS'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : t.status === 'COMPLETED'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : t.status === 'UPCOMING'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                    {t.format.replace('_', ' ')}
                  </span>
                </div>
                {t.description && <p className="text-xs text-slate-400 max-w-2xl">{t.description}</p>}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <strong>{t._count?.participants || 0}</strong> Participants
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {t.timeControlMinutes} min + {t.incrementSeconds}s
                  </span>
                  <span>•</span>
                  <span>{t.roundsCount} Rounds Planned</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => openManageParticipants(t)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Participants</span>
                </button>

                {t.format === 'SWISS' ? (
                  <Link
                    to={`/tournaments/${t.id}/standings`}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Standings</span>
                  </Link>
                ) : (
                  <Link
                    to={`/tournaments/${t.id}/bracket`}
                    className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                  >
                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bracket</span>
                  </Link>
                )}

                <Link
                  to={`/tournaments/${t.id}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Public View</span>
                </Link>

                {t.status === 'DRAFT' && (
                  <button
                    onClick={() => handleStatusChange(t.id, 'UPCOMING')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>Publish Event</span>
                  </button>
                )}
                {t.status === 'UPCOMING' && (
                  <button
                    onClick={() => handleStatusChange(t.id, 'IN_PROGRESS')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Tournament</span>
                  </button>
                )}
                {t.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleStatusChange(t.id, 'COMPLETED')}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Finalize</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Guided Tournament Creation Modal Wizard */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-2xl p-4 sm:p-8 shadow-2xl relative max-h-[92vh] flex flex-col">
            <button
              onClick={() => setIsWizardOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Step indicators */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 border-b border-slate-800 pb-3 sm:pb-4 overflow-x-auto no-scrollbar">
              <span className={`text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap ${step === 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                1. General
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className={`text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap ${step === 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                2. Clock & Rules
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className={`text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap ${step === 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                3. Players ({formData.selectedPlayerIds.length})
              </span>
            </div>

            {wizardError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{wizardError}</span>
              </div>
            )}

            {/* Scrollable Step Content */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-5">
              {/* Step 1: General & Format */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Tournament Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. World Rapid Championship 2026"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Tournament details, location, prize pool, or arbiter instructions"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Tournament Format *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, format: 'SWISS' })}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          formData.format === 'SWISS'
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <h4 className="font-bold text-sm text-white mb-1">Swiss System</h4>
                        <p className="text-xs text-slate-400">
                          Players play fixed rounds without elimination. FIDE score pairing with color balancing.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, format: 'SINGLE_ELIMINATION' })}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          formData.format === 'SINGLE_ELIMINATION'
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <h4 className="font-bold text-sm text-white mb-1">Single Elimination</h4>
                        <p className="text-xs text-slate-400">
                          Knockout bracket. Winners advance atomically; draw handling playoffs applied.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Clock & Rules */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Time Control Preset (PRD Default: 10+0 Rapid)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {timePresets.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handlePresetChange(p.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                            formData.timeControlPreset === p.id
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.timeControlPreset === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Minutes per Player
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={formData.timeControlMinutes}
                          onChange={(e) => setFormData({ ...formData, timeControlMinutes: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Increment (seconds)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={formData.incrementSeconds}
                          onChange={(e) => setFormData({ ...formData, incrementSeconds: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white"
                        />
                      </div>
                    </div>
                  )}

                  {formData.format === 'SWISS' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Number of Rounds *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formData.roundsCount}
                        onChange={(e) => setFormData({ ...formData, roundsCount: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Participants Selection & Quick Add */}
              {step === 3 && (
                <div className="space-y-5">
                  {/* Quick Add Player Form */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Quick Register Player into Roster</span>
                    </span>
                    <form onSubmit={handleQuickAddPlayer} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Player Full Name"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                      <input
                        type="number"
                        placeholder="Rating"
                        value={newPlayerRating}
                        onChange={(e) => setNewPlayerRating(e.target.value)}
                        className="w-24 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Club (optional)"
                        value={newPlayerClub}
                        onChange={(e) => setNewPlayerClub(e.target.value)}
                        className="w-32 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                      <button
                        type="submit"
                        disabled={addingQuickPlayer || !newPlayerName.trim()}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                      >
                        {addingQuickPlayer ? 'Adding...' : 'Add Player'}
                      </button>
                    </form>
                  </div>

                  {/* Select from existing players */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Select Participants ({formData.selectedPlayerIds.length} selected)
                      </span>
                      {players.length > 0 && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, selectedPlayerIds: players.map((p) => p.id) })}
                            className="text-amber-400 hover:underline"
                          >
                            Select All
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, selectedPlayerIds: [] })}
                            className="text-slate-400 hover:text-white"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    {players.length === 0 ? (
                      <div className="border border-slate-800 rounded-2xl bg-slate-950 p-6 text-center text-xs text-slate-500">
                        No players registered yet. Use the quick form above to add competitors!
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950 divide-y divide-slate-800/60 p-1">
                        {players.map((p) => {
                          const isSelected = formData.selectedPlayerIds.includes(p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => togglePlayerSelection(p.id)}
                              className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                                isSelected ? 'bg-amber-500/10 text-white' : 'hover:bg-slate-900 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="rounded border-slate-700 text-amber-500 focus:ring-0"
                                />
                                <div>
                                  <div className="font-semibold text-sm">{p.fullName}</div>
                                  <div className="text-xs text-slate-500">{p.club || 'Independent'}</div>
                                </div>
                              </div>
                              <span className="font-mono text-xs font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {p.rating}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Navigation Footer */}
            <div className="pt-6 border-t border-slate-800 flex justify-between gap-3 mt-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
                >
                  Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !formData.name.trim()) {
                      setWizardError('Please provide a tournament name');
                      return;
                    }
                    setWizardError('');
                    setStep(step + 1);
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCreateTournament}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Tournament'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manage Participants Modal */}
      {manageTourney && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setManageTourney(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              Participants: {manageTourney.name}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Add or remove registered competitors for this tournament.
            </p>

            {/* Add player selector */}
            <div className="flex gap-2 mb-4">
              <select
                value={selectedAddPlayerId}
                onChange={(e) => setSelectedAddPlayerId(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="">Select a player from roster to register...</option>
                {players
                  .filter((p) => !tourneyParticipants.some((tp) => tp.playerId === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (Elo: {p.rating})
                    </option>
                  ))}
              </select>
              <button
                onClick={handleAddParticipantToTournament}
                disabled={!selectedAddPlayerId}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {/* Current participants list */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-60 border border-slate-800 rounded-2xl p-2 bg-slate-950">
              {tourneyParticipants.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No participants registered yet.</p>
              ) : (
                tourneyParticipants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white">{p.player?.fullName}</span>
                      <span className="text-slate-500 ml-2">Rating: {p.initialRating}</span>
                    </div>
                    {manageTourney.status !== 'IN_PROGRESS' && manageTourney.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleRemoveParticipant(p.playerId)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        title="Remove Participant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setManageTourney(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
