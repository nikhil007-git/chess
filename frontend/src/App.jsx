import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import HomePage from './pages/HomePage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import StandingsPage from './pages/StandingsPage';
import PairingsPage from './pages/PairingsPage';
import BracketPage from './pages/BracketPage';
import MatchPage from './pages/MatchPage';
import PlayersPage from './pages/PlayersPage';
import PlayerDetailPage from './pages/PlayerDetailPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminTournamentsPage from './pages/admin/AdminTournamentsPage';
import AdminPlayersPage from './pages/admin/AdminPlayersPage';
import AdminMatchesPage from './pages/admin/AdminMatchesPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

export default function App() {
  return (
    <Routes>
      {/* Public Pages Layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
        <Route path="/tournaments/:id/standings" element={<StandingsPage />} />
        <Route path="/tournaments/:id/pairings" element={<PairingsPage />} />
        <Route path="/tournaments/:id/bracket" element={<BracketPage />} />
        <Route path="/matches/:id" element={<MatchPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/players/:id" element={<PlayerDetailPage />} />
      </Route>

      {/* Admin Login Portal */}
      <Route path="/admin-panel" element={<AdminLoginPage />} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/admin-panel" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="tournaments" element={<AdminTournamentsPage />} />
          <Route path="players" element={<AdminPlayersPage />} />
          <Route path="matches" element={<AdminMatchesPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
