import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import NewDashboardPage from './pages/NewDashboardPage';
import NewChallengeDetailPage from './pages/NewChallengeDetailPage';
import ChallengesPage from './pages/ChallengesPage';
import CompetitionPage from './pages/CompetitionPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AppLayout from './components/AppLayout';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminChallengesPage from './pages/admin/AdminChallengesPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCompetitionsPage from './pages/admin/AdminCompetitionsPage';
import SuperAdminPage from './pages/admin/SuperAdminPage';
import Loader from './components/ui/Loader';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <Loader />
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={
            !user ? (
              <LoginPage onLogin={handleLogin} />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />

        {user && user.role === 'super-admin' && (
          <Route element={<AdminLayout onLogout={handleLogout} />}>
            <Route path="/admin/super" element={<SuperAdminPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/challenges" element={<AdminChallengesPage />} />
            <Route path="/admin/competitions" element={<AdminCompetitionsPage />} />
            <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="*" element={<Navigate to="/admin/super" />} />
          </Route>
        )}

        {user && user.role === 'admin' && (
          <Route element={<AdminLayout onLogout={handleLogout} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/challenges" element={<AdminChallengesPage />} />
            <Route path="/admin/competitions" element={<AdminCompetitionsPage />} />
            <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </Route>
        )}

        {user && user.role === 'user' && (
          <Route element={<AppLayout onLogout={handleLogout} />}>
            <Route path="/dashboard" element={<NewDashboardPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/challenges/:id" element={<NewChallengeDetailPage />} />
            <Route path="/competition" element={<CompetitionPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        )}

        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
