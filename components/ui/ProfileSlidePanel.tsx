import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trophy, Target, Clock, Award, Flag, Zap } from 'lucide-react';
import { userService } from '../../services/userService';

interface SolvedChallenge {
  _id: string;
  title: string;
  category: string;
  points: number;
  solvedAt: string;
  competitionName?: string;
}

interface UserProfile {
  _id: string;
  username: string;
  fullName?: string;
  displayName?: string;
  universityName?: string;
  totalPoints: number;
  rank: number;
  totalUsers: number;
  totalSolved: number;
  regularSolvedCount: number;
  competitionSolvedCount: number;
  regularSolvedChallenges: SolvedChallenge[];
  competitionSolvedChallenges: SolvedChallenge[];
}

interface ProfileSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    username: string;
    points: number;
    solvedChallenges: number;
    universityCode?: string;
    fullName?: string;
    displayName?: string;
    totalTimeHours?: number;
    averageSolveTimeHours?: number;
    _id?: string;
  } | null;
  rank?: number;
  totalChallenges?: number;
}

const ProfileSlidePanel: React.FC<ProfileSlidePanelProps> = ({ isOpen, onClose, user, rank, totalChallenges }) => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (isOpen && user?._id) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [isOpen, user?._id]);

  const fetchUserProfile = async () => {
    if (!user?._id) return;
    setLoadingProfile(true);
    try {
      const profile = await userService.getPublicProfile(user._id);
      setUserProfile(profile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Web': 'bg-blue-500/20 text-blue-400',
      'Web Exploitation': 'bg-blue-500/20 text-blue-400',
      'Crypto': 'bg-purple-500/20 text-purple-400',
      'Cryptography': 'bg-purple-500/20 text-purple-400',
      'Pwn': 'bg-red-500/20 text-red-400',
      'Binary Exploitation': 'bg-red-500/20 text-red-400',
      'Reverse': 'bg-orange-500/20 text-orange-400',
      'Reverse Engineering': 'bg-orange-500/20 text-orange-400',
      'Forensics': 'bg-green-500/20 text-green-400',
      'Misc': 'bg-zinc-500/20 text-zinc-400',
      'Miscellaneous': 'bg-zinc-500/20 text-zinc-400',
      'OSINT': 'bg-cyan-500/20 text-cyan-400',
    };
    return colors[category] || 'bg-zinc-500/20 text-zinc-400';
  };
  
  if (!isOpen || !user) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-700 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-700 sticky top-0 bg-zinc-900 z-10">
            <h2 className="text-2xl font-bold text-zinc-100">User Profile</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-zinc-700">
                  {(user.fullName || user.displayName || user.username).charAt(0).toUpperCase()}
                </div>
                <h3 className="text-2xl font-bold text-zinc-100 mb-1 truncate max-w-[280px] mx-auto" title={user.fullName || user.displayName || user.username}>
                  {user.fullName || user.displayName || user.username}
                </h3>
                <p className="text-zinc-400">@{user.username}</p>
                {userProfile?.universityName && (
                  <p className="text-zinc-500 text-sm mt-1">{userProfile.universityName}</p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                {rank && (
                  <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="text-zinc-400 text-sm">Rank</span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-100">#{rank}</div>
                  </div>
                )}

                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span className="text-zinc-400 text-sm">Points</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">{user.points}</div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    <span className="text-zinc-400 text-sm">Solved</span>
                  </div>
                  <div className="text-2xl font-bold text-zinc-100">
                    {user.solvedChallenges}
                    {totalChallenges && <span className="text-sm text-zinc-500">/{totalChallenges}</span>}
                  </div>
                </div>

                {user.totalTimeHours && user.totalTimeHours > 0 && (
                  <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-purple-400" />
                      <span className="text-zinc-400 text-sm">Avg Time</span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-100">
                      {user.averageSolveTimeHours?.toFixed(1) || '0.0'}h
                    </div>
                  </div>
                )}
              </div>

              {/* Solved Challenges Section */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Flag className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-zinc-100">Challenges Solved</h3>
                </div>

                {loadingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-zinc-600 border-t-emerald-400 rounded-full animate-spin"></div>
                  </div>
                ) : userProfile ? (
                  <div className="space-y-4">
                    {/* Regular Challenges */}
                    {userProfile.regularSolvedChallenges && userProfile.regularSolvedChallenges.length > 0 && (
                      <div>
                        <div className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Practice Challenges ({userProfile.regularSolvedCount})
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userProfile.regularSolvedChallenges.map((challenge) => (
                            <div
                              key={challenge._id}
                              className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-zinc-100 text-sm">{challenge.title}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(challenge.category)}`}>
                                      {challenge.category}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                      {formatDate(challenge.solvedAt)}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-emerald-400 font-bold text-sm">+{challenge.points}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Competition Challenges */}
                    {userProfile.competitionSolvedChallenges && userProfile.competitionSolvedChallenges.length > 0 && (
                      <div>
                        <div className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          Competition Challenges ({userProfile.competitionSolvedCount})
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userProfile.competitionSolvedChallenges.map((challenge) => (
                            <div
                              key={challenge._id}
                              className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-zinc-100 text-sm">{challenge.title}</div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`text-xs px-2 py-0.5 rounded ${getCategoryColor(challenge.category)}`}>
                                      {challenge.category}
                                    </span>
                                    {challenge.competitionName && (
                                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                                        {challenge.competitionName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-emerald-400 font-bold text-sm">+{challenge.points}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!userProfile.regularSolvedChallenges || userProfile.regularSolvedChallenges.length === 0) && 
                     (!userProfile.competitionSolvedChallenges || userProfile.competitionSolvedChallenges.length === 0) && (
                      <div className="text-center py-8 text-zinc-500">
                        <Flag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No challenges solved yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <p>Unable to load challenge details</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  onClose();
                  if (user._id) {
                    navigate(`/profile/${user._id}`);
                  }
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSlidePanel;
