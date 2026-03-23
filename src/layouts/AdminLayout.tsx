import React from 'react';
import DashboardLayout from './DashboardLayout';
import { LayoutDashboard, Users, Home, BarChart, Building, Layers, DoorOpen, BedDouble, Map, Settings, DollarSign, History, Calendar, CreditCard } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <BarChart size={20} /> },
    { label: 'Fee Management', path: '/admin/fees', icon: <DollarSign size={20} /> },
    { label: 'Hostel Explorer', path: '/admin/hostel-explorer', icon: <Map size={20} /> },
    {
      label: 'System Setup',
      icon: <Settings size={20} />,
      children: [
        { label: 'Hostels', path: '/admin/hostels', icon: <Home size={16} /> },
        { label: 'Blocks', path: '/admin/blocks', icon: <Building size={16} /> },
        { label: 'Floors', path: '/admin/floors', icon: <Layers size={16} /> },
        { label: 'Rooms', path: '/admin/rooms', icon: <DoorOpen size={16} /> },
        { label: 'Beds', path: '/admin/beds', icon: <BedDouble size={16} /> },
      ]
    },
    { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { label: 'System Settings', path: '/admin/settings', icon: <Settings size={20} /> },
    { 
      label: 'History', 
      icon: <Calendar size={20} />,
      children: [
        { label: 'Leave History', path: '/admin/leave-history', icon: <Calendar size={16} /> },
        { label: 'Payment History', path: '/admin/payment-history', icon: <CreditCard size={16} /> },
      ]
    },
  ];

  return <DashboardLayout navItems={navItems} />;
};

export default AdminLayout;
