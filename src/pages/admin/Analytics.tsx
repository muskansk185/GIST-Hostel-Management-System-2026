import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Building, Users, DoorOpen, BedDouble, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard = ({ title, value, icon, loading }: any) => (
  <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {loading ? (
          <div className="h-8 w-24 mt-2 bg-slate-200 animate-pulse rounded"></div>
        ) : (
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        )}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>
    </div>
  </div>
);

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState<any>(null);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [commonCategories, setCommonCategories] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const [statsRes, occRes, revRes, compRes, commonCompRes] = await Promise.all([
          api.get('/analytics/stats'),
          api.get('/analytics/occupancy'),
          api.get('/analytics/revenue'),
          api.get('/analytics/complaints'),
          api.get('/analytics/complaints/common')
        ]);
        
        setStats(statsRes.data);
        setOccupancy(Array.isArray(occRes.data) ? occRes.data : []);
        setRevenue(Array.isArray(revRes.data) ? revRes.data : []);
        setComplaints(Array.isArray(compRes.data) ? compRes.data : []);
        setCommonCategories(Array.isArray(commonCompRes.data) ? commonCompRes.data : []);
      } catch (err: any) {
        console.error('Failed to fetch analytics data', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);
  useEffect(() => {
  setIsMounted(true);
}, []);

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-600 ring-1 ring-red-200">
        <AlertCircle className="h-6 w-6 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Comprehensive system-wide statistics and charts.</p>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Total Hostels" 
          value={stats?.totalHostels || 0} 
          icon={<Building className="h-6 w-6" />} 
          loading={loading} 
        />
        <StatCard 
          title="Total Students" 
          value={stats?.totalStudents || 0} 
          icon={<Users className="h-6 w-6" />} 
          loading={loading} 
        />
        <StatCard 
          title="Total Rooms" 
          value={stats?.totalRooms || 0} 
          icon={<DoorOpen className="h-6 w-6" />} 
          loading={loading} 
        />
        <StatCard 
          title="Total Beds" 
          value={stats?.totalBeds || 0} 
          icon={<BedDouble className="h-6 w-6" />} 
          loading={loading} 
        />
        <StatCard 
          title="Occupied Beds" 
          value={stats?.occupiedBeds || 0} 
          icon={<CheckCircle className="h-6 w-6 text-emerald-600" />} 
          loading={loading} 
        />
        <StatCard 
          title="Available Beds" 
          value={stats?.availableBeds || 0} 
          icon={<XCircle className="h-6 w-6 text-amber-600" />} 
          loading={loading} 
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Occupancy Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Hostel Occupancy (%)</h3>
          
          <div className="h-72 min-h-[300px] w-full min-w-0">
            {loading ? (
              <div className="h-full w-full bg-slate-100 animate-pulse rounded-lg"></div>
            ) : isMounted && occupancy.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={occupancy} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="hostel" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value}%`, 'Occupancy']}
                  />
                  <Bar dataKey="occupancy" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No occupancy data available</div>
            )}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Monthly Revenue</h3>
          
          <div className="h-72 min-h-[300px] w-full min-w-0">
            {loading ? (
              <div className="h-full w-full bg-slate-100 animate-pulse rounded-lg"></div>
            ) : isMounted && revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No revenue data available</div>
            )}
          </div>
        </div>

        {/* Complaint Distribution */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Complaint Distribution by Category</h3>
          <div className="h-72 min-h-[300px] w-full min-w-0">
            {loading ? (
              <div className="h-full w-full bg-slate-100 animate-pulse rounded-full"></div>
            ) : isMounted && complaints.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={complaints}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="category"
                  >
                    {complaints.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No complaints data</div>
            )}
          </div>
        </div>

        {/* Top 3 Common Complaint Categories */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Top 3 Complaint Categories</h3>
          <div className="h-72 min-h-[300px] w-full min-w-0">
            {loading ? (
              <div className="h-full w-full bg-slate-100 animate-pulse rounded-lg"></div>
            ) : isMounted && commonCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={commonCategories} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={100} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No category data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
