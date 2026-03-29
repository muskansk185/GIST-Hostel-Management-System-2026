import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { MessageSquare, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';

const Complaints: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const res = await api.get('/complaints');
        setComplaints(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        console.error('Failed to fetch complaints', err);
        setError('Failed to load complaints. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      await api.patch(`/complaints/${complaintId}/status`, { status: newStatus });
      setComplaints(complaints.map(c => 
        c._id === complaintId ? { ...c, status: newStatus } : c
      ));
      setNotification({ type: 'success', message: 'Complaint status updated successfully.' });
    } catch (err) {
      console.error('Failed to update complaint status', err);
      setNotification({ type: 'error', message: 'Failed to update complaint status' });
    }
  };

  const handleAssignWarden = async (complaintId: string, wardenId: string) => {
    try {
      await api.patch(`/complaints/${complaintId}/assign`, { wardenId });
      setComplaints(complaints.map(c => 
        c._id === complaintId ? { ...c, assignedTo: wardenId } : c
      ));
      setNotification({ type: 'success', message: 'Warden assigned successfully.' });
    } catch (err) {
      console.error('Failed to assign warden', err);
      setNotification({ type: 'error', message: 'Failed to assign warden' });
    }
  };

  const filteredComplaints = filter === 'ALL' 
    ? complaints 
    : complaints.filter(c => c.status?.toLowerCase() === filter.toLowerCase());

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'resolved':
        return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Resolved</span>;
      case 'in-progress':
        return <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">In Progress</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Pending</span>;
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

  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
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
            {notification.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-500">
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Complaints Management</h1>
          <p className="mt-1 text-sm text-slate-500">View and resolve student complaints.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-40 rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN-PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Complaint List</h2>
          </div>
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
            {sortedComplaints.length} Complaints
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category & Urgency
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                      Loading complaints...
                    </div>
                  </td>
                </tr>
              ) : sortedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <MessageSquare className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>No complaints found.</p>
                  </td>
                </tr>
              ) : (
                sortedComplaints.map((complaint) => (
                  <tr key={complaint._id} className={`hover:bg-slate-50 transition-colors ${isOverdue(complaint.expectedResolutionTime, complaint.status) ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {complaint.student?.personalDetails?.firstName} {complaint.student?.personalDetails?.lastName}
                      </div>
                      <div className="text-xs text-slate-500">{complaint.student?.personalDetails?.rollNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{complaint.category}</div>
                      <div className="mt-1 flex items-center gap-2">
                        {getUrgencyBadge(complaint.urgency)}
                        {isOverdue(complaint.expectedResolutionTime, complaint.status) && (
                          <span className="text-[10px] font-bold text-red-600 uppercase">Overdue</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 max-w-xs truncate font-medium" title={complaint.title}>
                        {complaint.title}
                      </div>
                      <div className="text-xs text-slate-500 max-w-xs truncate" title={complaint.description}>
                        {complaint.description}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        Target: {new Date(complaint.expectedResolutionTime).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(complaint.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col gap-2">
                        <select
                          value={complaint.status?.toUpperCase()}
                          onChange={(e) => handleStatusUpdate(complaint._id, e.target.value.toLowerCase())}
                          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN-PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                        
                        {user?.role === 'SUPER_ADMIN' && (
                          <div className="text-left">
                            <label className="text-[10px] uppercase text-slate-400 font-bold ml-1">Assign Warden</label>
                            <select
                              value={complaint.assignedTo || ''}
                              onChange={(e) => handleAssignWarden(complaint._id, e.target.value)}
                              className="mt-0.5 block w-full rounded-md border-0 py-1 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 text-xs"
                            >
                              <option value="">Unassigned</option>
                              {/* Wardens would be populated here in a real app */}
                              <option value="warden1">Warden 1</option>
                              <option value="warden2">Warden 2</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Complaints;
