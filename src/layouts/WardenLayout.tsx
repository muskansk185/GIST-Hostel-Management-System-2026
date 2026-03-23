import React from 'react';
import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Users, Home, Calendar, MessageSquare, BarChart, History, CreditCard } from 'lucide-react';

const WardenLayout: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/warden/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Analytics', path: '/warden/analytics', icon: <BarChart size={20} /> },
    { label: 'Students', path: '/warden/students', icon: <Users size={20} /> },
    { label: 'Rooms', path: '/warden/rooms', icon: <Home size={20} /> },
    { label: 'Leaves', path: '/warden/leaves', icon: <Calendar size={20} /> },
    { label: 'Complaints', path: '/warden/complaints', icon: <MessageSquare size={20} /> },
    { 
      label: 'History', 
      icon: <Calendar size={20} />,
      children: [
        { label: 'Leave History', path: '/warden/leave-history', icon: <Calendar size={16} /> },
        { label: 'Payment History', path: '/warden/payment-history', icon: <CreditCard size={16} /> },
      ]
    },
  ];

  return <DashboardLayout navItems={navItems} />;
};

export default WardenLayout;
