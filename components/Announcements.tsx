
import React from 'react';
import { useAppContext } from '../AppContext';
import Card from './ui/card';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';

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
}


const Announcements: React.FC = () => {
    const { announcements } = useAppContext();

    return (
        <Card className="p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Announcements</h2>
            <div className="space-y-4">
                {announcements.map(announcement => (
                    <div key={announcement.id} className="flex gap-4 p-4 bg-zinc-700 rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                            <AnnouncementIcon type={announcement.type} />
                        </div>
                        <div>
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-zinc-200">{announcement.title}</h3>
                                <p className="text-xs text-zinc-400"><TimeAgo timestamp={announcement.timestamp} /></p>
                            </div>
                            <p className="text-sm text-zinc-300 mt-1">{announcement.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default Announcements;