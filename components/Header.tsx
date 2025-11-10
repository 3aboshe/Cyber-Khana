
import React from 'react';
import { User } from '../types';
import Button from './ui/button';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="flex-shrink-0 bg-zinc-800/80 border-b border-zinc-700 backdrop-blur-md">
      <div className="flex items-center justify-end h-16 px-4 sm:px-6 md:px-8">
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="font-semibold text-sm text-zinc-100">{user.fullName || user.displayName || user.username || user.name}</p>
            <p className="text-xs text-zinc-400">{user.points} pts</p>
          </div>
          <Link to="/announcements">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 hover:bg-zinc-600 transition-colors">
              <Bell size={20} />
            </div>
          </Link>
          <Link to="/profile">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 hover:bg-zinc-600 transition-colors">
                 <UserIcon size={20} />
            </div>
          </Link>
          <Button variant="secondary" onClick={onLogout} className="!px-3">
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;