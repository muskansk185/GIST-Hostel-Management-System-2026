import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { CreditCard, AlertCircle, CheckCircle2, XCircle, Clock, User, DollarSign } from 'lucide-react';

interface PaymentRecord {
  _id: string;
  student: {
  personalDetails: {
    firstName: string;
    lastName: string;
    rollNumber: string;
    department: string;
  };
},
  amount: number;
  status: string;
  transactionId?: string;
  date: string;
}

const PaymentHistory: React.FC = () => {
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get('/fees/history');
        setHistory(response.data);
      } catch (err: any) {
        console.error('Failed to fetch payment history', err);
        setError('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'FAILED': return <XCircle className="h-5 w-5 text-rose-500" />;
      case 'PENDING': return <Clock className="h-5 w-5 text-amber-500" />;
      default: return <AlertCircle className="h-5 w-5 text-slate-500" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'FAILED': return 'bg-rose-50 text-rose-700 ring-rose-600/20';
      case 'PENDING': return 'bg-amber-50 text-amber-700 ring-amber-600/20';
      default: return 'bg-slate-50 text-slate-700 ring-slate-600/20';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          Loading history...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment History</h1>
        <p className="mt-1 text-sm text-slate-500">View all past and current fee payments.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-red-600 ring-1 ring-red-200 flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900">No history found</h3>
              <p className="mt-1 text-sm text-slate-500">There are no payment records to display.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Transaction ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {history.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{`${record.student?.personalDetails?.firstName || ''} ${record.student?.personalDetails?.lastName || ''}`.trim()}</div>
                          <div className="text-xs text-slate-500">{record.student?.personalDetails?.rollNumber} • {record.student?.personalDetails?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {record.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusClass(record.status)}`}>
                        {getStatusIcon(record.status)}
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {record.transactionId || <span className="italic">N/A</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
