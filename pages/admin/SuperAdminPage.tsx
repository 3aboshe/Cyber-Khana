import React, { useState, useEffect } from 'react';
import { universityService } from '../../services/universityService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Building2, Plus, Trash2 } from 'lucide-react';

interface University {
  _id: string;
  name: string;
  code: string;
}

const SuperAdminPage: React.FC = () => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUniversityName, setNewUniversityName] = useState('');
  const [newUniversityCode, setNewUniversityCode] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      const data = await universityService.getUniversities();
      setUniversities(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUniversityName.trim() || !newUniversityCode.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await universityService.createUniversity({
        name: newUniversityName,
        code: newUniversityCode.toUpperCase()
      });

      setNewUniversityName('');
      setNewUniversityCode('');
      setShowCreateForm(false);
      await fetchUniversities();
      alert('University created successfully!');
    } catch (err: any) {
      setError(err.message || 'Error creating university');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUniversity = async (universityId: string, universityName: string) => {
    if (!confirm(`Are you sure you want to delete "${universityName}"?\n\nThis action cannot be undone. You can only delete universities with no users.`)) {
      return;
    }

    try {
      await universityService.deleteUniversity(universityId);
      await fetchUniversities();
      alert('University deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Error deleting university');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading universities...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-zinc-100 mb-2">Super Admin Panel</h1>
      <p className="text-zinc-400 mb-6">Manage universities and their settings</p>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create University Section */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-zinc-100">Universities</h2>
          </div>
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create University
            </Button>
          )}
        </div>

        {showCreateForm ? (
          <form onSubmit={handleCreateUniversity} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  University Name
                </label>
                <Input
                  type="text"
                  value={newUniversityName}
                  onChange={(e) => setNewUniversityName(e.target.value)}
                  placeholder="e.g., Massachusetts Institute of Technology"
                  className="w-full"
                  disabled={creating}
                />
              </div>
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  University Code
                </label>
                <Input
                  type="text"
                  value={newUniversityCode}
                  onChange={(e) => setNewUniversityCode(e.target.value.toUpperCase())}
                  placeholder="e.g., MIT123"
                  className="w-full"
                  disabled={creating}
                />
                <p className="text-zinc-500 text-xs mt-1">Use alphanumeric characters (A-Z, 0-9)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={creating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {creating ? 'Creating...' : 'Create University'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewUniversityName('');
                  setNewUniversityCode('');
                  setError('');
                }}
                disabled={creating}
                className="text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-zinc-400 mb-4">
              Total Universities: <span className="text-zinc-200 font-semibold">{universities.length}</span>
            </p>
            {universities.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {universities.map((uni) => (
                  <div
                    key={uni._id}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 flex items-center gap-3"
                  >
                    <Building2 className="w-5 h-5 text-zinc-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 font-medium truncate">{uni.name}</p>
                      <p className="text-zinc-400 text-xs">{uni.code}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteUniversity(uni._id, uni.name)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete university"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-4">No universities yet</p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default SuperAdminPage;
