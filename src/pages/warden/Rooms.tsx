import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { Building, AlertCircle, Users, Wrench } from 'lucide-react';

const Rooms: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hierarchy, setHierarchy] = useState<any[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const res = await api.get('/hostels/hierarchy');
        setHierarchy(res.data);
      } catch (err: any) {
        console.error('Failed to fetch rooms', err);
        setError('Failed to load room data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Room Management</h1>
        <p className="mt-1 text-sm text-slate-500">View room occupancy and maintenance status.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
            Loading rooms...
          </div>
        </div>
      ) : hierarchy.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
          <Building className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <p>No rooms found in the system.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {hierarchy.map((block) => (
            <div key={`${block.blockId}-${block.floor}`} className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                    <Building className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {block.block} - Floor {block.floor}
                  </h2>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                  {block.rooms.length} Rooms
                </span>
              </div>
              
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {block.rooms.map((room: any) => (
                  <div key={room.roomId} className="rounded-lg border border-slate-200 p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-slate-900">Room {room.roomNumber}</h3>
                      {room.status === 'AVAILABLE' && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          Available
                        </span>
                      )}
                      {room.status === 'FULL' && (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                          Full
                        </span>
                      )}
                      {room.status === 'PARTIAL' && (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          Partial
                        </span>
                      )}
                      {room.status === 'MAINTENANCE' && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/20">
                          Maintenance
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-1"><Users className="h-4 w-4" /> Capacity</span>
                        <span className="font-medium text-slate-900">{room.capacity}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Occupied</span>
                        <span className="font-medium text-slate-900">{room.occupiedBeds}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Available</span>
                        <span className="font-medium text-emerald-600">{room.availableBeds}</span>
                      </div>
                    </div>

                    {room.beds && room.beds.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Beds</p>
                        <div className="space-y-2">
                          {room.beds.map((bed: any) => (
                            <div key={bed._id} className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">Bed {bed.bedNumber}</span>
                              {bed.status === 'OCCUPIED' ? (
                                <span className="text-slate-900 truncate max-w-[100px]" title={bed.studentName}>
                                  {bed.studentName || 'Occupied'}
                                </span>
                              ) : bed.status === 'MAINTENANCE' ? (
                                <span className="text-amber-600 flex items-center gap-1">
                                  <Wrench className="h-3 w-3" /> Maintenance
                                </span>
                              ) : (
                                <span className="text-emerald-600">Available</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Rooms;
