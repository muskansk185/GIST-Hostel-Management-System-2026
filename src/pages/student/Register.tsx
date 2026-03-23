import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, User, Phone, BookOpen, Calendar, Users } from 'lucide-react';
import api from '../../api/axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    rollNumber: '',
    email: '',
    phone: '',
    department: '',
    year: '',
    gender: 'Male',
    password: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
    permanentAddress: '',
    currentAddress: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/students/register', formData);
      navigate('/login', { state: { message: 'Registration successful. Please login.' } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')" }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl bg-white/95 backdrop-blur-sm p-8 rounded-xl shadow-2xl mt-8 mb-8">
        <div className="flex flex-col items-center justify-center">
          <img 
            src="https://gist.edu.in/gist/wp-content/uploads/2016/05/GISTLogo_Final.jpg" 
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
          Student Registration
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>

        <div className="mt-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-10 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Roll Number</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="rollNumber"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    className="block w-full pl-10 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
                    placeholder="CS2023001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Email address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Phone Number</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-10 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Department</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    className="block w-full pl-10 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border bg-white"
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science and Engineering (CSE)</option>
                    <option value="ISE">Information Science and Engineering (ISE)</option>
                    <option value="ECE">Electronics and Communication Engineering (ECE)</option>
                    <option value="EEE">Electrical and Electronics Engineering (EEE)</option>
                    <option value="MECH">Mechanical Engineering (MECH)</option>
                    <option value="CIVIL">Civil Engineering (CIVIL)</option>
                    <option value="AIML">Artificial Intelligence and Machine Learning (AIML)</option>
                    <option value="AIDS">Artificial Intelligence and Data Science (AIDS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Year</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleChange}
                    className="block w-full pl-10 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border bg-white"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Gender</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full pl-10 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Parent Details</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                <input type="text" name="parentName" required value={formData.parentName} onChange={handleChange} className="block w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" placeholder="Parent Name" />
                <input type="tel" name="parentPhone" required value={formData.parentPhone} onChange={handleChange} className="block w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" placeholder="Parent Phone" />
                <input type="email" name="parentEmail" required value={formData.parentEmail} onChange={handleChange} className="block w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" placeholder="Parent Email" />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Guardian Details</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                <input type="text" name="guardianName" required value={formData.guardianName} onChange={handleChange} className="block w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" placeholder="Guardian Name" />
                <input type="tel" name="guardianPhone" required value={formData.guardianPhone} onChange={handleChange} className="block w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" placeholder="Guardian Phone" />
                <input type="text" name="guardianRelation" required value={formData.guardianRelation} onChange={handleChange} className="block w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" placeholder="Guardian Relation" />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Address Details</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <input type="text" name="permanentAddress" required value={formData.permanentAddress} onChange={handleChange} className="block w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" placeholder="Permanent Address" />
                <input type="text" name="currentAddress" required value={formData.currentAddress} onChange={handleChange} className="block w-full rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border" placeholder="Current Address" />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
