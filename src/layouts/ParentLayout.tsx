import React from 'react';
import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Calendar, CreditCard, User, History } from 'lucide-react';

const ParentLayout: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/parent/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Student Overview', path: '/parent/student', icon: <User size={20} /> },
    { label: 'Leave Approvals', path: '/parent/leaves', icon: <Calendar size={20} /> },
    { label: 'Fee Status', path: '/parent/fees', icon: <CreditCard size={20} /> },
    { 
      label: 'History', 
      icon: <Calendar size={20} />,
      children: [
        { label: 'Leave History', path: '/parent/leave-history', icon: <Calendar size={16} /> },
        { label: 'Payment History', path: '/parent/payment-history', icon: <CreditCard size={16} /> },
      ]
    },
  ];

  return <DashboardLayout navItems={navItems} />;
};

export default ParentLayout;
