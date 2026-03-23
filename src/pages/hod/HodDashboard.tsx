import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Users, Calendar, Building, MessageSquare, AlertCircle, Check, X, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../api/axios';
import NoticeBoard from '../../components/NoticeBoard';

const StatCard = ({ title, value, icon, subtitle, loading }: any) => (
  <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {loading ? (
          <div className="h-8 w-16 mt-2 bg-slate-200 animate-pulse rounded"></div>
        ) : (
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        )}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>
    </div>
    {subtitle && (
      <div className="mt-4 text-sm text-slate-500">
        {subtitle}
      </div>
    )}
  </div>
);

const HodDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [leaveRes, analyticsRes] = await Promise.allSettled([
          api.get('/leaves/hod/pending'),
          api.get('/hod/analytics')
        ]);

        if (leaveRes.status === 'fulfilled') {
          setLeaves(Array.isArray(leaveRes.value.data) ? leaveRes.value.data : []);
        }
        if (analyticsRes.status === 'fulfilled') {
          setAnalytics(analyticsRes.value.data);
        }
      } catch (err: any) {
        console.error('Failed to fetch HOD dashboard data', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleApprove = async (leaveId: string) => {
    try {
      await api.put(`/leaves/hod/${leaveId}/approve`, { comments: 'Approved by HOD' });
      setLeaves(leaves.filter(l => l._id !== leaveId));
      setNotification({ type: 'success', message: 'Leave approved successfully' });
    } catch (err) {
      console.error('Failed to approve leave', err);
      setNotification({ type: 'error', message: 'Failed to approve leave' });
    }
  };

  const handleReject = async (leaveId: string) => {
    try {
      await api.put(`/leaves/hod/${leaveId}/reject`, { comments: 'Rejected by HOD' });
      setLeaves(leaves.filter(l => l._id !== leaveId));
      setNotification({ type: 'success', message: 'Leave rejected successfully' });
    } catch (err) {
      console.error('Failed to reject leave', err);
      setNotification({ type: 'error', message: 'Failed to reject leave' });
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
        <h1 className="text-2xl font-bold text-slate-900">HOD Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back, {user?.name || user?.email}. Here's your department overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Department Students" 
          value={analytics?.students?.total || 0} 
          icon={<Users className="h-6 w-6" />} 
          subtitle="Registered in system" 
          loading={loading}
        />
        <StatCard 
          title="Students in Hostel" 
          value={analytics?.students?.inHostel || 0} 
          icon={<Building className="h-6 w-6" />} 
          subtitle="Currently accommodated" 
          loading={loading}
        />
        <StatCard 
          title="Pending Leaves" 
          value={leaves.length} 
          icon={<Calendar className="h-6 w-6" />} 
          subtitle="Needs your approval" 
          loading={loading}
        />
        <StatCard 
          title="Total Complaints" 
          value={analytics?.complaints?.total || 0} 
          icon={<MessageSquare className="h-6 w-6" />} 
          subtitle={`${analytics?.complaints?.pending || 0} pending`} 
          loading={loading}
        />
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Recent Leave Requests</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded"></div>)}
            </div>
          ) : leaves.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Roll Number</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">From Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">To Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {leaves.slice(0, 5).map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {leave.studentId?.firstName} {leave.studentId?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {leave.studentId?.rollNumber || leave.rollNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(leave.fromDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(leave.toDate)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{leave.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleApprove(leave._id)}
                          className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100"
                        >
                          <Check className="mr-1 h-3 w-3" /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(leave._id)}
                          className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 hover:bg-red-100"
                        >
                          <X className="mr-1 h-3 w-3" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-slate-500">No pending leave requests.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <NoticeBoard />
      </div>
    </div>
  );
};

export default HodDashboard;
