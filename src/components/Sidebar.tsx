import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Building2, ChevronDown, ChevronRight } from 'lucide-react';

export interface SidebarItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ items, isCollapsed }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const isItemActive = (item: SidebarItem) => {
    if (item.path && location.pathname === item.path) return true;
    if (item.children) {
      return item.children.some(child => child.path && location.pathname === child.path);
    }
    return false;
  };

  return (
    <div className={`flex h-screen flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex h-16 items-center justify-center border-b border-slate-800 px-4">
        <Building2 className="h-8 w-8 text-indigo-500 flex-shrink-0" />
        {!isCollapsed && <span className="ml-3 text-xl font-bold tracking-tight truncate">HostelMS</span>}
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-3">
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = isItemActive(item);
            const isOpen = openDropdowns[item.label];

            if (item.children) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleDropdown(item.label)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`}>{item.icon}</div>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                  </button>
                  
                  {!isCollapsed && isOpen && (
                    <div className="pl-10 space-y-1">
                      {item.children.map(child => (
                        <NavLink
                          key={child.path}
                          to={child.path!}
                          className={({ isActive }) =>
                            `group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                              isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`
                          }
                        >
                          <span className="truncate">{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path!}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
              >
                <div className={`flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`}>{item.icon}</div>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-3">
        <button
          onClick={logout}
          title={isCollapsed ? 'Logout' : undefined}
          className={`group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut className={`flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
