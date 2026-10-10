import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit2, Archive, CheckCircle, AlertCircle, X, ShieldAlert } from 'lucide-react';

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    rating: 1200,
    club: '',
  });
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Archive confirmation modal
  const [playerToArchive, setPlayerToArchive] = useState(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const url = filterStatus === 'ALL' 
        ? `/api/admin/players?search=${encodeURIComponent(search)}`
        : `/api/admin/players?search=${encodeURIComponent(search)}&status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPlayers(data);
      }
    } catch (err) {
      console.error('Failed to fetch players:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [search, filterStatus]);

  const openAddModal = () => {
    setEditingPlayer(null);
    setFormData({
      fullName: '',
      username: '',
      email: '',
      rating: 1200,
      club: '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (player) => {
    setEditingPlayer(player);
    setFormData({
      fullName: player.fullName,
      username: player.username || '',
      email: player.email || '',
      rating: player.rating,
      club: player.club || '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      const payload = {
        fullName: formData.fullName,
        username: formData.username || undefined,
        email: formData.email || undefined,
        rating: parseInt(formData.rating, 10) || 1200,
        club: formData.club || undefined,
      };

      let res;
      if (editingPlayer) {
        res = await fetch(`/api/admin/players/${editingPlayer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || result.details?.[0] || 'Operation failed');
      }

      setIsModalOpen(false);
      fetchPlayers();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!playerToArchive) return;
    try {
      const res = await fetch(`/api/admin/players/${playerToArchive.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPlayerToArchive(null);
        fetchPlayers();
      }
    } catch (err) {
      console.error('Failed to archive player:', err);
    }
  };

  const handleReactivate = async (player) => {
    try {
      const res = await fetch(`/api/admin/players/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (res.ok) {
        fetchPlayers();
      }
    } catch (err) {
      console.error('Failed to reactivate player:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Player Roster Management</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Maintain competitor records, international/national ratings, and archival status.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Register New Player</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players by name, username, or club..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-750 border-slate-700/60 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'ACTIVE', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                filterStatus === st
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Player</th>
                <th className="px-6 py-4 font-semibold">Username / Email</th>
                <th className="px-6 py-4 font-semibold">Rating</th>
                <th className="px-6 py-4 font-semibold">Club / Org</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading players...</span>
                    </div>
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No players found matching your criteria.
                  </td>
                </tr>
              ) : (
                players.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-850/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{p.fullName}</div>
                      <div className="text-xs text-slate-500 font-mono">ID: {p.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300">{p.username ? `@${p.username}` : '—'}</div>
                      <div className="text-xs text-slate-500">{p.email || 'No email'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                        {p.rating}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {p.club || 'Independent'}
                    </td>
                    <td className="px-6 py-4">
                      {p.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit Player"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {p.status === 'ACTIVE' ? (
                          <button
                            onClick={() => setPlayerToArchive(p)}
                            title="Archive Player"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(p)}
                            title="Reactivate Player"
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors text-xs font-medium"
                          >
                            Reactivate
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

      {/* Add / Edit Player Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-1">
              {editingPlayer ? 'Edit Player Record' : 'Register Tournament Player'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Enter official player metadata for tournament pairings and rating calculation.
            </p>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Magnus Carlsen"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. magnusc"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Rating (Elo)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="3500"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. player@example.com"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Club or Affiliation
                </label>
                <input
                  type="text"
                  value={formData.club}
                  onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                  placeholder="e.g. Offerspill Chess Club"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingPlayer ? 'Update Player' : 'Create Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      {playerToArchive && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Archive Player</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to archive <strong className="text-white">{playerToArchive.fullName}</strong>?
            </p>
            <p className="text-xs text-slate-400 mt-2">
              In accordance with PRD guidelines, historical tournament match results will remain intact. The player will simply be hidden from new tournament registration.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPlayerToArchive(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-colors"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
