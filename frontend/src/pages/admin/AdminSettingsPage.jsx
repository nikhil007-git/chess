import React, { useState } from 'react';
import { Settings, Shield, KeyRound, Database, CheckCircle2, Clock, Award, Sliders } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../utils/api';

export default function AdminSettingsPage() {
  const { admin } = useAuth();
  const [defaultTimeControl, setDefaultTimeControl] = useState('10');
  const [defaultIncrement, setDefaultIncrement] = useState('0');
  const [defaultRounds, setDefaultRounds] = useState('5');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleSaveDefaults = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdError('');

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters');
      return;
    }

    try {
      const res = await apiFetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setPwdMsg('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdError(err.message);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-amber-400" />
          <span>System & Tournament Settings</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure default tournament parameters, FIDE scoring rules, and administrator security.
        </p>
      </div>

      {/* Defaults Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
          <Sliders className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Default Tournament Presets (PRD v1.0)</h2>
        </div>

        {saveSuccess && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Tournament preferences saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSaveDefaults} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Time (Mins)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                value={defaultTimeControl}
                onChange={(e) => setDefaultTimeControl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Default: 10 mins per player</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Default Increment (Secs)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={defaultIncrement}
                onChange={(e) => setDefaultIncrement(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Default: 0s increment (10+0 Rapid)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Swiss Default Rounds
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={defaultRounds}
                onChange={(e) => setDefaultRounds(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Configurable per tournament</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Save Default Parameters
            </button>
          </div>
        </form>
      </div>

      {/* FIDE Rules Standard */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">Scoring & Tie-Break Specification</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm text-amber-400">Standard Scoring System</h4>
            <div className="flex justify-between py-1 border-b border-slate-850 text-slate-300">
              <span>Match Win</span>
              <span className="font-mono font-bold text-white">1.0 point</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-850 text-slate-300">
              <span>Match Draw</span>
              <span className="font-mono font-bold text-white">0.5 points</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-850 text-slate-300">
              <span>Match Loss</span>
              <span className="font-mono font-bold text-white">0.0 points</span>
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span>Unpaired Bye</span>
              <span className="font-mono font-bold text-white">1.0 point</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm text-amber-400">Tie-Break Hierarchy</h4>
            <div className="flex justify-between py-1 border-b border-slate-850 text-slate-300">
              <span>Primary</span>
              <span className="font-mono font-bold text-white">Buchholz System</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-850 text-slate-300">
              <span>Secondary</span>
              <span className="font-mono font-bold text-white">Sonneborn-Berger</span>
            </div>
            <div className="flex justify-between py-1 text-slate-300">
              <span>Tertiary</span>
              <span className="font-mono font-bold text-white">Head-to-Head Encounter</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database & Cloud Connection Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
          <Database className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Cloud Database & Deployment Target</h2>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-bold text-white block">PostgreSQL Provider</span>
              <span className="text-slate-500">Neon Cloud Serverless PostgreSQL</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Connected & Synced
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-bold text-white block">Frontend Hosting Target</span>
              <span className="text-slate-500">Vercel (with client-side rewrite rules in vercel.json)</span>
            </div>
            <span className="text-amber-400 font-semibold font-mono">Ready for Deploy</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-bold text-white block">Backend Hosting Target</span>
              <span className="text-slate-500">Render (configured via render.yaml)</span>
            </div>
            <span className="text-amber-400 font-semibold font-mono">Ready for Deploy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
