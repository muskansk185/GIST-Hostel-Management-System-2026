import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bed, Users, AlertCircle, DollarSign, PlusCircle, FileText, X, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import NoticeBoard from '../../components/NoticeBoard';

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

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [occupancy, setOccupancy] = useState<any>(null);
  const [complaints, setComplaints] = useState<any>(null);
  const [fees, setFees] = useState<any>(null);
  const [departments, setDepartments] = useState<any>(null);

  const [revenueData, setRevenueData] = useState<any[]>([]);

  // Modal states
  const [showHostelModal, setShowHostelModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Form data
  const [hostels, setHostels] = useState<any[]>([]);
  const [wardens, setWardens] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, compRes, feeRes, deptRes, hostelsRes, wardensRes, revenueRes] = await Promise.all([
        api.get('/analytics/stats'),
        api.get('/analytics/dashboard/complaints'),
        api.get('/analytics/dashboard/fees'),
        api.get('/analytics/dashboard/departments'),
        api.get('/hostels/hostels'),
        api.get('/users?role=WARDEN'),
        api.get('/fees/revenue')
      ]);
      
      setOccupancy({
        totalBeds: statsRes.data.totalBeds,
        occupiedBeds: statsRes.data.occupiedBeds,
        availableBeds: statsRes.data.availableBeds,  
        occupancyRate: statsRes.data.totalBeds ? Math.round((statsRes.data.occupiedBeds / statsRes.data.totalBeds) * 100) : 0
      });
      setComplaints(compRes.data);
      setFees(feeRes.data);
      setDepartments(deptRes.data);
      setHostels(hostelsRes.data);
      setWardens(wardensRes.data);
      setRevenueData(revenueRes.data);
    } catch (err: any) {
      console.error('Failed to fetch admin dashboard data', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateHostel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      type: formData.get('type'),
      capacity: Number(formData.get('capacity')),
      wardenId: formData.get('wardenId') || undefined
    };

    try {
      setActionLoading(true);
      await api.post('/hostels/hostels', data);
      setShowHostelModal(false);
      fetchDashboardData();
      setNotification({ type: 'success', message: 'Hostel created successfully' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to create hostel' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      rollNumber: formData.get('rollNumber'),
      department: formData.get('department'),
      year: formData.get('year'),
      phone: formData.get('phone'),
      parentName: formData.get('parentName'),
      parentPhone: formData.get('parentPhone'),
      hostelId: formData.get('hostelId') || undefined
    };

    try {
      setActionLoading(true);
      await api.post('/students', data);
      setShowStudentModal(false);
      fetchDashboardData();
      setNotification({ type: 'success', message: 'Student created successfully' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to create student' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const hostelSelect = e.currentTarget.elements.namedItem('hostelId') as HTMLSelectElement;
    const selectedHostelIds = Array.from(hostelSelect.selectedOptions).map(option => option.value);

    const data = {
      feeName: formData.get('feeName'),
      amount: Number(formData.get('amount')),
      hostelId: selectedHostelIds,
      dueDate: formData.get('dueDate')
    };

    try {
      setActionLoading(true);
      await api.post('/fees/create', data);
      setShowFeeModal(false);
      fetchDashboardData();
      setNotification({ type: 'success', message: 'Fee created successfully' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to create fee' });
    } finally {
      setActionLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back, {user?.name || user?.email}. System overview.</p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowHostelModal(true)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <PlusCircle className="mr-1.5 h-4 w-4 text-slate-400" />
            Add Hostel
          </button>
          <button 
            onClick={() => setShowStudentModal(true)}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Users className="mr-1.5 h-4 w-4 text-slate-400" />
            Add Student
          </button>
          <button 
            onClick={() => setShowFeeModal(true)}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <DollarSign className="mr-1.5 h-4 w-4" />
            Create Fee
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Beds" 
          value={occupancy?.totalBeds || 0} 
          icon={<Bed className="h-6 w-6" />} 
          loading={loading} 
        />
        <StatCard 
          title="Occupied Beds" 
          value={occupancy?.occupiedBeds || 0} 
          icon={<Users className="h-6 w-6" />} 
          loading={loading} 
        />
        <StatCard 
          title="Available Beds" 
          value={occupancy?.availableBeds || 0} 
          icon={<Bed className="h-6 w-6" />} 
          loading={loading} 
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(fees?.totalFeesCollected || 0)} 
          icon={<DollarSign className="h-6 w-6" />} 
          loading={loading} 
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Fee Revenue */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Monthly Fee Revenue</h3>
          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full w-full bg-slate-100 animate-pulse rounded-lg"></div>
            ) : revenueData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500">No revenue data available</div>
            )}
          </div>
        </div>

        {/* Complaint Categories */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Complaint Categories</h3>
          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full w-full bg-slate-100 animate-pulse rounded-full"></div>
            ) : complaints?.complaintsByCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaints.complaintsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="category"
                  >
                    {complaints.complaintsByCategory.map((entry: any, index: number) => (
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
      </div>

      {/* Department Distribution */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900 mb-6">Department Distribution</h3>
        <div className="h-72 w-full">
          {loading ? (
            <div className="h-full w-full bg-slate-100 animate-pulse rounded-lg"></div>
          ) : departments?.studentCountByDepartment?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments.studentCountByDepartment} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis dataKey="department" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">No department data available</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <NoticeBoard />
      </div>

      {/* Add Hostel Modal */}
      {showHostelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Add Hostel</h2>
              <button onClick={() => setShowHostelModal(false)} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateHostel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Hostel Name</label>
                <input required name="name" type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Type</label>
                <select required name="type" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  <option value="BOYS">BOYS</option>
                  <option value="GIRLS">GIRLS</option>
                  <option value="MIXED">MIXED</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Capacity</label>
                <input required name="capacity" type="number" min="1" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Warden</label>
                <select name="wardenId" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  <option value="">Select Warden (Optional)</option>
                  {wardens.map(w => (
                    <option key={w?._id || w?.id} value={w?._id || w?.id}>{w?.name || 'Unknown'}</option>
                  ))}
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowHostelModal(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={actionLoading} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {actionLoading ? 'Creating...' : 'Create Hostel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Add Student</h2>
              <button onClick={() => setShowStudentModal(false)} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input required name="name" type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Roll Number</label>
                <input required name="rollNumber" type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Department</label>
                <select required name="department" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  <option value="">Select Department</option>
                  <option value="CSE">Computer Science and Engineering (CSE)</option>
                  <option value="ISE">Information Science and Engineering (ISE)</option>
                  <option value="ECE">Electronics and Communication Engineering (ECE)</option>
                  <option value="EEE">Electrical and Electronics Engineering (EEE)</option>
                  <option value="MECH">Mechanical Engineering (MECH)</option>
                  <option value="CIVIL">Civil Engineering (CIVIL)</option>
                  <option value="AIML">Artificial Intelligence and Machine Learning (AIML)</option>
                  <option value="AIDS">Artificial Intelligence and Data Science (AIDS)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Year</label>
                <input name="year" type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Phone</label>
                <input required name="phone" type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Parent Name</label>
                <input name="parentName" type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Parent Phone</label>
                <input name="parentPhone" type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Hostel</label>
                <select name="hostelId" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                  <option value="">Select Hostel (Optional)</option>
                  {hostels.map(h => (
                    <option key={h?._id} value={h?._id}>{h?.name || 'Unknown'}</option>
                  ))}
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowStudentModal(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={actionLoading} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {actionLoading ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Fee Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Create Fee</h2>
              <button onClick={() => setShowFeeModal(false)} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Fee Name</label>
                <input required name="feeName" type="text" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Amount</label>
                <input required name="amount" type="number" min="1" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Applicable Hostels (Select one or more)</label>
                <select 
                  required 
                  multiple 
                  name="hostelId" 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm min-h-[100px]"
                >
                  {hostels.map(h => (
                    <option key={h?._id} value={h?._id}>{h?.name || 'Unknown'}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">Hold Ctrl (Cmd on Mac) to select multiple hostels.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Due Date</label>
                <input required name="dueDate" type="date" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowFeeModal(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={actionLoading} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {actionLoading ? 'Creating...' : 'Create Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
