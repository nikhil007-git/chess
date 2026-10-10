import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-amber-400">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Verifying authorization...</span>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin-panel" replace />;
  }

  return <Outlet />;
}
