import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { Camera, User, Phone, Mail, MapPin, BookOpen, AlertCircle, CheckCircle2, History, Building, Calendar } from 'lucide-react';
import { UserAvatar } from '../../components/UserAvatar';

const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
    fetchHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students/me');
      setProfile(res.data.student);
    } catch (err: any) {
      console.error('Failed to fetch profile', err);
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/accommodation/history/me');
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('profilePicture', file);

      const res = await api.post('/students/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProfile({ ...profile, profilePicture: res.data.profilePicture });
      setSuccess('Profile picture updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to upload image', err);
      setError(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-600 ring-1 ring-red-200">
        <AlertCircle className="h-6 w-6 mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your personal information and profile picture.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Accommodation History
        </button>
      </div>

      {activeTab === 'profile' ? (
        <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              
              {/* Profile Image Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-slate-100 flex items-center justify-center">
                    <UserAvatar 
                      imageUrl={profile?.profilePicture} 
                      name={`${profile?.personalDetails?.firstName} ${profile?.personalDetails?.lastName}`} 
                      className="h-full w-full" 
                    />
                  </div>
                  
                  <button
                    onClick={handleImageClick}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 rounded-full bg-indigo-600 p-2 text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    title="Change Profile Picture"
                  >
                    {uploading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-slate-900">{profile?.personalDetails?.firstName} {profile?.personalDetails?.lastName}</h2>
                  <p className="text-sm text-slate-500">{profile?.personalDetails?.rollNumber}</p>
                </div>
              </div>

              {/* Profile Details Section */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4" /> Email Address
                  </h3>
                  <p className="text-slate-900">{profile?.personalDetails?.email}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4" /> Phone Number
                  </h3>
                  <p className="text-slate-900">{profile?.personalDetails?.phone}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4" /> Department
                  </h3>
                  <p className="text-slate-900">{profile?.personalDetails?.department}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-1">
                    <User className="h-4 w-4" /> Year
                  </h3>
                  <p className="text-slate-900">{profile?.personalDetails?.year || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Local Guardian Section */}
            {profile?.guardianDetails && (
              <div className="mt-10 pt-8 border-t border-slate-200">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Local Guardian Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-1">Name</h4>
                    <p className="text-slate-900">{profile.guardianDetails.guardianName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-1">Relation</h4>
                    <p className="text-slate-900">{profile.guardianDetails.guardianRelation}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Phone
                    </h4>
                    <p className="text-slate-900">{profile.guardianDetails.guardianPhone}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Address
                    </h4>
                    <p className="text-slate-900">{profile.address?.permanentAddress}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl p-12 text-center">
              <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No History Found</h3>
              <p className="text-slate-500">You don't have any past accommodation records.</p>
            </div>
          ) : (
            history.map((record) => (
              <div key={record._id} className="bg-white shadow-sm ring-1 ring-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    <span className="font-bold text-slate-900">Academic Year: {record.academicYear}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {new Date(record.assignedAt).toLocaleDateString()} - {record.unassignedAt ? new Date(record.unassignedAt).toLocaleDateString() : 'Present'}
                  </span>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-lg bg-indigo-50 p-2 text-indigo-600">
                      <Building className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Hostel & Room</p>
                      <p className="text-sm font-semibold text-slate-900">{record.hostelName} - {record.blockName}</p>
                      <p className="text-sm text-slate-600">Room {record.roomNumber}, Bed {record.bedNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-lg bg-emerald-50 p-2 text-emerald-600">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Warden In-charge</p>
                      <p className="text-sm font-semibold text-slate-900">{record.wardenName || 'N/A'}</p>
                      <p className="text-sm text-slate-600">{record.wardenContact || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-lg bg-amber-50 p-2 text-amber-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Status</p>
                      <p className="text-sm font-semibold text-slate-900">{record.unassignedAt ? 'Completed' : 'Active'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
