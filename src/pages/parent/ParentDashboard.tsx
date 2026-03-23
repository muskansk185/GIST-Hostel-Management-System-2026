import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { User, Calendar, CreditCard, MessageSquare, AlertCircle, Building } from 'lucide-react';
import NoticeBoard from '../../components/NoticeBoard';

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [student, setStudent] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [accommodation, setAccommodation] = useState<any>(null);
  const [feeStatus, setFeeStatus] = useState<any>(null);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);

  const fetchDashboardData = async (studentId?: string) => {
    try {
      setLoading(true);
      // 1. Get linked students
      const studentRes = await api.get('/students/linked-student');
      const students = studentRes.data.students || [];
      setAllStudents(students);
      
      const currentStudent = studentId 
        ? students.find((s: any) => s._id === studentId) 
        : students[0];
        
      setStudent(currentStudent);

      if (currentStudent) {
        // 2. Fetch all other data in parallel
        const [accRes, feeRes, leaveRes, compRes] = await Promise.allSettled([
          api.get(`/accommodation/student/${currentStudent._id}`),
          api.get(`/fees/student/${currentStudent._id}`),
          api.get(`/leaves/history?studentId=${currentStudent._id}&status=PENDING`),
          api.get(`/complaints/student/${currentStudent._id}`)
        ]);

        if (accRes.status === 'fulfilled') setAccommodation(accRes.value.data);
        if (feeRes.status === 'fulfilled') setFeeStatus(feeRes.value.data);
        if (leaveRes.status === 'fulfilled') {
          // Filter pending leaves if the API returns all history
          const leaves = leaveRes.value.data;
          setPendingLeaves(Array.isArray(leaves) ? leaves.filter((l: any) => l.status === 'PENDING') : []);
        }
        if (compRes.status === 'fulfilled') setRecentComplaints(compRes.value.data.slice(0, 3));
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No student linked to this account. Please link a student profile first.');
      } else {
        setError('Failed to load dashboard data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleChildSwitch = (studentId: string) => {
    fetchDashboardData(studentId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-600 ring-1 ring-red-200 flex items-start gap-3">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-xl bg-amber-50 p-6 text-amber-700 ring-1 ring-amber-200 flex items-start gap-3">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <div>
          <h3 className="font-semibold">No Student Linked</h3>
          <p className="mt-1 text-sm">Please go to the Student Overview page to link your child's profile to your account.</p>
        </div>
      </div>
    );
  }

  // Calculate fee summary
  const totalFees = feeStatus?.reduce((sum: number, fee: any) => sum + fee.amount, 0) || 0;
  const paidFees = feeStatus?.filter((f: any) => f.status === 'PAID').reduce((sum: number, fee: any) => sum + fee.amount, 0) || 0;
  const pendingFees = totalFees - paidFees;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parent Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back, {user?.name}. Here's an overview of {student.personalDetails?.firstName}'s status.</p>
        </div>
        
        {allStudents.length > 1 && (
          <div className="relative w-full sm:w-64">
            <label htmlFor="child-select" className="block text-xs font-medium text-slate-500 mb-1">Switch Child</label>
            <select
              id="child-select"
              value={student._id}
              onChange={(e) => handleChildSwitch(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              {allStudents.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.personalDetails?.firstName} {s.personalDetails?.lastName} ({s.personalDetails?.rollNumber})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Student Info Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-full bg-indigo-100 p-3 text-indigo-600">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{student.personalDetails?.firstName} {student.personalDetails?.lastName}</h2>
              <p className="text-sm text-slate-500">{student.personalDetails?.rollNumber}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-medium text-slate-900">{student.personalDetails?.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Year:</span>
              <span className="font-medium text-slate-900">{student.personalDetails?.year}</span>
            </div>
          </div>
        </div>

        {/* Accommodation Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img src="/images/room.jpg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Accommodation</h2>
                <p className="text-sm text-slate-500">Current Room Details</p>
              </div>
            </div>
            {accommodation ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Hostel:</span>
                  <span className="font-medium text-slate-900">{accommodation.roomId?.floorId?.blockId?.hostelId?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Room:</span>
                  <span className="font-medium text-slate-900">{accommodation.roomId?.roomNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bed:</span>
                  <span className="font-medium text-slate-900">{accommodation.bedNumber || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Not currently assigned to a room.</p>
            )}
          </div>
        </div>

        {/* Fee Status Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-full bg-amber-100 p-3 text-amber-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Fee Status</h2>
              <p className="text-sm text-slate-500">Financial Overview</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Fees:</span>
              <span className="font-medium text-slate-900">${totalFees}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Paid:</span>
              <span className="font-medium text-emerald-600">${paidFees}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
              <span className="font-medium text-slate-900">Pending:</span>
              <span className={`font-bold ${pendingFees > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                ${pendingFees}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Leaves */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                <Calendar className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Pending Leave Approvals</h2>
            </div>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
              {pendingLeaves.length} Pending
            </span>
          </div>
          <div className="p-6">
            {pendingLeaves.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No pending leave requests.</p>
            ) : (
              <div className="space-y-4">
                {pendingLeaves.slice(0, 3).map((leave) => (
                  <div key={leave._id} className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-slate-900">
                        {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{leave.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Recent Complaints</h2>
          </div>
          <div className="p-6">
            {recentComplaints.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No recent complaints.</p>
            ) : (
              <div className="space-y-4">
                {recentComplaints.map((complaint) => (
                  <div key={complaint._id} className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-slate-900">{complaint.category}</p>
                      <p className="text-sm text-slate-500 mt-1 max-w-xs truncate" title={complaint.description}>{complaint.description}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      complaint.status === 'RESOLVED' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                      complaint.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                      'bg-amber-50 text-amber-700 ring-amber-600/20'
                    }`}>
                      {complaint.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <NoticeBoard />
      </div>
    </div>
  );
};

export default ParentDashboard;
