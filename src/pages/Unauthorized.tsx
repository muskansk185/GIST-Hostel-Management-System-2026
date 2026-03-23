import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-slate-900">403 - Unauthorized</h1>
      <p className="mt-4 text-lg text-slate-600">You do not have permission to access this page.</p>
      <Link to="/" className="mt-8 text-indigo-600 hover:text-indigo-500 font-medium">
        Go back home
      </Link>
    </div>
  );
};

export default Unauthorized;
