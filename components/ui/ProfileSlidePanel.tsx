import React from 'react';
import { X, Trophy, Target, Clock, Award } from 'lucide-react';

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
}

const ProfileSlidePanel: React.FC<ProfileSlidePanelProps> = ({ isOpen, onClose, user, rank }) => {
  if (!isOpen || !user) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide Panel */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-zinc-900 border-l border-zinc-700 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-700">
            <h2 className="text-2xl font-bold text-zinc-100">User Profile</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Avatar and Basic Info */}
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-zinc-700">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-2xl font-bold text-zinc-100 mb-1">
                  {user.fullName || user.displayName || user.username}
                </h3>
                <p className="text-zinc-400">@{user.username}</p>
                {user.universityCode && (
                  <p className="text-zinc-500 text-sm mt-1">{user.universityCode}</p>
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
                  <div className="text-2xl font-bold text-zinc-100">{user.solvedChallenges}</div>
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

              {/* Action Button */}
              <button
                onClick={() => {
                  onClose();
                  if (user._id) {
                    window.location.href = `/profile/${user._id}`;
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
