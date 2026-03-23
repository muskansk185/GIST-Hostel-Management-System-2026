import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { User, Building, Users, Calendar, MessageSquare, CreditCard, AlertCircle } from 'lucide-react';

const StudentOverview: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [student, setStudent] = useState<any>(null);
  const [accommodation, setAccommodation] = useState<any>(null);
  const [roommates, setRoommates] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [rollNumberToLink, setRollNumberToLink] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');

  const [students, setStudents] = useState<any[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError('');
      const studentRes = await api.get('/students/linked-student');
      const studentData = studentRes.data.student;
      setStudent(studentData);
      setStudents(studentRes.data.students || [studentData]);

      if (studentData) {
        const [accRes, leaveRes, compRes, feeRes] = await Promise.allSettled([
          api.get(`/accommodation/student/${studentData._id}`),
          api.get(`/leaves/student/${studentData._id}`),
          api.get(`/complaints/student/${studentData._id}`),
          api.get(`/fees/student/${studentData._id}`)
        ]);

        if (accRes.status === 'fulfilled') {
          const accData = accRes.value.data;
          setAccommodation(accData);
          
          if (accData?.roomId?._id) {
            try {
              const roommatesRes = await api.get(`/accommodation/room/${accData.roomId._id}`);
              const otherOccupants = roommatesRes.data.filter(
                (occupant: any) => {
                  const occId = occupant.studentId?._id || occupant.studentId;
                  const myId = studentData._id;
                  return occId?.toString() !== myId?.toString();
                }
              );
              setRoommates(otherOccupants);
            } catch (err) {
              console.error('Failed to fetch roommates', err);
            }
          }
        }
        
        if (leaveRes.status === 'fulfilled') setLeaves(leaveRes.value.data);
        if (compRes.status === 'fulfilled') setComplaints(compRes.value.data);
        if (feeRes.status === 'fulfilled') setFees(feeRes.value.data);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setStudent(null);
      } else {
        setError('Failed to load student overview. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOverviewData();
    }
  }, [user]);

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumberToLink.trim()) return;
    
    try {
      setLinking(true);
      setLinkError('');
      await api.post('/students/link-parent', { rollNumber: rollNumberToLink.trim() });
      setRollNumberToLink('');
      setShowLinkModal(false);
      await fetchOverviewData();
    } catch (err: any) {
      setLinkError(err.response?.data?.message || 'Failed to link student. Please check the roll number.');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          Loading student overview...
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
      <div className="max-w-md mx-auto mt-10">
        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 mb-4">
            <User className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Link Student Account</h2>
          <p className="text-sm text-slate-500 mb-6">
            Please enter your child's roll number to link their account and view their details.
          </p>
          
          <form onSubmit={handleLinkStudent} className="space-y-4">
            <div>
              <input
                type="text"
                required
                placeholder="Enter Roll Number"
                className="block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                value={rollNumberToLink}
                onChange={(e) => setRollNumberToLink(e.target.value)}
              />
            </div>
            {linkError && (
              <p className="text-sm text-red-600 text-left">{linkError}</p>
            )}
            <button
              type="submit"
              disabled={linking || !rollNumberToLink.trim()}
              className="w-full flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {linking ? 'Linking...' : 'Link Student'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Comprehensive view of {student.personalDetails?.firstName}'s hostel life.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {students.length > 1 && (
            <select 
              className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              value={student._id}
              onChange={(e) => {
                const selected = students.find(s => s._id === e.target.value);
                if (selected) {
                  setStudent(selected);
                  // Refetch data for selected student
                  api.get(`/accommodation/student/${selected._id}`).then(res => setAccommodation(res.data)).catch(() => setAccommodation(null));
                  api.get(`/leaves/student/${selected._id}`).then(res => setLeaves(res.data)).catch(() => setLeaves([]));
                  api.get(`/complaints/student/${selected._id}`).then(res => setComplaints(res.data)).catch(() => setComplaints([]));
                  api.get(`/fees/student/${selected._id}`).then(res => setFees(res.data)).catch(() => setFees([]));
                }
              }}
            >
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.personalDetails?.firstName} {s.personalDetails?.lastName} ({s.personalDetails?.rollNumber})</option>
              ))}
            </select>
          )}
          
          <button
            onClick={() => setShowLinkModal(true)}
            className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-300 hover:bg-indigo-50"
          >
            Link Another Student
          </button>
        </div>
      </div>

      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Link Student Account</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-500">
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleLinkStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900 mb-1">Student Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Roll Number"
                  className="block w-full rounded-md border-0 py-2 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  value={rollNumberToLink}
                  onChange={(e) => setRollNumberToLink(e.target.value)}
                />
              </div>
              {linkError && (
                <p className="text-sm text-red-600 text-left">{linkError}</p>
              )}
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="submit"
                  disabled={linking || !rollNumberToLink.trim()}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 disabled:opacity-50"
                >
                  {linking ? 'Linking...' : 'Link Student'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:col-start-1 sm:mt-0"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Details */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Profile Details</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-slate-100">
              <div className="shrink-0">
                {student.profilePicture ? (
                  <img src={student.profilePicture} alt="Student" className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-50" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center ring-4 ring-slate-50">
                    <User className="h-10 w-10 text-indigo-600" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-xl font-bold text-slate-900">{student.personalDetails?.firstName} {student.personalDetails?.lastName}</h3>
                <p className="text-sm text-slate-500">{student.personalDetails?.rollNumber}</p>
                <span className="mt-2 inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 w-fit">
                  {student.personalDetails?.department} - {student.personalDetails?.year}
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-500">Contact Number</dt>
                <dd className="mt-1 text-sm text-slate-900">{student.personalDetails?.phone || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Email Address</dt>
                <dd className="mt-1 text-sm text-slate-900">{student.personalDetails?.email || 'N/A'}</dd>
              </div>
              
              {student.guardianDetails && (
                <div className="col-span-1 sm:col-span-2 mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-900 mb-4">Local Guardian Details</h4>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Name</dt>
                      <dd className="mt-1 text-sm text-slate-900">{student.guardianDetails.guardianName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Relation</dt>
                      <dd className="mt-1 text-sm text-slate-900">{student.guardianDetails.guardianRelation}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Phone</dt>
                      <dd className="mt-1 text-sm text-slate-900">{student.guardianDetails.guardianPhone}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500">Address</dt>
                      <dd className="mt-1 text-sm text-slate-900">{student.address?.permanentAddress}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Accommodation Details */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
              <Building className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Accommodation</h2>
          </div>
          <div className="p-6">
            {accommodation ? (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Hostel</dt>
                  <dd className="mt-1 text-sm text-slate-900">{accommodation.roomId?.floorId?.blockId?.hostelId?.name || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Room Number</dt>
                  <dd className="mt-1 text-sm text-slate-900">{accommodation.roomId?.roomNumber || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Bed Number</dt>
                  <dd className="mt-1 text-sm text-slate-900">{accommodation.bedNumber || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Assigned On</dt>
                  <dd className="mt-1 text-sm text-slate-900">{new Date(accommodation.assignedAt).toLocaleDateString()}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-slate-500 italic">Not currently assigned to a room.</p>
            )}
          </div>
        </div>

        {/* Roommates */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
            <div className="rounded-lg bg-sky-100 p-2 text-sky-600">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Roommates</h2>
          </div>
          <div className="p-6">
            {roommates.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No roommates currently.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {roommates.map((occupant) => (
                  <li key={occupant._id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {occupant.student?.personalDetails?.firstName} {occupant.student?.personalDetails?.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{occupant.student?.personalDetails?.department}</p>
                    </div>
                    <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                      Bed {occupant.bedNumber}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-amber-100 p-3 text-amber-600 mb-3">
              <Calendar className="h-6 w-6" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{leaves.length}</p>
            <p className="text-sm font-medium text-slate-500">Total Leaves</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-rose-100 p-3 text-rose-600 mb-3">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{complaints.length}</p>
            <p className="text-sm font-medium text-slate-500">Total Complaints</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;
