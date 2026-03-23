import React from 'react';
import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Home, Calendar, CreditCard, MessageSquare, User, History } from 'lucide-react';

const StudentLayout: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'My Profile', path: '/student/profile', icon: <User size={20} /> },
    { label: 'My Room', path: '/student/room', icon: <Home size={20} /> },
    { label: 'Leaves', path: '/student/leaves', icon: <Calendar size={20} /> },
    { label: 'Fees', path: '/student/fees', icon: <CreditCard size={20} /> },
    { label: 'Complaints', path: '/student/complaints', icon: <MessageSquare size={20} /> },
    { 
      label: 'History', 
      icon: <Calendar size={20} />,
      children: [
        { label: 'Leave History', path: '/student/leave-history', icon: <Calendar size={16} /> },
        { label: 'Payment History', path: '/student/payment-history', icon: <CreditCard size={16} /> },
      ]
    },
  ];

  return <DashboardLayout navItems={navItems} />;
};

export default StudentLayout;
