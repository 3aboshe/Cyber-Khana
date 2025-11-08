import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/button';
import { Trophy, Code, Users } from 'lucide-react';

const NewDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-100 mb-2">
            Welcome to Cyberخانه
          </h1>
          <p className="text-zinc-400">
            {user && `University: ${user.universityCode}`}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 hover:border-emerald-500/50 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <Trophy className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-100">Enter Competition</h2>
            </div>
            <p className="text-zinc-400 mb-6">
              Join an active competition and compete against other participants. Enter the security code provided by your competition organizer.
            </p>
            <Button
              onClick={() => navigate('/competition')}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Enter Competition
            </Button>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 hover:border-blue-500/50 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Code className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-100">Explore Challenges</h2>
            </div>
            <p className="text-zinc-400 mb-6">
              Browse and solve challenges at your own pace. Practice and improve your cybersecurity skills.
            </p>
            <Button
              onClick={() => navigate('/challenges')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              View Challenges
            </Button>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-8 hover:border-purple-500/50 transition-all md:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Users className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-100">Leaderboard</h2>
            </div>
            <p className="text-zinc-400 mb-6">
              See how you rank against other participants from your university.
            </p>
            <Button
              onClick={() => navigate('/leaderboard')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              View Leaderboard
            </Button>
          </div>
        </div>
      </div>
  );
};

export default NewDashboardPage;
