import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './AppContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ChallengeDetailPage from './pages/ChallengeDetailPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AppLayout from './components/AppLayout';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminChallengesPage from './pages/admin/AdminChallengesPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import Loader from './components/ui/Loader';

const App: React.FC = () => {
  const [auth, setAuth] = useState<{ isAuthenticated: boolean; isAdmin: boolean }>({
    isAuthenticated: false,
    isAdmin: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const session = sessionStorage.getItem('auth');
    if (session) {
      setAuth(JSON.parse(session));
    }
    setTimeout(() => setIsLoading(false), 2000); // Increased loading time for effect
  }, []);

  const handleLogin = (isAdmin = false) => {
    const newAuth = { isAuthenticated: true, isAdmin };
    setAuth(newAuth);
    sessionStorage.setItem('auth', JSON.stringify(newAuth));
  };

  const handleLogout = () => {
    const newAuth = { isAuthenticated: false, isAdmin: false };
    setAuth(newAuth);
    sessionStorage.removeItem('auth');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <Loader />
      </div>
    );
  }

  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route
            path="/login"
            element={
              !auth.isAuthenticated ? (
                <LoginPage onLogin={handleLogin} />
              ) : (
                <Navigate to={auth.isAdmin ? '/admin' : '/dashboard'} />
              )
            }
          />

          {/* User Routes */}
          {auth.isAuthenticated && !auth.isAdmin && (
            <Route element={<AppLayout onLogout={handleLogout} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/challenges/:id" element={<ChallengeDetailPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Route>
          )}

          {/* Admin Routes */}
          {auth.isAuthenticated && auth.isAdmin && (
            <Route element={<AdminLayout onLogout={handleLogout} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/challenges" element={<AdminChallengesPage />} />
              <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="*" element={<Navigate to="/admin" />} />
            </Route>
          )}
          
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;