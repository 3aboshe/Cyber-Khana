import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Search, Ban, UserCheck, Shield, Users, MoreVertical, School, KeyRound, X, Trophy, MinusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirmation } from '../../src/contexts/ConfirmationContext';
import { useToast } from '../../src/hooks/useToast';

interface User {
  _id: string;
  username: string;
  fullName?: string;
  displayName?: string;
  points: number;
  role: string;
  universityCode: string;
  universityName?: string;
  isBanned: boolean;
  profileIcon?: string;
  solvedChallengesCount: number;
  createdAt: string;
}

interface Competition {
  _id: string;
  name: string;
  status: string;
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
  const [universityFilter, setUniversityFilter] = useState<string>('all');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Confirmation and toast hooks
  const { confirm } = useConfirmation();
  const { toast, ToastContainer } = useToast();

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Deduct points state
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [deductUserId, setDeductUserId] = useState('');
  const [deductUsername, setDeductUsername] = useState('');
  const [deductPoints, setDeductPoints] = useState('');
  const [deductReason, setDeductReason] = useState('');
  const [deductType, setDeductType] = useState<'general' | 'competition'>('general');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [deducting, setDeducting] = useState(false);

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
    const confirmed = await confirm(
      'Ban this user? They will be removed from the leaderboard.',
      {
        type: 'warning',
        title: 'Ban User',
        confirmText: 'Ban',
        isDestructive: true,
      }
    );
    if (!confirmed) return;

    try {
      await userService.banUser(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: true } : u));
      setActionMenuOpen(null);
      toast('success', 'User banned successfully');
    } catch (err) {
      console.error('Error banning user:', err);
      toast('error', 'Failed to ban user');
    }
  };

  const handleUnban = async (userId: string) => {
    const confirmed = await confirm(
      'Unban this user? They will be restored to the leaderboard.',
      {
        type: 'info',
        title: 'Unban User',
        confirmText: 'Unban',
      }
    );
    if (!confirmed) return;

    try {
      await userService.unbanUser(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: false } : u));
      setActionMenuOpen(null);
      toast('success', 'User unbanned successfully');
    } catch (err) {
      console.error('Error unbanning user:', err);
      toast('error', 'Failed to unban user');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    const confirmed = await confirm(
      `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      {
        type: 'danger',
        title: 'Delete User',
        confirmText: 'Delete',
        isDestructive: true,
      }
    );
    if (!confirmed) return;

    try {
      await userService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      setActionMenuOpen(null);
      toast('success', 'User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      toast('error', 'Failed to delete user');
    }
  };

  const handlePromoteToAdmin = async (userId: string) => {
    const confirmed = await confirm(
      'Promote this user to admin?',
      {
        type: 'info',
        title: 'Promote to Admin',
        confirmText: 'Promote',
      }
    );
    if (!confirmed) return;

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
      toast('success', 'User promoted to admin');
    } catch (err: any) {
      console.error('Error promoting user:', err);
      toast('error', err.message || 'Failed to promote user');
    }
  };

  const handleDemoteFromAdmin = async (userId: string) => {
    const confirmed = await confirm(
      'Demote this admin back to user?',
      {
        type: 'warning',
        title: 'Demote Admin',
        confirmText: 'Demote',
      }
    );
    if (!confirmed) return;

    try {
      const API_URL = '/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/users/demote/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to demote admin');
      }

      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: 'user' } : u));
      setActionMenuOpen(null);
      toast('success', 'Admin demoted to user');
    } catch (err: any) {
      console.error('Error demoting admin:', err);
      toast('error', err.message || 'Failed to demote admin');
    }
  };

  const handleChangePassword = async (userId: string, username: string) => {
    setTargetUserId(userId);
    setTargetUsername(username);
    setNewPassword('');
    setShowPasswordModal(true);
    setActionMenuOpen(null);
  };

  const submitPasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast('warning', 'Password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const API_URL = '/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/users/change-password/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      setShowPasswordModal(false);
      setNewPassword('');
      setTargetUserId('');
      setTargetUsername('');
      toast('success', 'Password changed successfully!');
    } catch (err: any) {
      console.error('Error changing password:', err);
      toast('error', err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Fetch competitions for the deduct modal
  const fetchCompetitions = async () => {
    try {
      const API_URL = '/api';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/competitions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCompetitions(data);
      }
    } catch (err) {
      console.error('Error fetching competitions:', err);
    }
  };

  const handleOpenDeductModal = async (userId: string, username: string) => {
    setDeductUserId(userId);
    setDeductUsername(username);
    setDeductPoints('');
    setDeductReason('');
    setDeductType('general');
    setSelectedCompetitionId('');
    setShowDeductModal(true);
    setActionMenuOpen(null);
    await fetchCompetitions();
  };

  const handleDeductPoints = async () => {
    const points = parseInt(deductPoints);
    if (!points || points <= 0) {
      toast('warning', 'Please enter a valid positive number of points');
      return;
    }

    if (deductType === 'competition' && !selectedCompetitionId) {
      toast('warning', 'Please select a competition');
      return;
    }

    setDeducting(true);
    try {
      const API_URL = '/api';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/users/${deductUserId}/deduct-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          points,
          reason: deductReason || 'Points deduction by admin',
          type: deductType,
          competitionId: deductType === 'competition' ? selectedCompetitionId : undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to deduct points');
      }

      const result = await response.json();
      toast('success', result.message);
      setShowDeductModal(false);
      
      // Refresh users list to update points
      await fetchUsers();
    } catch (err: any) {
      console.error('Error deducting points:', err);
      toast('error', err.message || 'Failed to deduct points');
    } finally {
      setDeducting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    // Search by username or full name
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      user.username.toLowerCase().includes(searchLower) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchLower)) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchLower));
    
    const matchesBanned = !filterBanned || user.isBanned;
    
    // University filter (super-admin only)
    const matchesUniversity = universityFilter === 'all' || user.universityCode === universityFilter;
    
    return matchesSearch && matchesBanned && matchesUniversity;
  });

  // Get unique universities for filter dropdown
  const universities = Array.from(new Set(users.map(u => u.universityCode))).sort();

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
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search by username or full name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {currentUser?.role === 'super-admin' && (
            <div>
              <select
                value={universityFilter}
                onChange={(e) => setUniversityFilter(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Universities</option>
                {universities.map(uni => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>
          )}
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
                        {user.fullName 
                          ? (user.fullName.length > 30 
                              ? user.fullName.substring(0, 30) + '...' 
                              : user.fullName)
                          : user.displayName || user.username}
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
                    {user.fullName && (
                      <p className="text-zinc-400 text-xs">@{user.username}</p>
                    )}
                    <div className="flex items-center gap-4 text-zinc-400 text-sm">
                      {currentUser?.role === 'super-admin' && (
                        <div className="flex items-center gap-1">
                          <School className="w-4 h-4 text-blue-400" />
                          <span>{user.universityName || user.universityCode}</span>
                        </div>
                      )}
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
                        {currentUser?.role === 'super-admin' && user.role === 'admin' && (
                          <button
                            onClick={() => handleDemoteFromAdmin(user._id)}
                            className="w-full px-4 py-2 text-left text-orange-400 hover:bg-zinc-700/50 flex items-center gap-2 rounded-t-lg"
                          >
                            <UserCheck className="w-4 h-4" />
                            Demote to User
                          </button>
                        )}
                        {currentUser?.role === 'super-admin' && (
                          <button
                            onClick={() => handleChangePassword(user._id, user.username)}
                            className="w-full px-4 py-2 text-left text-blue-400 hover:bg-zinc-700/50 flex items-center gap-2 rounded-t-lg"
                          >
                            <KeyRound className="w-4 h-4" />
                            Change Password
                          </button>
                        )}
                        {user.role === 'user' && (
                          <button
                            onClick={() => handleOpenDeductModal(user._id, user.username)}
                            className="w-full px-4 py-2 text-left text-amber-400 hover:bg-zinc-700/50 flex items-center gap-2"
                          >
                            <MinusCircle className="w-4 h-4" />
                            Deduct Points
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
                        {currentUser?.role === 'super-admin' && (
                          <button
                            onClick={() => handleDeleteUser(user._id, user.username)}
                            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-500/20 flex items-center gap-2 rounded-b-lg border-t border-zinc-700"
                          >
                            <X className="w-4 h-4" />
                            Delete User
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

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-100">Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-zinc-400 mb-4">
                Changing password for user: <span className="text-zinc-200 font-semibold">{targetUsername}</span>
              </p>

              <div className="mb-6">
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-md placeholder-zinc-500 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={changingPassword}
                  autoComplete="new-password"
                  name="new-password-field"
                />
                <p className="text-zinc-500 text-xs mt-1">Password must be at least 6 characters long</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowPasswordModal(false)}
                  variant="ghost"
                  className="flex-1"
                  disabled={changingPassword}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitPasswordChange}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!newPassword || newPassword.length < 6 || changingPassword}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deduct Points Modal */}
      <AnimatePresence>
        {showDeductModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-100">Deduct Points</h3>
                <button
                  onClick={() => setShowDeductModal(false)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-zinc-400 mb-4">
                Deducting points from: <span className="text-zinc-200 font-semibold">{deductUsername}</span>
              </p>

              {/* Deduct Type Selection */}
              <div className="mb-4">
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  Deduct From
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeductType('general')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      deductType === 'general'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    General Leaderboard
                  </button>
                  <button
                    onClick={() => setDeductType('competition')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      deductType === 'competition'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    Competition
                  </button>
                </div>
              </div>

              {/* Competition Selection (if competition type) */}
              {deductType === 'competition' && (
                <div className="mb-4">
                  <label className="block text-zinc-300 text-sm font-medium mb-2">
                    Select Competition
                  </label>
                  <select
                    value={selectedCompetitionId}
                    onChange={(e) => setSelectedCompetitionId(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select a competition --</option>
                    {competitions.map((comp) => (
                      <option key={comp._id} value={comp._id}>
                        {comp.name} ({comp.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Points to Deduct */}
              <div className="mb-4">
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  Points to Deduct
                </label>
                <Input
                  type="number"
                  value={deductPoints}
                  onChange={(e) => setDeductPoints(e.target.value)}
                  placeholder="Enter points (e.g., 500)"
                  className="w-full"
                  min="1"
                  disabled={deducting}
                />
              </div>

              {/* Reason */}
              <div className="mb-6">
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  Reason (Optional)
                </label>
                <Input
                  type="text"
                  value={deductReason}
                  onChange={(e) => setDeductReason(e.target.value)}
                  placeholder="e.g., Rule violation, Cheating, etc."
                  className="w-full"
                  disabled={deducting}
                />
                <p className="text-zinc-500 text-xs mt-1">This will be recorded in the user's penalty history</p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowDeductModal(false)}
                  variant="ghost"
                  className="flex-1"
                  disabled={deducting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeductPoints}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={!deductPoints || parseInt(deductPoints) <= 0 || (deductType === 'competition' && !selectedCompetitionId) || deducting}
                >
                  {deducting ? 'Deducting...' : 'Deduct Points'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ToastContainer />
    </div>
  );
};

export default AdminUsersPage;
