import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { MessageSquare, PlusCircle, AlertCircle, CheckCircle2, Clock, X, Wrench } from 'lucide-react';

const StudentComplaints: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [accommodation, setAccommodation] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchComplaintsAndAccommodation = async () => {
    try {
      setLoading(true);
      const [complaintsRes, accRes] = await Promise.allSettled([
        api.get('/complaints/my-complaints'),
        api.get('/accommodation/me')
      ]);
      
      if (complaintsRes.status === 'fulfilled') {
        setComplaints(Array.isArray(complaintsRes.value.data) ? complaintsRes.value.data : []);
      }
      if (accRes.status === 'fulfilled') {
        setAccommodation(accRes.value.data);
      }
    } catch (err: any) {
      setError('Failed to load complaints. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchComplaintsAndAccommodation();
    }
  }, [user]);

  const handleCreateComplaint = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!accommodation?.roomId?._id || !accommodation?._id) {
      setNotification({ type: 'error', message: 'You must be assigned to a room to submit a complaint.' });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      urgency: formData.get('urgency') || undefined,
      roomId: accommodation.roomId._id,
      bedId: accommodation._id
    };

    try {
      setActionLoading(true);
      await api.post('/complaints/create', data);
      setShowModal(false);
      setNotification({ type: 'success', message: 'Complaint submitted successfully.' });
      fetchComplaintsAndAccommodation();
    } catch (err: any) {
      console.error('Complaint submission error:', err.response?.data);
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to submit complaint' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resolved
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <Wrench className="h-3.5 w-3.5" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        );
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const u = urgency?.toLowerCase();
    switch (u) {
      case 'high':
        return <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-md ring-1 ring-red-200">High</span>;
      case 'medium':
        return <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md ring-1 ring-orange-200">Medium</span>;
      default:
        return <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-md ring-1 ring-green-200">Low</span>;
    }
  };

  const isOverdue = (expectedTime: string, status: string) => {
    if (!expectedTime || status?.toLowerCase() === 'resolved') return false;
    return new Date() > new Date(expectedTime);
  };

  const sortedComplaints = [...complaints].sort((a, b) => {
    const urgencyMap: any = { high: 0, medium: 1, low: 2 };
    const urgencyA = urgencyMap[a.urgency?.toLowerCase()] ?? 3;
    const urgencyB = urgencyMap[b.urgency?.toLowerCase()] ?? 3;
    
    if (urgencyA !== urgencyB) return urgencyA - urgencyB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-600 ring-1 ring-red-200 flex items-start gap-3">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`rounded-xl p-4 flex items-start justify-between ${notification.type === 'success' ? 'bg-green-50 text-green-800 ring-1 ring-green-200' : 'bg-red-50 text-red-800 ring-1 ring-red-200'}`}>
          <div className="flex gap-3">
            {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-500">
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Complaints</h1>
          <p className="mt-1 text-sm text-slate-500">Raise issues and track their resolution status.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <PlusCircle className="mr-1.5 h-4 w-4" />
          New Complaint
        </button>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
            <MessageSquare className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">My Complaints</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Urgency
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Expected Resolution
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                      Loading complaints...
                    </div>
                  </td>
                </tr>
              ) : sortedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>No complaints found.</p>
                  </td>
                </tr>
              ) : (
                sortedComplaints.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 max-w-xs truncate" title={complaint.description}>{complaint.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{complaint.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUrgencyBadge(complaint.urgency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(complaint.status)}
                        {isOverdue(complaint.expectedResolutionTime, complaint.status) && (
                          <span className="inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800 uppercase tracking-wider">
                            Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(complaint.expectedResolutionTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(complaint.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">New Complaint</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Title</label>
                <input required name="title" type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Brief title of the issue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <select required name="category" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white">
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="INTERNET">Internet/WiFi</option>
                  <option value="FURNITURE">Furniture</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Urgency (Optional)</label>
                <select name="urgency" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white">
                  <option value="">Auto-assign based on category</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea required name="description" rows={4} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Please provide detailed information about the issue..."></textarea>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={actionLoading} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {actionLoading ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentComplaints;
