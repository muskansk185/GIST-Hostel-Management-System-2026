import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { Home, MapPin, Layers, DoorOpen, BedDouble, Users, AlertCircle } from 'lucide-react';

const MyRoom: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accommodation, setAccommodation] = useState<any>(null);
  const [roommates, setRoommates] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch accommodation details
        const accRes = await api.get('/accommodation/me');
        const accData = accRes.data;
        setAccommodation(accData);

        // Fetch roommates if room is assigned
        if (accData?.roomId?._id) {
          const roommatesRes = await api.get(`/accommodation/room/${accData.roomId._id}`);
          // Filter out the current student
          const otherOccupants = roommatesRes.data.filter(
            (occupant: any) => {
              const occId = occupant.studentId?._id || occupant.studentId;
              const myId = accData.studentId?._id || accData.studentId;
              return occId?.toString() !== myId?.toString();
            }
          );
          setRoommates(otherOccupants);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setAccommodation(null);
        } else {
          setError('Failed to load room details. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRoomDetails();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          Loading room details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-600 ring-1 ring-red-200 flex items-start gap-3">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  if (!accommodation) {
    return (
      <div className="rounded-xl bg-amber-50 p-6 text-amber-700 ring-1 ring-amber-200 flex items-start gap-3">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <p>You have not been assigned a room yet. Please contact your warden or administrator.</p>
      </div>
    );
  }

  const room = accommodation.roomId;
  const floor = room?.floorId;
  const block = floor?.blockId;
  const hostel = block?.hostelId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Room</h1>
        <p className="mt-1 text-sm text-slate-500">View your current accommodation details and roommates.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Room Details Card */}
        <div className="lg:col-span-2 rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <Home className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Accommodation Details</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Hostel</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{hostel?.name || 'N/A'}</p>
                  <p className="text-sm text-slate-500">{hostel?.type} Hostel</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Building2Icon className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Block</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{block?.name || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Layers className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Floor</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">Floor {floor?.floorNumber !== undefined ? floor.floorNumber : 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <DoorOpen className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Room</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{room?.roomNumber || 'N/A'}</p>
                  <p className="text-sm text-slate-500">{room?.type} Room</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <BedDouble className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-500">Bed Number</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{accommodation.bedNumber || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-medium text-slate-500 mb-3">Room View</h3>
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video relative">
                <img 
                  src="/images/room.jpg" 
                  alt="Room View" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Roommates Card */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Roommates</h2>
          </div>
          
          <div className="p-6">
            {roommates.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p>You currently don't have any roommates.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {roommates.map((occupant) => (
                  <li key={occupant._id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {occupant.student?.personalDetails?.firstName?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {occupant.student?.personalDetails?.firstName} {occupant.student?.personalDetails?.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Bed {occupant.bedNumber} • {occupant.student?.personalDetails?.department || 'Department N/A'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component since Building2 is not imported from lucide-react in the main import
const Building2Icon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

export default MyRoom;
