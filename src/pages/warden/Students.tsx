import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { Users, Search, AlertCircle, Building, MapPin, Phone, Mail, Eye } from 'lucide-react';
import StudentDetailModal from '../../components/StudentDetailModal';

const WardenStudents: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (selectedYear !== 'all') params.year = selectedYear;
        if (selectedBranch !== 'all') params.department = selectedBranch;
        
        const res = await api.get('/students', { params });
        setStudents(res.data);
      } catch (err: any) {
        console.error('Failed to fetch students', err);
        setError('Failed to load students. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedYear, selectedBranch]);

  const filteredStudents = students.filter(student => 
    (student.personalDetails?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.personalDetails?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.personalDetails?.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.personalDetails?.department && student.personalDetails.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-600 ring-1 ring-red-200 flex items-start gap-3">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="mt-1 text-sm text-slate-500">View and manage all hostel students.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="block rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="block rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          >
            <option value="all">All Branches</option>
            <option value="all">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
            <option value="IT">IT</option>
          </select>

          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">All Students</h2>
          </div>
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
            {filteredStudents.length} Students
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Accommodation
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                      Loading students...
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>No students found matching your search.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                          {student.profilePicture ? (
                            <img src={student.profilePicture} alt={`${student.personalDetails?.firstName} ${student.personalDetails?.lastName}`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            `${student.personalDetails?.firstName?.charAt(0)}${student.personalDetails?.lastName?.charAt(0)}`
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {student.personalDetails?.firstName} {student.personalDetails?.lastName}
                          </div>
                          <div className="text-xs text-slate-500">{student.personalDetails?.rollNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {student.personalDetails?.phone}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {student.personalDetails?.email || student.userId?.email || 'No email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{student.personalDetails?.department}</div>
                      <div className="text-xs text-slate-500">Year {student.personalDetails?.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.hostelId ? (
                        <div>
                          <div className="text-sm text-slate-900 flex items-center gap-1">
                            <Building className="h-3 w-3 text-slate-400" />
                            {student.hostelId?.name || 'Unknown Hostel'}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            Room {student.roomId?.roomNumber || 'N/A'}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                          Not Assigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedStudentId(student._id)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 ml-auto"
                      >
                        <Eye className="h-4 w-4" />
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudentId && (
        <StudentDetailModal 
          studentId={selectedStudentId} 
          onClose={() => setSelectedStudentId(null)} 
        />
      )}
    </div>
  );
};

export default WardenStudents;
