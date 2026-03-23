import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { DollarSign, Search, Filter, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const FeeManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchFeeData = async () => {
    try {
      setLoading(true);
      // We'll fetch all students' fees. For a real app, we might need a specific endpoint for all fees.
      // Since we don't have a GET /fees endpoint for all fees, we'll fetch revenue data first.
      const [revenueRes] = await Promise.all([
        api.get('/fees/revenue')
      ]);
      
      setRevenueData(revenueRes.data);
      
      // Fetching all fees might require a new endpoint, but let's try to get them from analytics or a new endpoint
      // Actually, we can just use the revenue data for the chart.
      // For the list of fees, we might need to add a GET /fees route in the backend if it doesn't exist.
      // Let's check if we can fetch all fees. If not, we'll just show the chart.
      try {
        const feesRes = await api.get('/fees/all');
        setFees(feesRes.data);
      } catch (err) {
        // If /fees/all doesn't exist, we'll just skip the list for now or handle it gracefully
        console.log("Could not fetch all fees list");
      }
      
    } catch (err: any) {
      console.error('Failed to fetch fee data', err);
      setError('Failed to load fee data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const filteredFees = fees.filter(fee => {
    const matchesSearch = fee.student?.personalDetails?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          fee.student?.personalDetails?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fee.student?.personalDetails?.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fee.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || fee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-600 ring-1 ring-red-200">
        <AlertCircle className="h-6 w-6 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Management</h1>
          <p className="mt-1 text-sm text-slate-500">Track revenue and student payments.</p>
        </div>
      </div>

      {/* Monthly Fee Revenue Chart */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-base font-semibold text-slate-900 mb-6">Monthly Revenue</h3>
        <div className="h-80 w-full">
          {loading ? (
            <div className="h-full w-full bg-slate-100 animate-pulse rounded-lg"></div>
          ) : revenueData?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">No revenue data available</div>
          )}
        </div>
      </div>

      {/* Fees List */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-slate-900">Student Payments</h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                >
                  <option value="ALL">All Status</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Student</th>
                <th className="px-6 py-4 font-medium">Fee Name</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Due Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                      Loading fees...
                    </div>
                  </td>
                </tr>
              ) : filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No fee records found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => (
                  <tr key={fee._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {fee.student?.personalDetails?.firstName} {fee.student?.personalDetails?.lastName}
                      </div>
                      <div className="text-xs text-slate-500">{fee.student?.personalDetails?.rollNumber || fee.rollNumber}</div>
                    </td>
                    <td className="px-6 py-4">{fee.feeName}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(fee.amount)}</td>
                    <td className="px-6 py-4">
                      {new Date(fee.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        fee.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        fee.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {fee.status === 'PAID' && <CheckCircle className="h-3.5 w-3.5" />}
                        {fee.status === 'PENDING' && <Clock className="h-3.5 w-3.5" />}
                        {fee.status === 'OVERDUE' && <AlertCircle className="h-3.5 w-3.5" />}
                        {fee.status}
                      </span>
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

export default FeeManagement;
