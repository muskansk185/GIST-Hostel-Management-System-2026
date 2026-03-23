import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

interface DashboardLayoutProps {
  navItems: any[];
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ navItems }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar items={navItems} isCollapsed={isSidebarCollapsed} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
