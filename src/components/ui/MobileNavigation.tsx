import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Code,
  Trophy,
  UserCircle,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import Button from './EnhancedButton';

interface MobileNavigationProps {
  user: any;
  onLogout: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/competition', icon: Target, label: 'Competitions' },
    { to: '/challenges', icon: Code, label: 'Challenges' },
    { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-800/95 backdrop-blur-md border-b border-zinc-700">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-7 h-7 text-emerald-400" />
            <h1 className="text-xl font-black text-zinc-100">CyberKhana</h1>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed top-16 left-0 bottom-0 z-30 w-80 max-w-[85vw] bg-zinc-800 border-r border-zinc-700 transform transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* User Info */}
          <div className="p-4 border-b border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                <span className="text-xl text-white font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-zinc-100">{user?.username}</p>
                <p className="text-sm text-zinc-400">{user?.points} pts</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
                    }`
                  }
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-zinc-700">
            <Button variant="ghost" fullWidth onClick={onLogout} leftIcon={<LogOut size={18} />}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-800/95 backdrop-blur-md border-t border-zinc-700">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-zinc-400 hover:text-zinc-100'
                  }`
                }
              >
                <Icon size={20} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
