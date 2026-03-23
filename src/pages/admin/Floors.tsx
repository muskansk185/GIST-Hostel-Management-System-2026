import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../api/axios';

interface Floor {
  _id: string;
  floorNumber: number;
  blockId: string;
  blockName: string;
  hostelName: string;
}

interface Block {
  _id: string;
  name: string;
  hostelName: string;
}

const Floors: React.FC = () => {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [formData, setFormData] = useState({
    floorNumber: '',
    blockId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [floorsRes, blocksRes] = await Promise.all([
        api.get('/hostels/floors'),
        api.get('/hostels/blocks')
      ]);
      setFloors(floorsRes.data);
      setBlocks(blocksRes.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load floors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (floor?: Floor) => {
    if (floor) {
      setEditingFloor(floor);
      setFormData({
        floorNumber: floor.floorNumber.toString(),
        blockId: floor.blockId
      });
    } else {
      setEditingFloor(null);
      setFormData({
        floorNumber: '',
        blockId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFloor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        floorNumber: parseInt(formData.floorNumber, 10),
        blockId: formData.blockId
      };

      if (editingFloor) {
        await api.put(`/hostels/floors/${editingFloor._id}`, payload);
        showToast('Floor updated successfully', 'success');
      } else {
        await api.post('/hostels/floors', payload);
        showToast('Floor created successfully', 'success');
      }
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      console.error('Error saving floor:', err);
      showToast(err.response?.data?.message || 'Failed to save floor', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/hostels/floors/${deleteModal.id}`);
      showToast('Floor deleted successfully', 'success');
      setDeleteModal({ isOpen: false, id: '', name: '' });
      fetchData();
    } catch (err: any) {
      console.error('Error deleting floor:', err);
      showToast(err.response?.data?.message || 'Failed to delete floor', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Floors Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage floors inside blocks.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Floor
        </button>
      </div>

      {toast && (
        <div className={`rounded-md p-4 ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200' : 'bg-red-50 text-red-800 ring-1 ring-red-200'}`}>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Floor Number</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Block Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hostel Name</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : floors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">
                    No floors found. Click "Add Floor" to create one.
                  </td>
                </tr>
              ) : (
                floors.map((floor) => (
                  <tr key={floor._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{floor.floorNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{floor.blockName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{floor.hostelName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(floor)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, id: floor._id, name: `Floor ${floor.floorNumber}` })}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingFloor ? 'Edit Floor' : 'Add Floor'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="floorNumber" className="block text-sm font-medium text-slate-700">Floor Number</label>
                <input
                  type="number"
                  id="floorNumber"
                  required
                  value={formData.floorNumber}
                  onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="blockId" className="block text-sm font-medium text-slate-700">Select Block</label>
                <select
                  id="blockId"
                  required
                  value={formData.blockId}
                  onChange={(e) => setFormData({ ...formData, blockId: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">-- Select Block --</option>
                  {blocks.map((block) => (
                    <option key={block._id} value={block._id}>
                      {block.name} - {block.hostelName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {editingFloor ? 'Save Changes' : 'Create Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Confirm Delete</h3>
              <button onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Are you sure you want to delete <strong>{deleteModal.name}</strong>?
              </p>
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                Warning: Deleting this floor will also remove all rooms and beds inside it. This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
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

export default Floors;
