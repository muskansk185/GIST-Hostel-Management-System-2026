import React from 'react';
import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Calendar, Users, BarChart3, History, CreditCard } from 'lucide-react';

const HodLayout: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/hod/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Department Students', path: '/hod/students', icon: <Users size={20} /> },
    { label: 'Leave Approvals', path: '/hod/leaves', icon: <Calendar size={20} /> },
    { label: 'Analytics', path: '/hod/analytics', icon: <BarChart3 size={20} /> },
    { 
      label: 'History', 
      icon: <Calendar size={20} />,
      children: [
        { label: 'Leave History', path: '/hod/leave-history', icon: <Calendar size={16} /> },
        { label: 'Payment History', path: '/hod/payment-history', icon: <CreditCard size={16} /> },
      ]
    },
  ];

  return <DashboardLayout navItems={navItems} />;
};

export default HodLayout;
