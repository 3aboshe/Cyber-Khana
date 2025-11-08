import React, { useState, useEffect } from 'react';
import { challengeService } from '../services/challengeService';
import { userService } from '../services/userService';
import { Challenge } from '../types';
import Card from '../components/ui/card';
import Input from '../components/ui/input';
import ChallengeCard from '../components/ChallengeCard';
import { Search, Lock, Unlock, Filter } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Web Exploitation',
  'Reverse Engineering',
  'Binary Exploitation',
  'Cryptography',
  'Forensics',
  'Social Engineering',
  'Miscellaneous'
];

const ChallengesPage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [solvedChallenges, setSolvedChallenges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showSolvedOnly, setShowSolvedOnly] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('user');
      const universityCode = userData ? JSON.parse(userData).universityCode : undefined;

      const [challengesData, profileData] = await Promise.all([
        challengeService.getChallenges(universityCode),
        userService.getUserProfile().catch(() => ({ solvedChallenges: [] }))
      ]);

      setChallenges(challengesData);
      setSolvedChallenges(profileData.solvedChallenges || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const isSolved = (challengeId: string) => solvedChallenges.includes(challengeId);

  const filteredChallenges = challenges.filter((challenge) => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || challenge.category === selectedCategory;
    const matchesSolved = !showSolvedOnly || isSolved(challenge._id);

    return matchesSearch && matchesCategory && matchesSolved;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading challenges...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">Challenges</h1>
        <p className="text-zinc-400">Test your skills and solve challenges to earn points</p>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search challenges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowSolvedOnly(!showSolvedOnly)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
              showSolvedOnly
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            {showSolvedOnly ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            {showSolvedOnly ? 'Showing Solved' : 'Show Solved Only'}
          </button>
        </div>
      </Card>

      {/* Challenge Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredChallenges.map((challenge) => (
          <ChallengeCard key={challenge._id} challenge={challenge} />
        ))}
      </div>

      {filteredChallenges.length === 0 && (
        <div className="text-center py-12">
          <div className="text-zinc-400 text-lg">No challenges found</div>
          <p className="text-zinc-500 text-sm mt-2">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default ChallengesPage;
