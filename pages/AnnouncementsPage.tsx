import React, { useState, useEffect } from 'react';
import { announcementService } from '../services/announcementService';
import Card from '../components/ui/card';
import { Bell, Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  universityCode: string;
}

const AnnouncementIcon = ({ type }: { type: 'info' | 'success' | 'warning' }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-sky-400" />;
  }
};

const TimeAgo = ({ timestamp }: { timestamp: string }) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return <span>{diffInSeconds}s ago</span>;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return <span>{diffInMinutes}m ago</span>;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return <span>{diffInHours}h ago</span>;
  const diffInDays = Math.floor(diffInHours / 24);
  return <span>{diffInDays}d ago</span>;
};

const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-zinc-100 mb-2">Announcements</h1>
        <p className="text-zinc-400">Stay updated with the latest news and updates</p>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">No announcements yet</p>
            <p className="text-zinc-500 text-sm mt-2">
              Check back later for updates
            </p>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement._id} className="p-6 hover:border-zinc-600 transition-colors">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <AnnouncementIcon type="info" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-zinc-100">{announcement.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span><TimeAgo timestamp={announcement.createdAt} /></span>
                      <span>•</span>
                      <span>by {announcement.author}</span>
                    </div>
                  </div>
                  <p className="text-zinc-300 whitespace-pre-wrap break-words">{announcement.content}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
