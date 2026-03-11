import type { JSX } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import CompleteProfile from './pages/auth/CompleteProfile';
import DashboardOverview from './pages/dashboard/Overview';
import CGPACalculator from './pages/dashboard/calculator';
import StudyMaterials from './pages/dashboard/materials';
import StudyMatch from './pages/dashboard/studymatch';
import AdminDashboard from './pages/dashboard/admin';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { session, profile, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
    </div>
  );
  if (!session) return <Navigate to="/login" replace />;
  if (!profile?.university_id && window.location.pathname !== '/complete-profile') return <Navigate to="/complete-profile" replace />;
  return children;
};

const AuthRoute = ({ children }: { children: JSX.Element }) => {
  const { session, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
    </div>
  );
  if (session) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthRoute><Landing /></AuthRoute>} />
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
      <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
      <Route path="/dashboard/calculator" element={<ProtectedRoute><CGPACalculator /></ProtectedRoute>} />
      <Route path="/dashboard/materials" element={<ProtectedRoute><StudyMaterials /></ProtectedRoute>} />
      <Route path="/dashboard/studymatch" element={<ProtectedRoute><StudyMatch /></ProtectedRoute>} />
      <Route path="/dashboard/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
