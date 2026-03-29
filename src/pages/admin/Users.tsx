import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Loader2, Search, Filter, Plus, X, Eye, Edit2, User as UserIcon, History } from 'lucide-react';
import { UserRole } from '../../context/AuthContext';
import api from '../../api/axios';
import { UserAvatar } from '../../components/UserAvatar';

interface AccommodationHistory {
  _id: string;
  academicYear: string;
  blockName: string;
  roomNumber: string;
  wardenName: string;
  wardenContact: string;
  assignedAt: string;
  unassignedAt?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  phone?: string;
  hostelId?: string;
  department?: string;
  studentIds?: string[];
  profilePicture?: string;
  hostelHistory?: {
    hostel: { _id: string; name: string };
    assignedFrom: string;
    assignedTo: string | null;
  }[];
}

interface Student {
  _id: string;
  userId: string;
  personalDetails: {
    rollNumber: string;
    department: string;
    year: string;
    gender: string;
    dob: string;
    phone: string;
  };
  parentDetails: {
    parentName: string;
    parentPhone: string;
    parentEmail: string;
  };
  guardianDetails: {
    guardianName: string;
    guardianPhone: string;
    guardianRelation: string;
  };
  address: {
    permanentAddress: string;
    currentAddress: string;
  };
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [studentHistory, setStudentHistory] = useState<AccommodationHistory[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hostels, setHostels] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const initialUserState = {
    name: '',
    email: '',
    password: '',
    phone: '',
    role: UserRole.STUDENT,
    hostelId: '',
    department: '',
    studentIds: [] as string[],
    personalDetails: {
      rollNumber: '',
      department: '',
      year: '',
      gender: '',
      dob: '',
      phone: ''
    },
    parentDetails: {
      parentName: '',
      parentPhone: '',
      parentEmail: ''
    },
    guardianDetails: {
      guardianName: '',
      guardianPhone: '',
      guardianRelation: ''
    },
    address: {
      permanentAddress: '',
      currentAddress: ''
    }
  };

  const [newUser, setNewUser] = useState(initialUserState);
  const [editUser, setEditUser] = useState(initialUserState);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    if (showAddModal || showEditModal) {
      const role = showAddModal ? newUser.role : editUser.role;
      if (role === UserRole.WARDEN) {
        fetchHostels();
      }
      if (role === UserRole.PARENT) {
        fetchStudents(true, showEditModal ? editUser._id : undefined);
      }
    }
  }, [showAddModal, showEditModal, newUser.role, editUser.role, editUser._id]);

  const fetchHostels = async () => {
    try {
      const response = await api.get('/hostels/hostels');
      setHostels(response.data);
    } catch (err) {
      console.error('Failed to fetch hostels', err);
    }
  };

  const fetchStudents = async (unlinkedOnly = false, parentId?: string) => {
    try {
      const params: any = { unlinkedOnly: unlinkedOnly ? 'true' : 'false' };
      if (parentId) params.parentId = parentId;
      const response = await api.get('/students', { params });
      setStudents(response.data);
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      setNotification({ type: 'success', message: 'User created successfully' });
      setShowAddModal(false);
      setNewUser(initialUserState);
      fetchUsers();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to create user' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsEditing(true);
    try {
      const response = await api.put(`/users/${selectedUser._id}`, editUser);
      setNotification({ type: 'success', message: 'User updated successfully' });
      setShowEditModal(false);
      fetchUsers();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to update user' });
    } finally {
      setIsEditing(false);
    }
  };

  const openEditModal = async (user: User) => {
    setSelectedUser(user);
    let userDetails = { ...initialUserState, ...user };
    
    if (user.role === UserRole.STUDENT) {
      try {
        const response = await api.get(`/students?userId=${user._id}`);
        if (response.data && response.data.length > 0) {
          const student = response.data[0];
          userDetails = {
            ...userDetails,
            personalDetails: student.personalDetails,
            parentDetails: student.parentDetails,
            guardianDetails: student.guardianDetails,
            address: student.address
          };
        }
      } catch (err) {
        console.error('Failed to fetch student details', err);
      }
    }
    
    setEditUser(userDetails as any);
    setShowEditModal(true);
  };

  const [viewStudentDetails, setViewStudentDetails] = useState<any>(null);

  const openViewModal = async (user: User) => {
    setSelectedUser(user);
    setViewStudentDetails(null);
    setShowViewModal(true);

    if (user.role === UserRole.STUDENT) {
      try {
        const response = await api.get(`/students?userId=${user._id}`);
        if (response.data && response.data.length > 0) {
          setViewStudentDetails(response.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch student details', err);
      }
    }
  };

  const openHistoryModal = async (user: User) => {
    setSelectedUser(user);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setStudentHistory([]);
    
    if (user.role === UserRole.WARDEN) {
      if (!user.hostelHistory || user.hostelHistory.length === 0) {
        console.log('Warden has no hostel history:', user);
      }
      setStudentHistory(user.hostelHistory?.map(h => ({
        _id: h.hostel._id,
        academicYear: `${new Date(h.assignedFrom).getFullYear()} - ${h.assignedTo ? new Date(h.assignedTo).getFullYear() : 'Present'}`,
        blockName: h.hostel.name,
        roomNumber: 'N/A',
        wardenName: user.name,
        wardenContact: user.phone || 'N/A',
        assignedAt: h.assignedFrom,
        unassignedAt: h.assignedTo || undefined
      })).sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()) || []);
      setHistoryLoading(false);
    } else {
      try {
        let studentId = user.studentIds && user.studentIds.length > 0 ? user.studentIds[0] : null;
        
        if (!studentId) {
          const studentRes = await api.get(`/students?userId=${user._id}`);
          if (studentRes.data && studentRes.data.length > 0) {
            studentId = studentRes.data[0]._id;
          }
        }

        if (studentId) {
          const response = await api.get(`/accommodation/history/${studentId}`);
          setStudentHistory(response.data.sort((a: AccommodationHistory, b: AccommodationHistory) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()));
        } else {
          setNotification({ type: 'error', message: 'Student record not found' });
        }
      } catch (err) {
        console.error('Failed to fetch student history', err);
        setNotification({ type: 'error', message: 'Failed to fetch accommodation history' });
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  const renderRoleFields = (user: any, setUser: any) => {
    switch (user.role) {
      case UserRole.HOD:
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700">Department *</label>
            <select
              required
              value={user.department}
              onChange={(e) => setUser({...user, department: e.target.value})}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
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
        );
      case UserRole.WARDEN:
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700">Assign Hostel (Optional)</label>
            <select 
              value={user.hostelId}
              onChange={(e) => setUser({...user, hostelId: e.target.value})}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select Hostel</option>
              {hostels.map(h => (
                <option key={h?._id} value={h?._id}>{h?.name || 'Unknown'}</option>
              ))}
            </select>
          </div>
        );
      case UserRole.PARENT:
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700">Link Students *</label>
            <select 
              multiple
              required
              value={user.studentIds}
              onChange={(e) => {
                const target = e.target as HTMLSelectElement;
                const values = Array.from(target.selectedOptions, option => option.value);
                setUser({...user, studentIds: values});
              }}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-32"
            >
              {students.map(s => (
                <option key={s._id} value={s._id}>
                  {s.personalDetails?.rollNumber || 'No Roll'} - {s.personalDetails?.firstName || 'Unnamed'} {s.personalDetails?.lastName || 'Student'}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Hold Ctrl (Cmd) to select multiple students.</p>
          </div>
        );
      case UserRole.STUDENT:
        return (
          <div className="space-y-4 border-t border-slate-100 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-slate-900">Student Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Roll Number *</label>
                <input 
                  required 
                  type="text" 
                  value={user.personalDetails.rollNumber}
                  onChange={(e) => setUser({...user, personalDetails: {...user.personalDetails, rollNumber: e.target.value}})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Department *</label>
                <select 
                  required 
                  value={user.personalDetails.department}
                  onChange={(e) => setUser({...user, personalDetails: {...user.personalDetails, department: e.target.value}})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                >
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Year *</label>
                <input 
                  required 
                  type="text" 
                  value={user.personalDetails.year}
                  onChange={(e) => setUser({...user, personalDetails: {...user.personalDetails, year: e.target.value}})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Gender *</label>
                <select 
                  required 
                  value={user.personalDetails.gender}
                  onChange={(e) => setUser({...user, personalDetails: {...user.personalDetails, gender: e.target.value}})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Date of Birth *</label>
              <input 
                required 
                type="date" 
                value={user.personalDetails.dob || ""}
                onChange={(e) => setUser({...user, personalDetails: {...user.personalDetails, dob: e.target.value}})}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
              />
            </div>

            <h3 className="text-sm font-semibold text-slate-900 pt-2">Parent Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Parent Name *</label>
                <input 
                  required 
                  type="text" 
                  value={user.parentDetails.parentName}
                  onChange={(e) => setUser({...user, parentDetails: {...user.parentDetails, parentName: e.target.value}})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Parent Phone *</label>
                <input 
                  required 
                  type="text" 
                  value={user.parentDetails.parentPhone}
                  onChange={(e) => setUser({...user, parentDetails: {...user.parentDetails, parentPhone: e.target.value}})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-900 pt-2">Guardian Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Guardian Name *</label>
                <input 
                  required 
                  type="text" 
                  value={user.guardianDetails.guardianName}
                  onChange={(e) => setUser({...user, guardianDetails: {...user.guardianDetails, guardianName: e.target.value}})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Relation *</label>
                <input 
                  required 
                  type="text" 
                  value={user.guardianDetails.guardianRelation}
                  onChange={(e) => setUser({...user, guardianDetails: {...user.guardianDetails, guardianRelation: e.target.value}})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-900 pt-2">Address</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700">Permanent Address *</label>
              <textarea 
                required 
                value={user.address.permanentAddress}
                onChange={(e) => setUser({...user, address: {...user.address, permanentAddress: e.target.value}})}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Current Address *</label>
              <textarea 
                required 
                value={user.address.currentAddress}
                onChange={(e) => setUser({...user, address: {...user.address, currentAddress: e.target.value}})}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (roleFilter !== 'All') queryParams.append('role', roleFilter);
      if (statusFilter !== 'All') queryParams.append('status', statusFilter);
      
      const response = await fetch(`/api/v1/users?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => (u._id === userId ? { ...u, role: updatedUser.role } : u)));
      setNotification({ type: 'success', message: 'User role updated successfully' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update user role' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => (u._id === userId ? { ...u, isActive: updatedUser.isActive } : u)));
      setNotification({ type: 'success', message: 'User status updated successfully' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update user status' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        <p className="font-medium">Error loading users</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`rounded-xl p-4 flex items-start justify-between ${notification.type === 'success' ? 'bg-green-50 text-green-800 ring-1 ring-green-200' : 'bg-red-50 text-red-800 ring-1 ring-red-200'}`}>
          <div className="flex gap-3">
            {notification.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm ring-1 ring-slate-200">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="All">All Roles</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="WARDEN">WARDEN</option>
              <option value="HOD">HOD</option>
              <option value="STUDENT">STUDENT</option>
              <option value="PARENT">PARENT</option>
            </select>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {users.map((user) => (
                <tr key={user?._id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <UserAvatar imageUrl={user?.profilePicture} name={user?.name || 'User'} className="h-8 w-8 mr-3" />
                      <div className="text-sm font-medium text-slate-900">{user?.name || 'Unknown'}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-slate-500">{user?.email || 'No email'}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      disabled={actionLoading === user._id}
                      className="rounded-md border-slate-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {Object.values(UserRole).map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium flex gap-2">
                    <button
                      onClick={() => openViewModal(user)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-100"
                      title="View Profile"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {(user.role === UserRole.STUDENT || user.role === UserRole.WARDEN) && (
                      <button
                        onClick={() => openHistoryModal(user)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        title="View History"
                      >
                        <History className="h-4 w-4" />
                        History
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(user)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleStatusChange(user._id, user.isActive)}
                      disabled={actionLoading === user._id}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${
                        user.isActive
                          ? 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600'
                          : 'bg-green-600 hover:bg-green-500 focus-visible:outline-green-600'
                      }`}
                    >
                      {actionLoading === user._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4" />
                      )}
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Add User</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input 
                  required 
                  type="text" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input 
                  required 
                  type="email" 
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input 
                  required 
                  type="password" 
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Phone</label>
                <input 
                  type="text" 
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Role</label>
                <select 
                  required 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              {renderRoleFields(newUser, setNewUser)}

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isAdding} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {isAdding ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input 
                  required 
                  type="text" 
                  value={editUser.name}
                  onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input 
                  required 
                  type="email" 
                  value={editUser.email}
                  onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Phone</label>
                <input 
                  type="text" 
                  value={editUser.phone}
                  onChange={(e) => setEditUser({...editUser, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Role</label>
                <select 
                  required 
                  value={editUser.role}
                  onChange={(e) => setEditUser({...editUser, role: e.target.value as UserRole})}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              {renderRoleFields(editUser, setEditUser)}

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={isEditing} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Profile Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">User Profile</h2>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <UserAvatar
                  imageUrl={selectedUser?.profilePicture}
                  name={selectedUser?.name || "User"}
                  className="h-16 w-16"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedUser?.name || 'Unknown'}</h3>
                  <p className="text-sm text-slate-500">{selectedUser?.email || 'No email'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Role</p>
                  <p className="text-sm font-medium text-slate-900">{selectedUser.role}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
                  <p className={`text-sm font-medium ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Phone</p>
                  <p className="text-sm font-medium text-slate-900">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Joined Date</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedUser.role === UserRole.HOD && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Department</p>
                  <p className="text-sm font-medium text-slate-900">{selectedUser.department || 'Not assigned'}</p>
                </div>
              )}

              {selectedUser.role === UserRole.WARDEN && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Hostel</p>
                  <p className="text-sm font-medium text-slate-900">
                    {hostels.find(h => h._id === selectedUser.hostelId)?.name || 'Not assigned'}
                  </p>
                </div>
              )}

              {selectedUser.role === UserRole.PARENT && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Linked Students</p>
                  <div className="mt-2 space-y-1">
                    {selectedUser.studentIds && selectedUser.studentIds.length > 0 ? (
                      selectedUser.studentIds.map((sid: any) => {
                        const student = students.find(s => s._id === sid);
                        return (
                          <div key={sid} className="text-sm text-slate-900 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                            {student ? `${student.personalDetails?.rollNumber} - ${student.personalDetails?.firstName} ${student.personalDetails?.lastName}` : 'Loading student data...'}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-500 italic">No students linked</p>
                    )}
                  </div>
                </div>
              )}

              {selectedUser.role === UserRole.STUDENT && viewStudentDetails && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Personal Details</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-slate-500">Roll No:</span> {viewStudentDetails.personalDetails?.rollNumber}</div>
                      <div><span className="text-slate-500">Dept:</span> {viewStudentDetails.personalDetails?.department}</div>
                      <div><span className="text-slate-500">Year:</span> {viewStudentDetails.personalDetails?.year}</div>
                      <div><span className="text-slate-500">Gender:</span> {viewStudentDetails.personalDetails?.gender}</div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Parent Details</p>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div><span className="text-slate-500">Name:</span> {viewStudentDetails.parentDetails?.parentName}</div>
                      <div><span className="text-slate-500">Phone:</span> {viewStudentDetails.parentDetails?.parentPhone}</div>
                      <div><span className="text-slate-500">Email:</span> {viewStudentDetails.parentDetails?.parentEmail}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Guardian Details</p>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div><span className="text-slate-500">Name:</span> {viewStudentDetails.guardianDetails?.guardianName}</div>
                      <div><span className="text-slate-500">Relation:</span> {viewStudentDetails.guardianDetails?.guardianRelation}</div>
                      <div><span className="text-slate-500">Phone:</span> {viewStudentDetails.guardianDetails?.guardianPhone}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* History Modal */}
      {showHistoryModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
          <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedUser.role === UserRole.WARDEN ? 'Warden Hostel History' : 'Accommodation History'} - {selectedUser.name}
              </h2>
              <button 
                onClick={() => setShowHistoryModal(false)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : studentHistory.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Academic Year
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Block
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Room
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Warden Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Warden Contact
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {studentHistory.map((history) => (
                        <tr key={history._id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                            {history.academicYear}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                            {history.blockName}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                            {history.roomNumber}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                            {history.wardenName}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                            {history.wardenContact}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No history found.</p>
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
