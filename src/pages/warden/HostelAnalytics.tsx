import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const HostelAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [occupancyRes, complaintsRes, leavesRes] = await Promise.all([
          api.get('/analytics/dashboard/occupancy'),
          api.get('/analytics/dashboard/complaints'),
          api.get('/analytics/dashboard/leaves')
        ]);
        
        setStats({
          occupancy: occupancyRes.data,
          complaints: complaintsRes.data,
          leaves: leavesRes.data
        });
      } catch (err: any) {
        console.error('Failed to fetch analytics', err);
        setError('Failed to load hostel analytics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-600 ring-1 ring-red-200 flex items-start gap-3">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          Loading analytics...
        </div>
      </div>
    );
  }

  const occupancyData = [
    { name: 'Occupied', value: stats.occupancy.occupiedBeds },
    { name: 'Available', value: stats.occupancy.availableBeds },
    { name: 'Maintenance', value: stats.occupancy.maintenanceBeds }
  ];

  const leaveData = [
    { name: 'Pending', value: stats.leaves.pendingLeaves },
    { name: 'Approved', value: stats.leaves.approvedLeaves },
    { name: 'Rejected', value: stats.leaves.rejectedLeaves }
  ];

  const complaintData = [
    { name: 'Resolved', value: stats.complaints.resolvedComplaints },
    { name: 'In Progress', value: stats.complaints.inProgressComplaints },
    { name: 'Open', value: stats.complaints.openComplaints }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hostel Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Visual overview of hostel statistics.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Room Occupancy */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <PieChartIcon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Room Occupancy</h2>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Statistics */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Leave Statistics</h2>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {leaveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaint Statistics */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden lg:col-span-2">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
              <Activity className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Complaint Status</h2>
          </div>
          <div className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complaintData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {complaintData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelAnalytics;
