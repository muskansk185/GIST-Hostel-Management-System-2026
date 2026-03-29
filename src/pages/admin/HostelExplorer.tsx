import React, { useState, useEffect, useMemo } from 'react';
import { Building, Layers, DoorOpen, BedDouble, User, AlertCircle, CheckCircle2, Info, Trash2, X, Grid, Map as MapIcon } from 'lucide-react';
import api from '../../api/axios';
import FloorPlan from '../../components/FloorPlan';

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

interface Student {
  _id: string;
  userId: string;
  personalDetails: {
    firstName: string;
    lastName: string;
    rollNumber: string;
    department: string;
  };
}
const HostelExplorer: React.FC = () => {
  const [hierarchy, setHierarchy] = useState<HierarchyItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'floorPlan'>('grid');

  // Modals state
  const [bedModal, setBedModal] = useState<{ isOpen: boolean; bed: Bed | null }>({ isOpen: false, bed: null });
  const [transferModal, setTransferModal] = useState<{ isOpen: boolean; bed: Bed | null }>({ isOpen: false, bed: null });
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedNewBedId, setSelectedNewBedId] = useState('');
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'block' | 'room' | 'bed'; id: string; name: string }>({
    isOpen: false,
    type: 'block',
    id: '',
    name: ''
  });

  useEffect(() => {
    fetchHierarchy();
    fetchStudents();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hostels/hierarchy');
      setHierarchy(res.data);
      
      if (res.data.length > 0 && !selectedBlock) {
        const firstBlock = res.data[0].block;
        setSelectedBlock(firstBlock);
      } else if (selectedRoom) {
        // Update selected room data if it exists
        const updatedBlock = res.data.find((item: HierarchyItem) => item.block === selectedBlock);
        if (updatedBlock) {
          const updatedRoom = updatedBlock.rooms.find((r: Room) => r.roomId === selectedRoom.roomId);
          if (updatedRoom) {
            setSelectedRoom(updatedRoom);
          } else {
            setSelectedRoom(null);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching hierarchy:', err);
      setError('Failed to load hostel data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students?unassigned=true');
      // Ensure no duplicates and no assigned students
      const uniqueStudents = Array.from(new Map(res.data.map((s: any) => [s._id, s])).values());
      const unassignedStudents = uniqueStudents.filter((s: any) => !s.roomId);
      setStudents(unassignedStudents as Student[]);
    } catch (err: any) {
      console.error('Error fetching students:', err);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const blocks = useMemo(() => {
    const uniqueBlocksMap = new Map<string, { id: string, name: string }>();
    hierarchy.forEach(item => {
      if (!uniqueBlocksMap.has(item.block)) {
        uniqueBlocksMap.set(item.block, { id: item.blockId, name: item.block });
      }
    });
    return Array.from(uniqueBlocksMap.values()).sort((a: { id: string, name: string }, b: { id: string, name: string }) => (a.name || '').localeCompare(b.name || ''));
  }, [hierarchy]);

  const floorsForSelectedBlock = useMemo(() => {
    if (!selectedBlock) return [];
    return hierarchy.filter(item => item.block === selectedBlock).sort((a, b) => a.floor - b.floor);
  }, [hierarchy, selectedBlock]);

  const availableBeds = useMemo(() => {
    const beds: { id: string, label: string }[] = [];
    hierarchy.forEach(block => {
      block.rooms.forEach(room => {
        room.beds.forEach(bed => {
          if (bed.status === 'AVAILABLE') {
            beds.push({
              id: bed._id,
              label: `${block.block} - Floor ${block.floor} - Room ${room.roomNumber} - Bed ${bed.bedNumber}`
            });
          }
        });
      });
    });
    return beds;
  }, [hierarchy]);

  const handleBlockClick = (block: string) => {
    setSelectedBlock(block);
    setSelectedRoom(null);
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
  };

  const handleBedClick = (bed: Bed) => {
    setBedModal({ isOpen: true, bed });
    setSelectedStudentId('');
  };

  const handleAssignBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedModal.bed || !selectedStudentId) return;

    try {
      const student = students.find(s => s._id === selectedStudentId);
      if (!student) throw new Error("Student not found");

      await api.post(`/accommodation/assign`, {
        studentId: student._id,
        bedId: bedModal.bed._id
      });
      showToast('Student assigned successfully', 'success');
      setBedModal({ isOpen: false, bed: null });
      fetchHierarchy();
      fetchStudents();
    } catch (err: any) {
      console.error('Error assigning bed:', err);
      showToast(err.response?.data?.message || 'Failed to assign bed', 'error');
    }
  };

  const handleVacateBed = async () => {
    if (!bedModal.bed || !bedModal.bed.studentId) {
      showToast('No student assigned to this bed', 'error');
      return;
    }

    try {
      await api.post(`/accommodation/vacate`, {
        studentId: bedModal.bed.studentId
      });
      showToast('Bed vacated successfully', 'success');
      setBedModal({ isOpen: false, bed: null });
      fetchHierarchy();
      fetchStudents();
    } catch (err: any) {
      console.error('Error vacating bed:', err);
      showToast(err.response?.data?.message || 'Failed to vacate bed', 'error');
    }
  };

  const handleTransferStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModal.bed || !transferModal.bed.studentId || !selectedNewBedId) return;

    try {
      await api.post(`/accommodation/transfer`, {
        studentId: transferModal.bed.studentId,
        newBedId: selectedNewBedId
      });
      showToast('Student transferred successfully', 'success');
      setTransferModal({ isOpen: false, bed: null });
      setSelectedNewBedId('');
      fetchHierarchy();
      fetchStudents();
    } catch (err: any) {
      console.error('Error transferring student:', err);
      showToast(err.response?.data?.message || 'Failed to transfer student', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      const { type, id } = deleteModal;
      let url = '';
      if (type === 'block') url = `/hostels/blocks/${id}`;
      if (type === 'room') url = `/hostels/rooms/${id}`;
      if (type === 'bed') url = `/hostels/beds/${id}`;

      await api.delete(url);
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`, 'success');
      
      if (type === 'block' && selectedBlock === deleteModal.name) {
        setSelectedBlock(null);
        setSelectedRoom(null);
      }
      if (type === 'room' && selectedRoom?.roomId === id) {
        setSelectedRoom(null);
      }
      
      setDeleteModal({ isOpen: false, type: 'block', id: '', name: '' });
      fetchHierarchy();
    } catch (err: any) {
      console.error(`Error deleting ${deleteModal.type}:`, err);
      showToast(err.response?.data?.message || `Failed to delete ${deleteModal.type}`, 'error');
    }
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'PARTIAL': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'FULL': return 'bg-red-50 border-red-200 text-red-700';
      case 'MAINTENANCE': return 'bg-slate-50 border-slate-200 text-slate-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getRoomStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Available</span>;
      case 'PARTIAL': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Partial</span>;
      case 'FULL': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Full</span>;
      case 'MAINTENANCE': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">Maintenance</span>;
      default: return null;
    }
  };

  const getBedStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200 cursor-pointer';
      case 'OCCUPIED': return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200 cursor-pointer';
      case 'MAINTENANCE': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  if (loading && hierarchy.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-500">Loading hostel explorer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col relative">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hostel Explorer</h1>
          <p className="mt-1 text-sm text-slate-500">Visual hierarchy of blocks, floors, rooms, and beds.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-4 h-4 mr-2" />
            Grid View
          </button>
          <button
            onClick={() => setViewMode('floorPlan')}
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'floorPlan' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-4 h-4 mr-2" />
            Floor Plan View
          </button>
        </div>
      </div>

      {toast && (
        <div className={`absolute top-0 right-0 z-50 rounded-md p-4 shadow-lg ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-red-50 text-red-800 ring-1 ring-red-200'}`}>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 ring-1 ring-red-200 mb-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {viewMode === 'floorPlan' ? (
          <FloorPlan data={hierarchy} />
        ) : (
          <div className="h-full grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Blocks */}
            <div className="md:col-span-3 flex flex-col bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center">
                  <Building className="w-4 h-4 mr-2 text-indigo-600" />
                  Blocks
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {blocks.length === 0 ? (
                  <p className="text-sm text-slate-500 p-4 text-center">No blocks found.</p>
                ) : (
                  blocks.map((block, index) => (
                    <div key={`block-${block.id || block.name}-${index}`} className="relative group">
                      <button
                        onClick={() => handleBlockClick(block.name)}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          selectedBlock === block.name 
                            ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {block.name}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModal({ isOpen: true, type: 'block', id: block.id, name: block.name });
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* CENTER COLUMN: Floors and Rooms */}
            <div className="md:col-span-5 flex flex-col bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center">
                  <Layers className="w-4 h-4 mr-2 text-indigo-600" />
                  {selectedBlock ? `${selectedBlock} - Floors & Rooms` : 'Select a Block'}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {!selectedBlock ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <p>Select a block to view its floors.</p>
                  </div>
                ) : floorsForSelectedBlock.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center">No floors found in this block.</p>
                ) : (
                  floorsForSelectedBlock.map((floorData, index) => (
                    <div key={`floor-${floorData.floor}-${index}`} className="space-y-3">
                      <h3 className="text-sm font-medium text-slate-900 border-b border-slate-100 pb-2">
                        Floor {floorData.floor}
                      </h3>
                      {floorData.rooms.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No rooms on this floor.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {[...floorData.rooms].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })).map((room, roomIndex) => (
                            <div key={`room-${room.roomId || room.roomNumber}-${roomIndex}`} className="relative group">
                              <button
                                onClick={() => handleRoomClick(room)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  selectedRoom?.roomId === room.roomId
                                    ? 'ring-2 ring-indigo-500 border-transparent shadow-md'
                                    : `hover:shadow-md ${getRoomStatusColor(room.status)}`
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-semibold text-sm flex items-center">
                                    <DoorOpen className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                    {room.roomNumber}
                                  </span>
                                  {getRoomStatusBadge(room.status)}
                                </div>
                                <div className="text-xs opacity-80 mt-2 flex justify-between items-center">
                                  <span>{room.occupiedBeds} / {room.capacity} Occupied</span>
                                </div>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteModal({ isOpen: true, type: 'room', id: room.roomId, name: `Room ${room.roomNumber}` });
                                }}
                                className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm shadow-sm"
                                title="Delete Room"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Room Layout */}
            <div className="md:col-span-4 flex flex-col bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center">
                  <BedDouble className="w-4 h-4 mr-2 text-indigo-600" />
                  {selectedRoom ? `Room ${selectedRoom.roomNumber} Layout` : 'Room Layout'}
                </h2>
                {selectedRoom && getRoomStatusBadge(selectedRoom.status)}
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {!selectedRoom ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <p>Select a room to view its beds.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    
                    <div className="grid grid-cols-2 gap-4">
                      {selectedRoom.beds.length === 0 ? (
                        <div className="col-span-2 text-center text-sm text-slate-500 py-8">
                          No beds configured for this room.
                        </div>
                      ) : (
                        [...selectedRoom.beds].sort((a, b) => a.bedNumber.localeCompare(b.bedNumber, undefined, { numeric: true })).map((bed, bedIndex) => (
                          <div 
                            key={`bed-${bed._id || bed.bedNumber}-${bedIndex}`} 
                            onClick={() => bed.status !== 'MAINTENANCE' && handleBedClick(bed)}
                            className={`relative group p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${getBedStatusColor(bed.status)}`}
                          >
                            <BedDouble className="w-8 h-8 mb-2 opacity-80" />
                            <span className="font-bold text-sm mb-1">Bed {bed.bedNumber}</span>
                            
                            {bed.status === 'OCCUPIED' ? (
                              <div className="flex items-center text-xs font-medium mt-1 bg-white/50 px-2 py-1 rounded-md w-full justify-center">
                                <User className="w-3 h-3 mr-1" />
                                <span className="truncate">{bed.studentName || 'Unknown Student'}</span>
                              </div>
                            ) : bed.status === 'AVAILABLE' ? (
                              <span className="text-xs font-medium mt-1 opacity-80 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Available
                              </span>
                            ) : (
                              <span className="text-xs font-medium mt-1 opacity-80 flex items-center">
                                <Info className="w-3 h-3 mr-1" /> Maintenance
                              </span>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteModal({ isOpen: true, type: 'bed', id: bed._id, name: `Bed ${bed.bedNumber}` });
                              }}
                              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm shadow-sm"
                              title="Delete Bed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Room Statistics Summary */}
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Room Statistics</h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <div className="text-lg font-bold text-slate-700">{selectedRoom.capacity}</div>
                          <div className="text-xs text-slate-500">Total</div>
                        </div>
                        <div className="bg-red-50 p-2 rounded-lg">
                          <div className="text-lg font-bold text-red-700">{selectedRoom.occupiedBeds}</div>
                          <div className="text-xs text-red-600">Occupied</div>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-lg">
                          <div className="text-lg font-bold text-emerald-700">{selectedRoom.availableBeds}</div>
                          <div className="text-xs text-emerald-600">Available</div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Bed Assignment/Vacate Modal */}
      {bedModal.isOpen && bedModal.bed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {bedModal.bed.status === 'AVAILABLE' ? 'Assign Student' : 'Bed Details'}
              </h3>
              <button onClick={() => setBedModal({ isOpen: false, bed: null })} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Bed {bedModal.bed.bedNumber}</p>
                  <p className="text-xs text-slate-500">Room {selectedRoom?.roomNumber}</p>
                </div>
                {getBedStatusColor(bedModal.bed.status).includes('emerald') ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Available</span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Occupied</span>
                )}
              </div>

              {bedModal.bed.status === 'AVAILABLE' ? (
                <form onSubmit={handleAssignBed} className="space-y-4">
                  <div>
                    <label htmlFor="student" className="block text-sm font-medium text-slate-700">Select Student</label>
                    <select
                      id="student"
                      required
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">-- Select Student --</option>
                      {students.map((student, studentIndex) => (
  <option key={`student-${student._id}-${studentIndex}`} value={student._id}>
    {student.personalDetails?.firstName} {student.personalDetails?.lastName} 
    ({student.personalDetails?.rollNumber}) - {student.personalDetails?.department}
  </option>
))}
                    </select>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setBedModal({ isOpen: false, bed: null })}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedStudentId}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Assign Bed
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-start">
                    <div className="bg-indigo-100 p-2 rounded-full mr-4">
                      <User className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">{bedModal.bed.studentName || 'Unknown Student'}</h4>
                      <p className="text-xs text-slate-500 mt-1">Currently occupying this bed</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setBedModal({ isOpen: false, bed: null })}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTransferModal({ isOpen: true, bed: bedModal.bed });
                        setBedModal({ isOpen: false, bed: null });
                      }}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Transfer Student
                    </button>
                    <button
                      type="button"
                      onClick={handleVacateBed}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Vacate Bed
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Student Modal */}
      {transferModal.isOpen && transferModal.bed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Transfer Student</h3>
              <button onClick={() => setTransferModal({ isOpen: false, bed: null })} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-700">Student: {transferModal.bed.studentName}</p>
                <p className="text-xs text-slate-500 mt-1">Current Bed: {transferModal.bed.bedNumber}</p>
              </div>

              <form onSubmit={handleTransferStudent} className="space-y-4">
                <div>
                  <label htmlFor="newBed" className="block text-sm font-medium text-slate-700">Select New Bed</label>
                  <select
                    id="newBed"
                    required
                    value={selectedNewBedId}
                    onChange={(e) => setSelectedNewBedId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">-- Select Available Bed --</option>
                    {availableBeds.map((bed, index) => (
                      <option key={`newbed-${bed.id}-${index}`} value={bed.id}>
                        {bed.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setTransferModal({ isOpen: false, bed: null })}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedNewBedId}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                Confirm Delete
              </h3>
              <button onClick={() => setDeleteModal({ isOpen: false, type: 'block', id: '', name: '' })} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Are you sure you want to delete <strong>{deleteModal.name}</strong>?
              </p>
              {deleteModal.type === 'block' && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                  Warning: Deleting this block will also remove all floors, rooms, and beds inside it. This action cannot be undone.
                </p>
              )}
              {deleteModal.type === 'room' && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                  Warning: Deleting this room will also remove all beds inside it. This action cannot be undone.
                </p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ isOpen: false, type: 'block', id: '', name: '' })}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostelExplorer;
