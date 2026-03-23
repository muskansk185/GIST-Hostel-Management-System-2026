import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Home, Calendar, AlertCircle, DollarSign } from 'lucide-react';
import api from '../../api/axios';

import NoticeBoard from '../../components/NoticeBoard';

const StatCard = ({ title, value, icon, subtitle, loading, imageUrl }: any) => (
  <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 relative overflow-hidden">
    {imageUrl && (
      <div className="absolute inset-0 opacity-10">
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      </div>
    )}
    <div className="relative z-10">
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
  </div>
);

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [accommodation, setAccommodation] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?._id) return;
      
      try {
        setLoading(true);
        const [accRes, leaveRes, compRes, feeRes] = await Promise.allSettled([
          api.get('/accommodation/me'),
          api.get('/leaves/my-leaves'),
          api.get('/complaints/my-complaints'),
          api.get('/fees/my-fees')
        ]);
        
        setAccommodation(accRes.status === 'fulfilled' ? accRes.value.data : null);
        setLeaves(leaveRes.status === 'fulfilled' && Array.isArray(leaveRes.value.data) ? leaveRes.value.data : []);
        setComplaints(compRes.status === 'fulfilled' && Array.isArray(compRes.value.data) ? compRes.value.data : []);
        setFees(feeRes.status === 'fulfilled' && Array.isArray(feeRes.value.data) ? feeRes.value.data : []);
      } catch (err: any) {
        console.error('Failed to fetch student dashboard data', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-600 ring-1 ring-red-200">
        <AlertCircle className="h-6 w-6 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  const activeComplaints = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const upcomingLeaves = leaves.filter(l => new Date(l.fromDate) > new Date() && l.status === 'APPROVED');
  const unpaidFees = fees.filter(f => f.status !== 'PAID');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back, {user?.name || user?.email}. Here's your status.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="My Room" 
          value={accommodation?.roomId?.roomNumber || 'Not Assigned'} 
          icon={<Home className="h-6 w-6" />} 
          subtitle={accommodation?.roomId?.floorId?.blockId?.hostelId?.name || 'Pending Allocation'} 
          loading={loading}
          imageUrl="/images/room.jpg"
        />
        <StatCard 
          title="Upcoming Leaves" 
          value={upcomingLeaves.length} 
          icon={<Calendar className="h-6 w-6" />} 
          subtitle={upcomingLeaves.length > 0 ? `Next: ${formatDate(upcomingLeaves[0].fromDate)}` : 'None scheduled'} 
          loading={loading}
        />
        <StatCard 
          title="Active Complaints" 
          value={activeComplaints.length} 
          icon={<AlertCircle className="h-6 w-6" />} 
          subtitle={activeComplaints.length === 0 ? 'All resolved' : 'Needs attention'} 
          loading={loading}
        />
        <StatCard 
          title="Fee Status" 
          value={unpaidFees.length === 0 ? 'Paid' : 'Due'} 
          icon={<DollarSign className="h-6 w-6" />} 
          subtitle={unpaidFees.length > 0 ? `Next due: ${formatDate(unpaidFees[0].dueDate)}` : 'All clear'} 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NoticeBoard />
        
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-4">My Recent Activity</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-12 bg-slate-100 animate-pulse rounded"></div>)}
              </div>
            ) : (
              <>
                {leaves.slice(0, 2).map(leave => (
                  <div key={leave._id} className="flex items-start gap-4 text-sm">
                    <div className="mt-0.5 rounded-full bg-slate-100 p-1.5 text-slate-500">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Leave Request {leave.status.toLowerCase()}</p>
                      <p className="text-slate-500">For {formatDate(leave.fromDate)} to {formatDate(leave.toDate)}</p>
                    </div>
                  </div>
                ))}
                {complaints.slice(0, 2).map(complaint => (
                  <div key={complaint._id} className="flex items-start gap-4 text-sm">
                    <div className="mt-0.5 rounded-full bg-slate-100 p-1.5 text-slate-500">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Complaint {complaint.status.toLowerCase()}</p>
                      <p className="text-slate-500 max-w-xs truncate" title={complaint.description}>{complaint.description}</p>
                    </div>
                  </div>
                ))}
                {leaves.length === 0 && complaints.length === 0 && (
                  <p className="text-sm text-slate-500">No recent activity.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
