import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { challengeService } from '../../services/challengeService';
import { competitionService } from '../../services/competitionService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import { Copy, Building2 } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalChallenges: 0,
    totalCompetitions: 0,
    activeCompetitions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [users, challenges, competitions] = await Promise.all([
        userService.getUsers(),
        challengeService.getChallenges(),
        competitionService.getCompetitions(),
      ]);

      setStats({
        totalUsers: users.length,
        totalChallenges: challenges.length,
        totalCompetitions: competitions.length,
        activeCompetitions: competitions.filter((c: any) => c.status === 'active').length,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-zinc-100 mb-6">Admin Dashboard</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-zinc-400 text-sm font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-zinc-100">{stats.totalUsers}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-zinc-400 text-sm font-semibold mb-2">Total Challenges</h3>
          <p className="text-3xl font-bold text-zinc-100">{stats.totalChallenges}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-zinc-400 text-sm font-semibold mb-2">Total Competitions</h3>
          <p className="text-3xl font-bold text-zinc-100">{stats.totalCompetitions}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-zinc-400 text-sm font-semibold mb-2">Active Competitions</h3>
          <p className="text-3xl font-bold text-emerald-400">{stats.activeCompetitions}</p>
        </Card>
      </div>

      <h2 className="text-2xl font-bold text-zinc-100 mb-4">Quick Actions</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-bold text-zinc-100 mb-2">Challenge Management</h3>
          <p className="text-zinc-400 mb-4">Create, edit, and manage challenges for your university</p>
          <Button onClick={() => navigate('/admin/challenges')}>Manage Challenges</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold text-zinc-100 mb-2">Competition Management</h3>
          <p className="text-zinc-400 mb-4">Create and manage competitions with security codes</p>
          <Button onClick={() => navigate('/admin/competitions')}>Manage Competitions</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold text-zinc-100 mb-2">User Management</h3>
          <p className="text-zinc-400 mb-4">View and manage users in your university</p>
          <Button onClick={() => navigate('/admin/users')}>Manage Users</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-bold text-zinc-100 mb-2">Announcements</h3>
          <p className="text-zinc-400 mb-4">Post announcements for your university</p>
          <Button onClick={() => navigate('/admin/announcements')}>Manage Announcements</Button>
        </Card>
      </div>

      {/* Super Admin Section - Only visible to super admins */}
      {user?.role === 'super-admin' && (
        <>
          <h2 className="text-2xl font-bold text-zinc-100 mb-4 mt-8">Super Admin Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-zinc-100">University Management</h3>
              </div>
              <p className="text-zinc-400 mb-4">Manage universities and their settings</p>
              <Button onClick={() => navigate('/admin/super')} className="bg-purple-600 hover:bg-purple-700">
                Manage Universities
              </Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Copy className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-zinc-100">Copy Challenge</h3>
              </div>
              <p className="text-zinc-400 mb-4">Copy challenges from one university to another</p>
              <Button onClick={() => navigate('/admin/super')} className="bg-blue-600 hover:bg-blue-700">
                <Copy className="w-4 h-4 mr-2" />
                Copy Challenge
              </Button>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
