import React from 'react';
import { Settings, Home, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';

interface MaintenanceOverlayProps {
  message: string;
}

const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({ message }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-orange-100 p-4">
            <Settings className="h-12 w-12 animate-spin-slow text-orange-600" />
          </div>
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900">System Under Maintenance</h1>
        <p className="mb-8 text-lg text-gray-600">
          {message || "We're currently performing some scheduled maintenance. Please check back soon."}
        </p>
        
        <div className="flex flex-col gap-3 mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </button>
          
          {user?.role === UserRole.SUPER_ADMIN && (
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </button>
          )}
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-1/2 animate-progress bg-orange-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceOverlay;
