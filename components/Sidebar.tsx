
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Trophy, UserCircle, ShieldCheck, Code, Target } from 'lucide-react';

const Sidebar: React.FC = () => {

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
      isActive
        ? 'bg-emerald-500/10 text-emerald-400'
        : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
    }`;


  return (
    <aside className="w-64 flex-shrink-0 bg-zinc-800 border-r border-zinc-700 p-4 hidden md:flex md:flex-col">
      <div className="flex items-center gap-2 px-2 py-4">
        <ShieldCheck className="w-8 h-8 text-emerald-400" />
        <h1 className="text-xl font-black text-zinc-100">CyberKhana</h1>
      </div>
      <nav className="mt-8 flex flex-col gap-2">
        <NavLink to="/dashboard" className={navLinkClasses}>
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Dashboard
        </NavLink>
        <NavLink to="/competition" className={navLinkClasses}>
          <Target className="w-5 h-5 mr-3" />
          Competitions
        </NavLink>
        <NavLink to="/challenges" className={navLinkClasses}>
          <Code className="w-5 h-5 mr-3" />
          Challenges
        </NavLink>
        <NavLink to="/leaderboard" className={navLinkClasses}>
          <Trophy className="w-5 h-5 mr-3" />
          Leaderboard
        </NavLink>
        <NavLink to="/profile" className={navLinkClasses}>
          <UserCircle className="w-5 h-5 mr-3" />
          Profile
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;