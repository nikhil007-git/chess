import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Users, Shield, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { admin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/'));

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 sm:gap-3 group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white block leading-tight">
              CHESS<span className="text-amber-400">ARENA</span>
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
              Tournament Manager
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
          <Link
            to="/tournaments"
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
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
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              isActive('/players')
                ? 'bg-slate-800 text-amber-400 border border-slate-700'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Players</span>
          </Link>

          {/* Admin link - only displayed if already authenticated */}
          {admin && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <Link
                to="/admin-panel/dashboard"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </Link>
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {admin && (
            <Link
              to="/admin-panel/dashboard"
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Link
            to="/tournaments"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              isActive('/tournaments')
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Tournaments Directory</span>
          </Link>

          <Link
            to="/players"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
              isActive('/players')
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Competitor Roster</span>
          </Link>

          {/* Admin shortcuts in mobile drawer - only shown if authenticated */}
          {admin && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <Link
                to="/admin-panel/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold bg-amber-500 text-slate-950"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Admin Control Dashboard</span>
                </span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out ({admin.username})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
