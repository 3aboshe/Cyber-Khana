import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NewDashboardPage from './pages/NewDashboardPage';
import NewChallengeDetailPage from './pages/NewChallengeDetailPage';
import EnhancedChallengesPage from './pages/EnhancedChallengesPage';
import CompetitionPage from './pages/CompetitionPage';
import CompetitionDashboardPage from './pages/CompetitionDashboardPage';
import CompetitionChallengeDetailPage from './pages/CompetitionChallengeDetailPage';
import CompetitionLeaderboardPage from './pages/CompetitionLeaderboardPage';
import EnhancedLeaderboardPage from './pages/EnhancedLeaderboardPage';
import NewLeaderboardPage from './pages/NewLeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AnnouncementsPage from './pages/AnnouncementsPage';
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

    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />
          <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
        </Routes>
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" />} />

        {user.role === 'super-admin' && (
          <Route path="/" element={<AdminLayout onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/admin/super" />} />
            <Route path="admin" element={<SuperAdminPage />} />
            <Route path="admin/super" element={<SuperAdminPage />} />
            <Route path="admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="admin/challenges" element={<AdminChallengesPage />} />
            <Route path="admin/competitions" element={<AdminCompetitionsPage />} />
            <Route path="admin/announcements" element={<AdminAnnouncementsPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="*" element={<Navigate to="/admin/super" />} />
          </Route>
        )}

        {user.role === 'admin' && (
          <Route path="/" element={<AdminLayout onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/admin" />} />
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="admin/challenges" element={<AdminChallengesPage />} />
            <Route path="admin/competitions" element={<AdminCompetitionsPage />} />
            <Route path="admin/announcements" element={<AdminAnnouncementsPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="*" element={<Navigate to="/admin" />} />
          </Route>
        )}

        {user.role === 'user' && (
          <Route path="/" element={<AppLayout onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<NewDashboardPage />} />
            <Route path="challenges" element={<EnhancedChallengesPage />} />
            <Route path="challenges/:id" element={<NewChallengeDetailPage />} />
            <Route path="competition" element={<CompetitionPage />} />
            <Route path="competition/:id" element={<CompetitionDashboardPage />} />
            <Route path="competition/:id/challenge/:challengeId" element={<CompetitionChallengeDetailPage />} />
            <Route path="competition/:id/leaderboard" element={<CompetitionLeaderboardPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="leaderboard" element={<NewLeaderboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Route>
        )}

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
