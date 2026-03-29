import React, { useState, useEffect, useMemo } from 'react';
import { Building, Layers, DoorOpen, BedDouble, User, CheckCircle2, Info, X } from 'lucide-react';
import api from '../api/axios';

interface Bed {
  _id: string;
  bedNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  studentId?: string;
  studentName?: string;
}

interface Room {
  roomId: string;
  roomNumber: string;
  capacity: number;
  occupiedBeds: number;
  availableBeds: number;
  status: 'AVAILABLE' | 'PARTIAL' | 'FULL' | 'MAINTENANCE';
  beds: Bed[];
}

interface HierarchyItem {
  blockId: string;
  block: string;
  floor: number;
  rooms: Room[];
}

interface FloorPlanProps {
  data?: HierarchyItem[];
}

const FloorPlan: React.FC<FloorPlanProps> = ({ data }) => {
  const [hierarchy, setHierarchy] = useState<HierarchyItem[]>(data || []);
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState('');
  
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (data) {
      setHierarchy(data);
      if (data.length > 0 && !selectedBlock) {
        setSelectedBlock(data[0].block);
      }
    } else {
      fetchHierarchy();
    }
  }, [data]);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hostels/hierarchy');
      setHierarchy(res.data);
      if (res.data.length > 0) {
        setSelectedBlock(res.data[0].block);
      }
    } catch (err: any) {
      console.error('Error fetching hierarchy:', err);
      setError('Failed to load floor plan data.');
    } finally {
      setLoading(false);
    }
  };

  const blocks = useMemo(() => {
    const uniqueBlocksMap = new Map<string, { id: string, name: string }>();
    hierarchy.forEach(item => {
      if (!uniqueBlocksMap.has(item.block)) {
        uniqueBlocksMap.set(item.block, { id: item.blockId, name: item.block });
      }
    });
    return Array.from(uniqueBlocksMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [hierarchy]);

  const floorsForSelectedBlock = useMemo(() => {
    if (!selectedBlock) return [];
    return hierarchy.filter(item => item.block === selectedBlock).sort((a, b) => a.floor - b.floor);
  }, [hierarchy, selectedBlock]);

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200';
      case 'PARTIAL': return 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200';
      case 'FULL': return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200';
      case 'MAINTENANCE': return 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getBedStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 border-emerald-300 text-emerald-800';
      case 'OCCUPIED': return 'bg-red-100 border-red-300 text-red-800';
      case 'MAINTENANCE': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-500">Loading floor plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Block Selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Array.isArray(blocks) ? blocks : []).map((block) => (
          <button
            key={block.id || block.name}
            onClick={() => {
              setSelectedBlock(block.name);
              setSelectedRoom(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedBlock === block.name
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building className="w-4 h-4 inline-block mr-2" />
            {block.name}
          </button>
        ))}
      </div>

      {/* Floor Plan Grid */}
      <div className="flex-1 overflow-y-auto space-y-8 pb-8">
        {(!Array.isArray(floorsForSelectedBlock) || floorsForSelectedBlock.length === 0) ? (
          <div className="text-center text-slate-500 py-12 bg-white rounded-xl border border-slate-200">
            No floors found for this block.
          </div>
        ) : (
          floorsForSelectedBlock.map((floorData, index) => (
            <div key={`${floorData.blockId}-${floorData.floor}-${index}`} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-indigo-600" />
                  Floor {floorData.floor}
                </h3>
              </div>
              <div className="p-6">
                {(!Array.isArray(floorData.rooms) || floorData.rooms.length === 0) ? (
                  <p className="text-sm text-slate-500 italic">No rooms on this floor.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(Array.isArray(floorData.rooms) ? [...floorData.rooms] : []).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })).map((room, roomIndex) => (
                      <button
                        key={`${room.roomId || room.roomNumber}-${roomIndex}`}
                        onClick={() => setSelectedRoom(room)}
                        className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${getRoomStatusColor(room.status)}`}
                      >
                        <DoorOpen className="w-8 h-8 mb-2 opacity-80" />
                        <span className="font-bold text-lg mb-1">{room.roomNumber}</span>
                        <span className="text-xs font-medium opacity-90 bg-white/50 px-2 py-1 rounded-md">
                          {room.occupiedBeds} / {room.capacity} Occupied
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Room Details Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  <DoorOpen className="w-6 h-6 mr-2 text-indigo-600" />
                  Room {selectedRoom.roomNumber}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedBlock} • {selectedRoom.occupiedBeds} of {selectedRoom.capacity} beds occupied
                </p>
              </div>
              <button 
                onClick={() => setSelectedRoom(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(!Array.isArray(selectedRoom.beds) || selectedRoom.beds.length === 0) ? (
                  <div className="col-span-full text-center text-slate-500 py-8">
                    No beds configured for this room.
                  </div>
                ) : (
                  (Array.isArray(selectedRoom.beds) ? [...selectedRoom.beds] : []).sort((a, b) => a.bedNumber.localeCompare(b.bedNumber, undefined, { numeric: true })).map((bed, bedIndex) => (
                    <div 
                      key={`${bed._id || bed.bedNumber}-${bedIndex}`} 
                      className={`relative p-4 rounded-xl border-2 flex items-center gap-4 ${getBedStatusColor(bed.status)}`}
                    >
                      <div className="bg-white/50 p-3 rounded-lg">
                        <BedDouble className="w-6 h-6 opacity-80" />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-sm block mb-1">Bed {bed.bedNumber}</span>
                        
                        {bed.status === 'OCCUPIED' ? (
                          <div className="flex items-center text-xs font-medium">
                            <User className="w-3.5 h-3.5 mr-1.5" />
                            <span className="truncate">{bed.studentName || 'Occupied'}</span>
                          </div>
                        ) : bed.status === 'AVAILABLE' ? (
                          <span className="text-xs font-medium opacity-80 flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Available
                          </span>
                        ) : (
                          <span className="text-xs font-medium opacity-80 flex items-center">
                            <Info className="w-3.5 h-3.5 mr-1.5" /> Maintenance
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlan;
