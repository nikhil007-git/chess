import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, Swords, Settings, LogOut, ArrowLeft, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin-panel');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin-panel/dashboard', icon: LayoutDashboard },
    { name: 'Tournaments', path: '/admin-panel/tournaments', icon: Trophy },
    { name: 'Players', path: '/admin-panel/players', icon: Users },
    { name: 'Matches & Results', path: '/admin-panel/matches', icon: Swords },
    { name: 'Settings', path: '/admin-panel/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Top Header for Admin Panel */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="font-bold text-white text-xs">Arbiter Control</h2>
            <span className="text-[10px] text-amber-400 font-mono">@{admin?.username || 'admin'}</span>
          </div>
        </div>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
          aria-label="Toggle admin navigation"
        >
          {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Sidebar: Desktop Sticky Sidebar & Mobile Collapsible Menu */}
      <aside
        className={`${
          mobileNavOpen ? 'block' : 'hidden'
        } md:flex w-full md:w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0 md:min-h-screen`}
      >
        <div className="hidden md:flex p-5 border-b border-slate-800 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Arbiter Control</h2>
              <span className="text-xs text-amber-400 font-medium">{admin?.username || 'Admin'}</span>
            </div>
          </div>
        </div>

        <nav className="p-3 sm:p-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 sm:p-4 border-t border-slate-800 space-y-2">
          <NavLink
            to="/"
            onClick={() => setMobileNavOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Website</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
