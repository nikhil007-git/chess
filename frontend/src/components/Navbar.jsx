import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Users, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { admin, logout } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Trophy className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block">
              CHESS<span className="text-amber-400">ARENA</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block -mt-1 font-semibold">
              Tournament Manager
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-4">
          <Link
            to="/tournaments"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              isActive('/tournaments')
                ? 'bg-slate-800 text-amber-400 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Tournaments</span>
          </Link>

          <Link
            to="/players"
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              isActive('/players')
                ? 'bg-slate-800 text-amber-400 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Players</span>
          </Link>

          {/* Admin link */}
          {admin ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <Link
                to="/admin-panel/dashboard"
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/admin-panel"
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
