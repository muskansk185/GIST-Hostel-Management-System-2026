import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Users, Building, AlertCircle, MessageSquare, Calendar } from 'lucide-react';
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

const WardenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/dashboard/occupancy');
        
        // Also fetch complaints and leaves for pending counts
        const [complaintsRes, leavesRes] = await Promise.all([
          api.get('/analytics/dashboard/complaints'),
          api.get('/analytics/dashboard/leaves')
        ]);
        
        setStats({
          occupancy: res.data,
          complaints: complaintsRes.data,
          leaves: leavesRes.data
        });
      } catch (err: any) {
        console.error('Failed to fetch warden dashboard data', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Warden Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back, {user?.name || user?.email}. Here's your hostel overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard 
          title="Total Students" 
          value={stats?.occupancy?.occupiedBeds || 0} 
          icon={<Users className="h-6 w-6" />} 
          subtitle="Currently accommodated" 
          loading={loading}
        />
        <StatCard 
          title="Total Rooms" 
          value={stats?.occupancy?.totalRooms || 0} 
          icon={<Building className="h-6 w-6" />} 
          subtitle="Across all blocks" 
          loading={loading}
        />
        <StatCard 
          title="Occupied Beds" 
          value={stats?.occupancy?.occupiedBeds || 0} 
          icon={<Building className="h-6 w-6 text-emerald-600" />} 
          subtitle={`${stats?.occupancy?.availableBeds || 0} available beds`} 
          loading={loading}
        />
        <StatCard 
          title="Pending Complaints" 
          value={stats?.complaints?.openComplaints || 0} 
          icon={<MessageSquare className="h-6 w-6 text-amber-600" />} 
          subtitle="Requires attention" 
          loading={loading}
        />
        <StatCard 
          title="Pending Leaves" 
          value={stats?.leaves?.pendingLeaves || 0} 
          icon={<Calendar className="h-6 w-6 text-indigo-600" />} 
          subtitle="Awaiting approval" 
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <NoticeBoard />
      </div>
    </div>
  );
};

export default WardenDashboard;
