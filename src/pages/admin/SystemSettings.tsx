import React, { useState, useEffect } from 'react';
import { Shield, Server, Activity, Users, Home, DoorOpen, ToggleLeft, ToggleRight, Loader2, Database, AlertCircle, CheckCircle2, X, Calendar, Download } from 'lucide-react';
import api from '../../api/axios';

const SystemSettings: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [notification, setNotification] = useState<{show: boolean, type: 'success' | 'error', message: string}>({
    show: false,
    type: 'success',
    message: ''
  });

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const response = await api.get('/system/info');
        setSystemInfo(response.data);
        setMaintenanceMode(response.data.maintenanceMode);
      } catch (err: any) {
        setError('Failed to load system information');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: 'success', message: '' });
    }, 5000);
  };

  const toggleMaintenanceMode = async () => {
    try {
      const response = await api.patch('/settings/maintenance', {
        maintenanceMode: !maintenanceMode
      });
      setMaintenanceMode(response.data.data.maintenanceMode);
      showNotification('success', response.data.message);
    } catch (err: any) {
      showNotification('error', 'Failed to toggle maintenance mode');
    }
  };

  const handleFixLegacyData = async () => {
    setIsFixing(true);
    try {
      const response = await api.get('/students/fix-data');
      showNotification('success', response.data.message || 'Legacy data fixed successfully');
      // Refresh system info
      const infoResponse = await api.get('/system/info');
      setSystemInfo(infoResponse.data);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to fix legacy data');
    } finally {
      setIsFixing(false);
    }
  };

  const handleSeedTestData = async () => {
    setShowConfirmModal(false);
    setIsSeeding(true);
    try {
      const response = await api.post('/seed/seed');
      showNotification('success', response.data.message || 'Database seeded successfully');
      // Refresh system info
      const infoResponse = await api.get('/system/info');
      setSystemInfo(infoResponse.data);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to seed database');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    setShowClearModal(false);
    setIsClearing(true);
    try {
      const response = await api.post('/seed/clear');
      showNotification('success', response.data.message || 'Database cleared successfully');
      // Refresh system info
      const infoResponse = await api.get('/system/info');
      setSystemInfo(infoResponse.data);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to clear database');
    } finally {
      setIsClearing(false);
    }
  };

  const handleResetAcademicYear = async () => {
    setShowResetModal(false);
    setIsResetting(true);
    try {
      const response = await api.post('/accommodation/start-new-year', {
        newYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
      });
      showNotification('success', response.data.message || 'Academic year reset successfully');
      
      // Download report if available
      if (response.data.report) {
        downloadReport(response.data.report, `academic_year_reset_${new Date().getFullYear()}.json`);
      }

      // Refresh system info
      const infoResponse = await api.get('/system/info');
      setSystemInfo(infoResponse.data);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to reset academic year');
    } finally {
      setIsResetting(false);
    }
  };

  const downloadReport = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
        <p className="font-medium">Error loading system settings</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const rolePermissions = [
    { role: 'SUPER_ADMIN', access: 'Full system access, user management, system settings, analytics' },
    { role: 'WARDEN', access: 'Hostel management, student assignment, fee creation, complaint resolution' },
    { role: 'HOD', access: 'Department overview, student analytics, leave approvals' },
    { role: 'STUDENT', access: 'Profile management, fee payment, complaint logging, leave requests' },
    { role: 'PARENT', access: 'Linked student overview, fee payment, leave approvals' },
  ];

  const handleDownloadSystemReport = async () => {
    try {
      const response = await api.get('/system/report');
      downloadReport(response.data, `system_report_${new Date().toISOString().split('T')[0]}.json`);
      showNotification('success', 'System report downloaded successfully');
    } catch (err: any) {
      showNotification('error', 'Failed to download system report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadSystemReport}
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Download Report
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            disabled={isResetting || isClearing || isSeeding}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
          >
            {isResetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            {isResetting ? 'Resetting...' : 'Start New Academic Year'}
          </button>
          <button
            onClick={handleFixLegacyData}
            disabled={isFixing || isSeeding || isClearing}
            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-50"
          >
            {isFixing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isFixing ? 'Fixing...' : 'Fix Legacy Data'}
          </button>
          <button
            onClick={() => setShowClearModal(true)}
            disabled={isClearing || isSeeding}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
          >
            {isClearing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
            {isClearing ? 'Clearing...' : 'Clear All Data'}
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isSeeding || isClearing}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            {isSeeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isSeeding ? 'Seeding...' : 'Seed Test Data'}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-red-50 text-red-800 ring-1 ring-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <p className="text-sm font-medium">{notification.message}</p>
          <button 
            onClick={() => setNotification({ ...notification, show: false })}
            className="ml-4 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Reset Academic Year Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Start New Academic Year</h3>
                <p className="mt-2 text-sm text-slate-500">
                  This action will <span className="font-bold text-emerald-600">unassign all currently assigned students</span> from their beds and record their stay in the accommodation history. 
                  <br /><br />
                  A summary report will be generated and downloaded automatically. This is typically done at the end of an academic year.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAcademicYear}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Yes, Start New Year
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Clear All Data</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Are you sure you want to clear all data? This action will <span className="font-bold text-red-600">permanently delete</span> all students, hostels, rooms, complaints, and fees. Only the Super Admin account will be retained. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Yes, Clear Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Seed Test Data</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Are you sure you want to seed test data? This action will <span className="font-bold text-red-600">permanently delete</span> all existing data in the database and replace it with dummy data. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSeedTestData}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Yes, Seed Data
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Information */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="flex items-center text-lg font-semibold text-slate-900">
              <Server className="mr-2 h-5 w-5 text-indigo-500" />
              System Information
            </h2>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500 flex items-center">
                  <Home className="mr-2 h-4 w-4" /> Total Hostels
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{systemInfo?.totalHostels || 0}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500 flex items-center">
                  <Users className="mr-2 h-4 w-4" /> Total Users
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{systemInfo?.totalUsers || 0}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500 flex items-center">
                  <DoorOpen className="mr-2 h-4 w-4" /> Total Rooms
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{systemInfo?.totalRooms || 0}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-slate-500 flex items-center">
                  <Activity className="mr-2 h-4 w-4" /> System Version
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900">{systemInfo?.systemVersion || '1.0.0'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="flex items-center text-lg font-semibold text-slate-900">
              <Shield className="mr-2 h-5 w-5 text-indigo-500" />
              Maintenance Mode
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-500 mb-6">
              Enable maintenance mode to prevent users from accessing the system. Super Admins will still be able to log in.
            </p>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="text-sm font-medium text-slate-900">System Maintenance</h3>
                <p className="text-sm text-slate-500">Currently {maintenanceMode ? 'enabled' : 'disabled'}</p>
              </div>
              <button
                onClick={toggleMaintenanceMode}
                className={`flex items-center justify-center rounded-full p-1 transition-colors ${
                  maintenanceMode ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-500'
                }`}
              >
                {maintenanceMode ? (
                  <ToggleRight className="h-10 w-10" />
                ) : (
                  <ToggleLeft className="h-10 w-10" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role Permissions Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Role Permissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Access Level
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {rolePermissions.map((role) => (
                <tr key={role.role} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                      {role.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {role.access}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
