/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, UserRole } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MaintenanceOverlay from './components/MaintenanceOverlay';
import { useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import WardenLayout from './layouts/WardenLayout';
import StudentLayout from './layouts/StudentLayout';
import ParentLayout from './layouts/ParentLayout';
import HodLayout from './layouts/HodLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/student/Register';
import Unauthorized from './pages/Unauthorized';
import AdminDashboard from './pages/admin/AdminDashboard';
import Analytics from './pages/admin/Analytics';
import Hostels from './pages/admin/Hostels';
import Blocks from './pages/admin/Blocks';
import Floors from './pages/admin/Floors';
import Rooms from './pages/admin/Rooms';
import Beds from './pages/admin/Beds';
import HostelExplorer from './pages/admin/HostelExplorer';
import Users from './pages/admin/Users';
import SystemSettings from './pages/admin/SystemSettings';
import FeeManagement from './pages/admin/FeeManagement';
import WardenDashboard from './pages/warden/WardenDashboard';
import WardenAnalytics from './pages/warden/HostelAnalytics';
import WardenRooms from './pages/warden/Rooms';
import WardenLeaves from './pages/warden/LeaveApprovals';
import WardenComplaints from './pages/warden/Complaints';
import WardenStudents from './pages/warden/Students';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import MyRoom from './pages/student/MyRoom';
import StudentFees from './pages/student/StudentFees';
import StudentLeaves from './pages/student/StudentLeaves';
import StudentComplaints from './pages/student/StudentComplaints';
import LeaveHistory from './pages/LeaveHistory';
import PaymentHistory from './pages/PaymentHistory';
import ParentDashboard from './pages/parent/ParentDashboard';
import LeaveApprovals from './pages/parent/LeaveApprovals';
import FeeStatus from './pages/parent/FeeStatus';
import StudentOverview from './pages/parent/StudentOverview';
import HodDashboard from './pages/hod/HodDashboard';
import DepartmentStudents from './pages/hod/DepartmentStudents';
import HodLeaveApprovals from './pages/hod/LeaveApprovals';
import DepartmentAnalytics from './pages/hod/DepartmentAnalytics';

const AppRoutes = () => {
  const { maintenanceMode, maintenanceMessage, user, loading } = useAuth();
  const location = useLocation();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isLoginPage = location.pathname === '/login';
  const isHomePage = location.pathname === '/';

  return (
    <>
      {maintenanceMode && !isSuperAdmin && !isLoginPage && !isHomePage && !loading && (
        <MaintenanceOverlay message={maintenanceMessage} />
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="hostel-explorer" element={<HostelExplorer />} />
            <Route path="hostels" element={<Hostels />} />
            <Route path="blocks" element={<Blocks />} />
            <Route path="floors" element={<Floors />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="beds" element={<Beds />} />
            <Route path="users" element={<Users />} />
            <Route path="fees" element={<FeeManagement />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="leave-history" element={<LeaveHistory />} />
            <Route path="payment-history" element={<PaymentHistory />} />
          </Route>
        </Route>

        {/* Warden Routes */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.WARDEN]} />}>
          <Route path="/warden" element={<WardenLayout />}>
            <Route path="dashboard" element={<WardenDashboard />} />
            <Route path="analytics" element={<WardenAnalytics />} />
            <Route path="students" element={<WardenStudents />} />
            <Route path="rooms" element={<WardenRooms />} />
            <Route path="leaves" element={<WardenLeaves />} />
            <Route path="complaints" element={<WardenComplaints />} />
            <Route path="leave-history" element={<LeaveHistory />} />
            <Route path="payment-history" element={<PaymentHistory />} />
          </Route>
        </Route>

        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.STUDENT]} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="room" element={<MyRoom />} />
            <Route path="leaves" element={<StudentLeaves />} />
            <Route path="fees" element={<StudentFees />} />
            <Route path="complaints" element={<StudentComplaints />} />
            <Route path="leave-history" element={<LeaveHistory />} />
            <Route path="payment-history" element={<PaymentHistory />} />
          </Route>
        </Route>

        {/* Parent Routes */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.PARENT]} />}>
          <Route path="/parent" element={<ParentLayout />}>
            <Route path="dashboard" element={<ParentDashboard />} />
            <Route path="student" element={<StudentOverview />} />
            <Route path="leaves" element={<LeaveApprovals />} />
            <Route path="fees" element={<FeeStatus />} />
            <Route path="leave-history" element={<LeaveHistory />} />
            <Route path="payment-history" element={<PaymentHistory />} />
          </Route>
        </Route>

        {/* HOD Routes */}
        <Route element={<ProtectedRoute allowedRoles={[UserRole.HOD]} />}>
          <Route path="/hod" element={<HodLayout />}>
            <Route path="dashboard" element={<HodDashboard />} />
            <Route path="students" element={<DepartmentStudents />} />
            <Route path="leaves" element={<HodLeaveApprovals />} />
            <Route path="analytics" element={<DepartmentAnalytics />} />
            <Route path="leave-history" element={<LeaveHistory />} />
            <Route path="payment-history" element={<PaymentHistory />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
