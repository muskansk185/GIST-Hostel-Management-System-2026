import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle, X } from 'lucide-react';

const LeaveApprovals: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaves/parent/pending');
      setLeaves(res.data);
    } catch (err: any) {
      setError('Failed to load leave requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeaves();
    }
  }, [user]);

  const handleApprove = async (leaveId: string) => {
    try {
      setActionLoading(leaveId);
      await api.put(`/leaves/parent/${leaveId}/approve`);
      setNotification({ type: 'success', message: 'Leave approved successfully' });
      fetchLeaves();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to approve leave' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      setActionLoading(leaveId);
      await api.put(`/leaves/parent/${leaveId}/reject`);
      setNotification({ type: 'success', message: 'Leave rejected successfully' });
      fetchLeaves();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to reject leave' });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
            {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leave Approvals</h1>
        <p className="mt-1 text-sm text-slate-500">Review and approve your child's leave requests.</p>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
            <Calendar className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Pending Requests</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Reason
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Emergency Contact
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
                      Loading leave requests...
                    </div>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>No pending leave requests found.</p>
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {leave.student?.personalDetails?.firstName} {leave.student?.personalDetails?.lastName}
                      </div>
                      <div className="text-xs text-slate-500">{leave.student?.personalDetails?.rollNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{formatDate(leave.fromDate)}</div>
                      <div className="text-xs text-slate-500">to {formatDate(leave.toDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 max-w-xs truncate" title={leave.reason}>{leave.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{leave.emergencyContact}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(leave._id)}
                          disabled={actionLoading === leave._id}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(leave._id)}
                          disabled={actionLoading === leave._id}
                          className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
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

export default LeaveApprovals;
