import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Bell, AlertCircle, Plus, X, Loader2 } from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';

interface Notice {
  _id: string;
  title: string;
  content: string;
  createdBy: {
    name: string;
    role: string;
  };
  hostelId?: {
    name: string;
  };
  createdAt: string;
}

const NoticeBoard: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notices');
      setNotices(response.data);
    } catch (err: any) {
      console.error('Failed to fetch notices', err);
      setError('Failed to load notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/notices', newNotice);
      setShowCreateModal(false);
      setNewNotice({ title: '', content: '' });
      fetchNotices();
    } catch (err) {
      console.error('Failed to create notice', err);
    } finally {
      setIsCreating(false);
    }
  };

  const canCreateNotice = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.WARDEN;

  if (loading && notices.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            Notice Board
          </h3>
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Bell className="h-5 w-5 text-indigo-600" />
          Notice Board
        </h3>
        {canCreateNotice && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
          >
            <Plus className="h-3 w-3" />
            Create
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        {notices.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No active notices.</p>
        ) : (
          notices.map((notice) => (
            <div key={notice._id} className="border-l-4 border-indigo-500 pl-4 py-2 bg-slate-50 rounded-r-lg">
              <div className="flex justify-between items-start">
                <p className="text-sm font-bold text-slate-900">{notice.title}</p>
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                  {new Date(notice.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{notice.content}</p>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                <span className="font-medium">By: {notice.createdBy?.name || 'Unknown'} ({notice.createdBy?.role || 'N/A'})</span>
                {notice.hostelId && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-600 font-medium">{notice.hostelId?.name || 'Unknown Hostel'}</span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Notice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Create Notice</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Title</label>
                <input 
                  required 
                  type="text" 
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                  placeholder="Enter notice title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Content</label>
                <textarea 
                  required 
                  rows={4}
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                  placeholder="Enter notice content"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isCreating} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCreating ? 'Creating...' : 'Create Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticeBoard;
