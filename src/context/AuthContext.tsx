import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import api from '../api/axios';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  WARDEN = 'WARDEN',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  HOD = 'HOD'
}

interface User {
  _id: string;
  email: string;
  role: UserRole;
  name?: string;
  studentIds?: string[];
  department?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  checkMaintenance: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  const checkMaintenance = async () => {
    try {
      const response = await api.get('/settings');
      setMaintenanceMode(response.data.maintenanceMode);
      setMaintenanceMessage(response.data.message);
    } catch (error) {
      console.error('Failed to fetch maintenance status', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkMaintenance();
      if (token) {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser && storedUser !== 'undefined') {
            setUser(JSON.parse(storedUser));
          }
        } catch (error) {
          console.error('Failed to authenticate token', error);
          logout();
        }
      }
      setLoading(false);
    };

    init();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isAuthenticated: !!token, 
      loading,
      maintenanceMode,
      maintenanceMessage,
      checkMaintenance
    }}>
      {children}
    </AuthContext.Provider>
  );
};
