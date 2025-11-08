import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Search, Trophy, Ban, UserCheck, Shield, Users, MoreVertical } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  points: number;
  role: string;
  universityCode: string;
  isBanned: boolean;
  profileIcon?: string;
  solvedChallengesCount: number;
  createdAt: string;
}

const AVATAR_MAP: Record<string, { image: string; color: string }> = {
  'admin': { image: '/avatars/admin.svg', color: 'from-purple-500 to-indigo-600' },
  'user': { image: '/avatars/user.svg', color: 'from-blue-500 to-cyan-600' },
  'hacker': { image: '/avatars/hacker.svg', color: 'from-green-500 to-emerald-600' },
  'ninja': { image: '/avatars/ninja.svg', color: 'from-red-500 to-pink-600' },
  'warrior': { image: '/avatars/warrior.svg', color: 'from-orange-500 to-red-600' },
  'wizard': { image: '/avatars/wizard.svg', color: 'from-violet-500 to-purple-600' },
  'robot': { image: '/avatars/robot.svg', color: 'from-gray-500 to-zinc-600' },
  'alien': { image: '/avatars/alien.svg', color: 'from-cyan-500 to-blue-600' },
  'dragon': { image: '/avatars/dragon.svg', color: 'from-yellow-500 to-orange-600' },
  'phantom': { image: '/avatars/phantom.svg', color: 'from-indigo-500 to-purple-600' },
  'guardian': { image: '/avatars/guardian.svg', color: 'from-emerald-500 to-teal-600' },
  'shadow': { image: '/avatars/shadow.svg', color: 'from-slate-500 to-gray-600' },
};

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBanned, setFilterBanned] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      const parsedUser = userData ? JSON.parse(userData) : null;
      const universityCode = parsedUser?.role === 'admin' ? parsedUser.universityCode : undefined;

      const data = await userService.getUsers(universityCode);
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId: string) => {
    if (!confirm('Ban this user? They will be removed from the leaderboard.')) return;
    try {
      await userService.banUser(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: true } : u));
      setActionMenuOpen(null);
    } catch (err) {
      console.error('Error banning user:', err);
      alert('Failed to ban user');
    }
  };

  const handleUnban = async (userId: string) => {
    if (!confirm('Unban this user? They will be restored to the leaderboard.')) return;
    try {
      await userService.unbanUser(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: false } : u));
      setActionMenuOpen(null);
    } catch (err) {
      console.error('Error unbanning user:', err);
      alert('Failed to unban user');
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    if (!confirm('Promote this user to admin?')) return;
    try {
      const API_URL = '/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/users/promote/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to promote user');
      }

      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: 'admin' } : u));
      setActionMenuOpen(null);
    } catch (err: any) {
      console.error('Error promoting user:', err);
      alert(err.message || 'Failed to promote user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBanned = !filterBanned || user.isBanned;
    return matchesSearch && matchesBanned;
  });

  const getAvatarInfo = (profileIcon?: string) => {
    return AVATAR_MAP[profileIcon || 'hacker'] || AVATAR_MAP['hacker'];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">User Management</h1>
        <p className="text-zinc-400">Manage users in your university</p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            onClick={() => setFilterBanned(!filterBanned)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
              filterBanned
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            <Ban className="w-5 h-5" />
            {filterBanned ? 'Showing Banned' : 'Show Banned Only'}
          </button>
        </div>
      </Card>

      {/* Users Grid */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">No users found</p>
            <p className="text-zinc-500 text-sm mt-2">
              {filterBanned ? 'No banned users' : 'No active users'}
            </p>
          </Card>
        ) : (
          filteredUsers.map((user) => {
            const avatar = getAvatarInfo(user.profileIcon);
            return (
              <Card
                key={user._id}
                className={`p-4 transition-all ${
                  user.isBanned ? 'opacity-60 bg-zinc-900/50' : 'hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatar.color} p-2 flex-shrink-0 overflow-hidden`}>
                    <img
                      src={avatar.image}
                      alt="Avatar"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-zinc-100 truncate">
                        {user.username}
                      </h3>
                      {user.role === 'admin' && (
                        <Shield className="w-4 h-4 text-emerald-400" />
                      )}
                      {user.isBanned && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                          BANNED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-zinc-400 text-sm">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span>{user.points} points</span>
                      </div>
                      <span>{user.solvedChallengesCount} solved</span>
                      <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActionMenuOpen(actionMenuOpen === user._id ? null : user._id)}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </Button>

                    {actionMenuOpen === user._id && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 z-10">
                        {currentUser?.role === 'super-admin' && user.role === 'user' && (
                          <button
                            onClick={() => handlePromoteToAdmin(user._id)}
                            className="w-full px-4 py-2 text-left text-purple-400 hover:bg-zinc-700/50 flex items-center gap-2 rounded-t-lg"
                          >
                            <Shield className="w-4 h-4" />
                            Promote to Admin
                          </button>
                        )}
                        {!user.isBanned ? (
                          <button
                            onClick={() => handleBan(user._id)}
                            className={`w-full px-4 py-2 text-left text-red-400 hover:bg-zinc-700/50 flex items-center gap-2 ${currentUser?.role === 'super-admin' && user.role === 'user' ? '' : 'rounded-t-lg'}`}
                          >
                            <Ban className="w-4 h-4" />
                            Ban User
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnban(user._id)}
                            className={`w-full px-4 py-2 text-left text-emerald-400 hover:bg-zinc-700/50 flex items-center gap-2 ${currentUser?.role === 'super-admin' && user.role === 'user' ? '' : 'rounded-t-lg'}`}
                          >
                            <UserCheck className="w-4 h-4" />
                            Unban User
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-bold text-zinc-100 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Total Users</p>
            <p className="text-2xl font-bold text-zinc-100">{users.length}</p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Active Users</p>
            <p className="text-2xl font-bold text-zinc-100">
              {users.filter(u => !u.isBanned).length}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Banned Users</p>
            <p className="text-2xl font-bold text-red-400">
              {users.filter(u => u.isBanned).length}
            </p>
          </div>
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Admins</p>
            <p className="text-2xl font-bold text-emerald-400">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminUsersPage;
