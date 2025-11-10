import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/announcementService';
import Card from '../../components/ui/card';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import Textarea from '../../components/ui/textarea';
import { Plus, Bell, Edit, Trash2, Calendar } from 'lucide-react';
import { useConfirmation } from '../../src/contexts/ConfirmationContext';
import { useToast } from '../../src/hooks/useToast';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  universityCode: string;
}

const AdminAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const { confirm } = useConfirmation();
  const { toast, ToastContainer } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        const updated = await announcementService.updateAnnouncement(editingAnnouncement._id, formData);
        setAnnouncements(prev =>
          prev.map(a => a._id === editingAnnouncement._id ? updated : a)
        );
        toast('success', 'Announcement updated successfully');
      } else {
        const created = await announcementService.createAnnouncement(formData);
        setAnnouncements(prev => [created, ...prev]);
        toast('success', 'Announcement created successfully');
      }
      closeModal();
    } catch (err) {
      console.error('Error saving announcement:', err);
      toast('error', 'Failed to save announcement');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm('Are you sure you want to delete this announcement?', {
      type: 'danger',
      title: 'Delete Announcement',
      confirmText: 'Delete',
      isDestructive: true
    });
    if (!confirmed) return;
    try {
      await announcementService.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      toast('success', 'Announcement deleted successfully');
    } catch (err) {
      console.error('Error deleting announcement:', err);
      toast('error', 'Failed to delete announcement');
    }
  };

  const openModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
      });
    } else {
      setEditingAnnouncement(null);
      setFormData({ title: '', content: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
    setFormData({ title: '', content: '' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading announcements...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-zinc-100 mb-2">Announcements</h1>
          <p className="text-zinc-400">Keep your students informed</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-5 h-5 mr-2" />
          New Announcement
        </Button>
      </div>

      <div className="grid gap-6">
        {announcements.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">No announcements yet</p>
            <p className="text-zinc-500 text-sm mt-2">
              Create your first announcement to get started
            </p>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement._id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-zinc-100 mb-2">
                    {announcement.title}
                  </h3>
                  <div className="flex items-center gap-4 text-zinc-500 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span>by {announcement.author}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openModal(announcement)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(announcement._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-zinc-300 whitespace-pre-wrap">
                {announcement.content}
              </p>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-800 rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-zinc-100 mb-4">
              {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-zinc-400 mb-2">Title</label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Announcement title"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-2">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Announcement content"
                  rows={6}
                  required
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Button type="submit">
                  {editingAnnouncement ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default AdminAnnouncementsPage;
