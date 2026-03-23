import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { Calendar, AlertCircle, Check, X, Clock, History, CheckCircle2, XCircle } from 'lucide-react';

const LeaveApprovals: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const [pendingRes, historyRes] = await Promise.all([
        api.get('/leaves/warden/pending'),
        api.get('/leaves/warden/history')
      ]);
      setLeaves(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
    } catch (err: any) {
      console.error('Failed to fetch leaves', err);
      setError('Failed to load leave requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApprove = async (leaveId: string) => {
    try {
      await api.put(`/leaves/warden/${leaveId}/approve`, { comments: 'Approved by Warden' });
      setNotification({ type: 'success', message: 'Leave approved successfully.' });
      fetchLeaves();
    } catch (err) {
      console.error('Failed to approve leave', err);
      setNotification({ type: 'error', message: 'Failed to approve leave' });
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      await api.put(`/leaves/warden/${leaveId}/reject`, { comments: 'Rejected by Warden' });
      setNotification({ type: 'success', message: 'Leave rejected successfully.' });
      fetchLeaves();
    } catch (err) {
      console.error('Failed to reject leave', err);
      setNotification({ type: 'error', message: 'Failed to reject leave' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <Clock className="h-3.5 w-3.5" />
            {status.replace('_', ' ')}
          </span>
        );
    }
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
            {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-500">
            &times;
          </button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leave Approvals</h1>
        <p className="mt-1 text-sm text-slate-500">Manage student leave requests.</p>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending Requests
          <span className="ml-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {leaves.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
          }`}
        >
          <History className="h-4 w-4" />
          Leave History
        </button>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              {activeTab === 'pending' ? <Calendar className="h-5 w-5" /> : <History className="h-5 w-5" />}
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {activeTab === 'pending' ? 'Pending Requests' : 'Leave History'}
            </h2>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Leave Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Reason
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Emergency Contact
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {activeTab === 'pending' ? 'Actions' : 'Status'}
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
              ) : (activeTab === 'pending' ? leaves : history).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>No {activeTab === 'pending' ? 'pending leave requests' : 'leave history'}.</p>
                  </td>
                </tr>
              ) : (
                (activeTab === 'pending' ? leaves : history).map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {leave.student?.personalDetails?.firstName} {leave.student?.personalDetails?.lastName}
                      </div>
                      <div className="text-xs text-slate-500">{leave.student?.personalDetails?.rollNumber || leave.rollNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-900">{formatDate(leave.fromDate)}</div>
                          <div className="text-xs text-slate-500">to {formatDate(leave.toDate)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{leave.emergencyContact}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {activeTab === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(leave._id)}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 ring-1 ring-inset ring-emerald-600/20"
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(leave._id)}
                            className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-100 ring-1 ring-inset ring-red-600/10"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        getStatusBadge(leave.status)
                      )}
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
