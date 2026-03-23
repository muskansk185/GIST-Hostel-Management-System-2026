import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Building, CreditCard, Calendar, Shield } from 'lucide-react';
import api from '../api/axios';

interface StudentDetailModalProps {
  studentId: string;
  onClose: () => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ studentId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        // Fetch student details
        const studentRes = await api.get(`/students/${studentId}`);
        const student = studentRes.data;

        // Fetch parent details (find user with role PARENT who has this studentId)
        const parentRes = await api.get(`/users?role=PARENT&studentId=${studentId}`);
        const parent = parentRes.data[0];

        // Fetch fee status
        const feeRes = await api.get(`/fees/status/${studentId}`);
        const feeStatus = feeRes.data;

        setData({ student, parent, feeStatus });
      } catch (err: any) {
        console.error('Failed to fetch student details', err);
        setError('Failed to load student details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [studentId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl rounded-xl bg-white p-12 shadow-xl flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-slate-500 font-medium">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-red-600">Error</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-slate-600">{error || 'Student not found'}</p>
        </div>
      </div>
    );
  }

  const { student, parent, feeStatus } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl overflow-hidden">
              {student.profilePicture ? (
                <img src={student.profilePicture} alt={student.personalDetails?.firstName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                `${student.personalDetails?.firstName?.charAt(0)}${student.personalDetails?.lastName?.charAt(0)}`
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{student.personalDetails?.firstName} {student.personalDetails?.lastName}</h2>
              <p className="text-sm text-slate-500">{student.personalDetails?.rollNumber} • {student.personalDetails?.department}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Personal & Contact Info */}
          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 rounded-xl p-4 ring-1 ring-slate-200">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{student.personalDetails?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{student.personalDetails?.phone}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Year {student.personalDetails?.year || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Status: Active</span>
                </div>
              </div>
            </div>
          </section>

          {/* Room Allocation */}
          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building className="h-4 w-4" /> Room Allocation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl ring-1 ring-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">Hostel</p>
                <p className="font-semibold text-slate-900">{student.hostelId?.name || 'Not Assigned'}</p>
              </div>
              <div className="bg-white p-4 rounded-xl ring-1 ring-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">Room Number</p>
                <p className="font-semibold text-slate-900">{student.roomId?.roomNumber || 'N/A'}</p>
              </div>
              <div className="bg-white p-4 rounded-xl ring-1 ring-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">Bed Number</p>
                <p className="font-semibold text-slate-900">{student.bedId?.bedNumber || 'N/A'}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Parent Details */}
            <section>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Parent Details</h3>
              <div className="bg-white p-4 rounded-xl ring-1 ring-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-900">{student.parentDetails?.parentName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{student.parentDetails?.parentPhone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{student.parentDetails?.parentEmail}</span>
                </div>
              </div>
            </section>

            {/* Local Guardian Details */}
            <section>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Local Guardian</h3>
              <div className="bg-white p-4 rounded-xl ring-1 ring-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-slate-900">{student.guardianDetails?.guardianName} ({student.guardianDetails?.guardianRelation})</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{student.guardianDetails?.guardianPhone}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                  <span className="text-slate-600">{student.address?.permanentAddress}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Fee Status */}
          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Fee Status
            </h3>
            <div className={`rounded-xl p-4 ring-1 flex items-center justify-between ${
              feeStatus?.isPaid ? 'bg-green-50 ring-green-200' : 'bg-red-50 ring-red-200'
            }`}>
              <div>
                <p className={`text-sm font-bold ${feeStatus?.isPaid ? 'text-green-800' : 'text-red-800'}`}>
                  {feeStatus?.isPaid ? 'Fees Fully Paid' : 'Pending Dues'}
                </p>
                <p className="text-xs text-slate-500">Last Payment: {feeStatus?.lastPaymentDate ? new Date(feeStatus.lastPaymentDate).toLocaleDateString() : 'Never'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Amount Pending</p>
                <p className={`text-lg font-bold ${feeStatus?.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{feeStatus?.pendingAmount || 0}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-end">
          <button onClick={onClose} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-300 hover:bg-slate-50">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;
