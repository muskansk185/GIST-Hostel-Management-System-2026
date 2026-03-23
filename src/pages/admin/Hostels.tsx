import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../api/axios';

interface Hostel {
  _id: string;
  name: string;
  type: 'BOYS' | 'GIRLS';
  capacity: number;
  wardenId?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Warden {
  _id: string;
  name: string;
  email: string;
}

const Hostels: React.FC = () => {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    type: 'BOYS',
    capacity: '',
    wardenId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hostelsRes, wardensRes] = await Promise.all([
        api.get('/hostels/hostels'),
        api.get('/auth/users?role=WARDEN')
      ]);
      setHostels(hostelsRes.data);
      setWardens(wardensRes.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load hostels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (hostel?: Hostel) => {
    if (hostel) {
      setEditingHostel(hostel);
      setFormData({
        name: hostel.name,
        type: hostel.type,
        capacity: hostel.capacity.toString(),
        wardenId: hostel.wardenId?._id || ''
      });
    } else {
      setEditingHostel(null);
      setFormData({
        name: '',
        type: 'BOYS',
        capacity: '',
        wardenId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHostel(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        capacity: parseInt(formData.capacity, 10),
        ...(formData.wardenId ? { wardenId: formData.wardenId } : {})
      };

      if (editingHostel) {
        await api.put(`/hostels/hostels/${editingHostel._id}`, payload);
        showToast('Hostel updated successfully', 'success');
      } else {
        await api.post('/hostels/hostels', payload);
        showToast('Hostel created successfully', 'success');
      }
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      console.error('Error saving hostel:', err);
      showToast(err.response?.data?.message || 'Failed to save hostel', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/hostels/hostels/${deleteModal.id}`);
      showToast('Hostel deleted successfully', 'success');
      setDeleteModal({ isOpen: false, id: '', name: '' });
      fetchData();
    } catch (err: any) {
      console.error('Error deleting hostel:', err);
      showToast(err.response?.data?.message || 'Failed to delete hostel', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hostels Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage hostels, capacities, and wardens.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Hostel
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hostel Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Capacity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Warden</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                    </div>
                  </td>
                </tr>
              ) : hostels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">
                    No hostels found. Click "Add Hostel" to create one.
                  </td>
                </tr>
              ) : (
                hostels.map((hostel) => (
                  <tr key={hostel._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{hostel.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        hostel.type === 'BOYS' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {hostel.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {hostel.capacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{hostel.wardenId?.name || 'Unassigned'}</div>
                      {hostel.wardenId?.email && <div className="text-xs text-slate-500">{hostel.wardenId.email}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(hostel)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, id: hostel._id, name: hostel.name })}
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
                {editingHostel ? 'Edit Hostel' : 'Add Hostel'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">Hostel Name</label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-slate-700">Hostel Type</label>
                <select
                  id="type"
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="BOYS">Boys</option>
                  <option value="GIRLS">Girls</option>
                </select>
              </div>
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-slate-700">Capacity</label>
                <input
                  type="number"
                  id="capacity"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="wardenId" className="block text-sm font-medium text-slate-700">Assign Warden</label>
                <select
                  id="wardenId"
                  value={formData.wardenId}
                  onChange={(e) => setFormData({ ...formData, wardenId: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">-- Select Warden --</option>
                  {wardens.map((warden) => (
                    <option key={warden?._id} value={warden?._id}>
                      {warden?.name || 'Unknown'} ({warden?.email || 'No email'})
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
                  {editingHostel ? 'Save Changes' : 'Create Hostel'}
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
                Warning: Deleting this hostel will also remove all blocks, floors, rooms, and beds inside it. This action cannot be undone.
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

export default Hostels;
