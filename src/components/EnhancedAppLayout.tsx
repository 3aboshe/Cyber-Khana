import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileNavigation from './ui/MobileNavigation';

interface EnhancedAppLayoutProps {
  onLogout: () => void;
}

const EnhancedAppLayout: React.FC<EnhancedAppLayoutProps> = ({ onLogout }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="flex h-screen bg-zinc-900 text-zinc-200">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navigation */}
      <MobileNavigation user={user} onLogout={onLogout} />

      <div className="flex flex-col flex-1 overflow-hidden md:ml-64">
        <Header user={user} onLogout={onLogout} />
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnhancedAppLayout;
