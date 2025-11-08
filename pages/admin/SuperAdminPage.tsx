import React, { useState, useEffect } from 'react';
import { challengeService } from '../../services/challengeService';
import { universityService } from '../../services/universityService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';

interface University {
  _id: string;
  name: string;
  code: string;
}

interface Challenge {
  _id: string;
  title: string;
  category: string;
  points: number;
  description: string;
  author: string;
  universityCode: string;
  solves: number;
}

const SuperAdminPage: React.FC = () => {
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCount, setCopiedCount] = useState(0);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const data = await universityService.getUniversities();
      setUniversities(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchChallenges = async (universityCode: string) => {
    try {
      setLoading(true);
      const data = await challengeService.getChallenges(universityCode);
      setChallenges(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUniversityChange = (universityCode: string) => {
    setSelectedUniversity(universityCode);
    if (universityCode) {
      fetchChallenges(universityCode);
    } else {
      setChallenges([]);
    }
  };

  const handleCopyChallenge = async (challengeId: string, targetUniversityCode: string) => {
    if (!targetUniversityCode) {
      alert('Please select a target university');
      return;
    }

    if (!confirm('Are you sure you want to copy this challenge to the selected university?')) {
      return;
    }

    try {
      await challengeService.copyChallengeToUniversity(challengeId, targetUniversityCode);
      setCopiedCount(prev => prev + 1);
      alert('Challenge copied successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-zinc-100 mb-2">Super Admin Panel</h1>
      <p className="text-zinc-400 mb-6">Copy challenges between universities</p>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-zinc-200 mb-2">Select University to View Challenges</label>
        <select
          value={selectedUniversity}
          onChange={(e) => handleUniversityChange(e.target.value)}
          className="w-full max-w-md px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-zinc-200"
        >
          <option value="">Select a university...</option>
          {universities.map((uni) => (
            <option key={uni._id} value={uni.code}>
              {uni.name} ({uni.code})
            </option>
          ))}
        </select>
      </div>

      {copiedCount > 0 && (
        <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-200 px-4 py-3 rounded mb-4">
          Successfully copied {copiedCount} challenge{copiedCount !== 1 ? 's' : ''}!
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading challenges...</div>
        </div>
      )}

      {selectedUniversity && !loading && (
        <>
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">
            Challenges from {universities.find(u => u.code === selectedUniversity)?.name}
          </h2>
          <div className="grid gap-4">
            {challenges.map((challenge) => (
              <Card key={challenge._id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-zinc-100 mb-2">{challenge.title}</h3>
                    <p className="text-zinc-400 mb-2">{challenge.description.substring(0, 150)}...</p>
                    <div className="flex gap-4 text-sm text-zinc-500 mb-3">
                      <span>Category: {challenge.category}</span>
                      <span>Points: {challenge.points}</span>
                      <span>Solves: {challenge.solves}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    <label className="text-xs text-zinc-400">Copy to:</label>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleCopyChallenge(challenge._id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="px-3 py-1 bg-zinc-800 border border-zinc-600 rounded text-zinc-200 text-sm min-w-[150px]"
                      defaultValue=""
                    >
                      <option value="" disabled>Select university...</option>
                      {universities
                        .filter(u => u.code !== selectedUniversity)
                        .map((uni) => (
                          <option key={uni._id} value={uni.code}>
                            {uni.name} ({uni.code})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </Card>
            ))}
            {challenges.length === 0 && (
              <div className="text-zinc-500 text-center py-8">No challenges found for this university</div>
            )}
          </div>
        </>
      )}

      {!selectedUniversity && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-12 text-center">
          <h3 className="text-xl font-semibold text-zinc-300 mb-2">Select a University</h3>
          <p className="text-zinc-500">Choose a university from the dropdown above to view and copy its challenges</p>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
