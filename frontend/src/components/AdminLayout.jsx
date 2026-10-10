import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, Swords, Settings, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

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
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Admin Control</h2>
              <span className="text-xs text-amber-400 font-medium">{admin?.username || 'Admin'} ({admin?.role || 'SUPER_ADMIN'})</span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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

        <div className="p-4 border-t border-slate-800 space-y-2">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-md transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
