import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, Megaphone, Users, LogOut } from 'lucide-react';
import Button from './ui/button';

interface AdminLayoutProps {
    onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.role === 'super-admin';
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
      isActive
        ? 'bg-emerald-500/10 text-emerald-400'
        : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'
    }`;

    return (
        <div className="flex h-screen bg-zinc-900 text-zinc-200">
            <aside className="w-64 flex-shrink-0 bg-zinc-800 border-r border-zinc-700 p-4 hidden md:flex md:flex-col">
                <div className="flex items-center gap-2 px-2 py-4">
                    <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    <h1 className="text-xl font-black text-zinc-100">Admin Panel</h1>
                </div>
                <nav className="mt-8 flex flex-col gap-2">
                    <NavLink to="/admin" end className={navLinkClasses}>
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </NavLink>
                    {!isSuperAdmin && (
                        <>
                            <NavLink to="/admin/competitions" className={navLinkClasses}>
                                <ShieldCheck className="w-5 h-5 mr-3" />
                                Competitions
                            </NavLink>
                            <NavLink to="/admin/challenges" className={navLinkClasses}>
                                <ShieldCheck className="w-5 h-5 mr-3" />
                                Challenges
                            </NavLink>
                        </>
                    )}
                    <NavLink to="/admin/announcements" className={navLinkClasses}>
                        <Megaphone className="w-5 h-5 mr-3" />
                        Announcements
                    </NavLink>
                    <NavLink to="/admin/users" className={navLinkClasses}>
                        <Users className="w-5 h-5 mr-3" />
                        Users
                    </NavLink>
                </nav>
                <div className="mt-auto">
                    <Button variant="secondary" onClick={onLogout} className="w-full">
                        <LogOut size={16} />
                        <span>Logout</span>
                    </Button>
                </div>
            </aside>
             <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;