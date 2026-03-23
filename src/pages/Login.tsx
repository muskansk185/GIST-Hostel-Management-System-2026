import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

const demoAccounts = [
  { role: 'Super Admin', email: 'admin@hostelms.com', password: 'password123' },
  { role: 'Warden', email: 'warden1@hostelms.com', password: 'password123' },
  { role: 'Student', email: 's1@hostelms.com', password: 'password123' },
  { role: 'Parent', email: 'parent1@hostelms.com', password: 'password123' },
  { role: 'HOD', email: 'hod1@hostelms.com', password: 'password123' },
];

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user);
      
      // Redirect based on role
      switch (user.role) {
        case 'SUPER_ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'WARDEN':
          navigate('/warden/dashboard');
          break;
        case 'STUDENT':
          navigate('/student/dashboard');
          break;
        case 'PARENT':
          navigate('/parent/dashboard');
          break;
        case 'HOD':
          navigate('/hod/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div 
      className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 bg-cover bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')" }}
    >
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white/95 backdrop-blur-sm p-10 shadow-2xl">
        <div>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
          >
            ← Back to Home
          </button>
          <div className="flex flex-col items-center justify-center">
            <img 
              src="/docs/gist_logo.jpg" 
              alt="Geethanjali Institute of Science and Technology Logo" 
              className="h-24 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/200x200/ea580c/ffffff?text=Logo";
              }}
            />
            <h1 className="mt-4 text-center text-xl font-bold text-slate-900">
              Geethanjali Institute of Science and Technology
            </h1>
          </div>
          <h2 className="mt-6 text-center text-2xl font-semibold tracking-tight text-slate-700">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-sm text-red-500 text-center">{error}</div>}
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-t-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-b-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 w-full max-w-2xl rounded-xl bg-white p-6 shadow-md border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 text-center">Demo Accounts</h3>
        <p className="text-sm text-slate-500 text-center mb-4">Click any card to fill the login form</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demoAccounts.map((account) => (
            <div 
              key={account.role} 
              className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer transition-colors"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
              }}
            >
              <div className="font-medium text-slate-900">{account.role}</div>
              <div className="mt-1 text-slate-600 select-all">{account.email}</div>
              <div className="text-slate-500 select-all">{account.password}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
