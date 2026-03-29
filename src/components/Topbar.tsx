import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, User, ArrowLeft, LogOut, Key } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import ChangePasswordModal from './ChangePasswordModal';
import api from '../api/axios';
import { UserAvatar } from './UserAvatar';

interface TopbarProps {
  toggleSidebar: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      if (user) {
        const res = await api.get('/alerts');
        // If response body is { data: [...] }, use res.data.data
        // Otherwise fallback to res.data
        const alertsData = res.data?.data || res.data;
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts', error);
      setAlerts([]);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll for new alerts every minute
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setIsAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/alerts/${id}/read`);
      setAlerts(safeAlerts.map(a => a._id === id ? { ...a, isRead: true } : a));
    } catch (error) {
      console.error('Failed to mark alert as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/alerts/read-all');
      setAlerts(safeAlerts.map(a => ({ ...a, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all alerts as read', error);
    }
  };

  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const unreadCount = safeAlerts.filter(a => !a.isRead).length;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <Link
          to="/"
          className="hidden sm:flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <div className="hidden md:flex items-center rounded-md bg-slate-100 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="ml-2 bg-transparent text-sm outline-none placeholder:text-slate-400 w-64"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={alertsRef}>
          <button 
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="relative rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none"
          >
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
            <Bell className="h-6 w-6" />
          </button>
          
          {isAlertsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {safeAlerts.length > 0 ? (
                  safeAlerts.map(alert => (
                    <div 
                      key={alert._id} 
                      className={`px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer ${!alert.isRead ? 'bg-slate-50/50' : ''}`}
                      onClick={() => !alert.isRead && handleMarkAsRead(alert._id)}
                    >
                      <div className="flex justify-between items-start">
                        <p className={`text-sm ${!alert.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {alert.title}
                        </p>
                        {!alert.isRead && (
                          <span className="h-2 w-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0"></span>
                        )}
                      </div>
                      <p className={`text-sm mt-0.5 ${!alert.isRead ? 'text-slate-600' : 'text-slate-500'}`}>
                        {alert.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{formatTimeAgo(alert.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-slate-500">
                    No new notifications
                  </div>
                )}
              </div>
              {unreadCount > 0 && (
                <div className="px-4 py-2 border-t border-slate-100 text-center">
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relative flex items-center gap-3 border-l border-slate-200 pl-4" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 focus:outline-none"
          >
            <UserAvatar imageUrl={user?.profilePicture} name={user?.name || 'User'} className="h-8 w-8" />
            <div className="hidden md:block text-left text-sm">
              <p className="font-medium text-slate-700">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500">
                {user?.role === 'HOD' && user?.department ? `${user.department} HOD` : user?.role}
              </p>
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsPasswordModalOpen(true);
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                <Key className="mr-3 h-4 w-4 text-slate-400" />
                Change Password
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                <LogOut className="mr-3 h-4 w-4 text-slate-400" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </header>
  );
};

export default Topbar;
