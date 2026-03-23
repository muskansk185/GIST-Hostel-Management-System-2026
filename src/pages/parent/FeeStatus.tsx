import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { CreditCard, AlertCircle, CheckCircle2, Clock, Download, DollarSign, History, XCircle, X } from 'lucide-react';

const FeeStatus: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fees, setFees] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const fetchFeeData = async () => {
      try {
        setLoading(true);
        const studentRes = await api.get('/students/linked-student');
        const studentData = studentRes.data.student;
        setStudent(studentData);

        if (studentData) {
          const feeRes = await api.get(`/fees/student/${studentData._id}`);
          setFees(feeRes.data);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('No student linked to this account.');
        } else {
          setError('Failed to load fee status. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFeeData();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Paid
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <Clock className="h-3.5 w-3.5" />
            Partial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            <AlertCircle className="h-3.5 w-3.5" />
            Pending
          </span>
        );
    }
  };

  const handleDownloadReceipt = (fee: any) => {
    // In a real app, this would generate a PDF or fetch a receipt URL
    setNotification({ type: 'success', message: `Downloading receipt for ${fee.feeName} - ${fee.academicYear || ''}` });
  };

  const handlePayNow = async (fee: any) => {
    // Mock payment processing
    try {
      setProcessingPayment(fee._id);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update local state to reflect payment
      setFees(fees.map(f => 
        f._id === fee._id 
          ? { ...f, status: 'PAID', paidAt: new Date().toISOString() } 
          : f
      ));
      
      setNotification({ type: 'success', message: `Payment of $${fee.amount} for ${fee.feeName} successful!` });
    } catch (err) {
      setNotification({ type: 'error', message: 'Payment failed. Please try again.' });
    } finally {
      setProcessingPayment(null);
    }
  };

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-600 ring-1 ring-red-200 flex items-start gap-3">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  const totalFees = fees.reduce((sum: number, fee: any) => sum + fee.amount, 0);
  const paidFees = fees.filter((f: any) => f.status === 'PAID').reduce((sum: number, fee: any) => sum + fee.amount, 0);
  const pendingFees = totalFees - paidFees;

  const paymentHistory = fees.filter((f: any) => f.status === 'PAID' || f.paidAt);

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`rounded-xl p-4 flex items-start justify-between ${notification.type === 'success' ? 'bg-green-50 text-green-800 ring-1 ring-green-200' : 'bg-red-50 text-red-800 ring-1 ring-red-200'}`}>
          <div className="flex gap-3">
            {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-500">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fee Status & Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor and pay fees for {student ? `${student.firstName} ${student.lastName}` : 'your child'}.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Total Fees</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">${totalFees}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Total Paid</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">${paidFees}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-medium text-slate-500">Total Pending</p>
          <p className={`mt-2 text-3xl font-bold ${pendingFees > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            ${pendingFees}
          </p>
        </div>
      </div>

      {/* Current Dues Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Current Dues</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Fee Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
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
                      Loading fee history...
                    </div>
                  </td>
                </tr>
              ) : fees.filter(f => f.status !== 'PAID').length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400 mb-3" />
                    <p>No pending dues. All caught up!</p>
                  </td>
                </tr>
              ) : (
                fees.filter(f => f.status !== 'PAID').map((fee) => (
                  <tr key={fee._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{fee.feeName}</div>
                      <div className="text-xs text-slate-500">{fee.academicYear}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">${fee.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{formatDate(fee.dueDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(fee.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handlePayNow(fee)}
                        disabled={processingPayment === fee._id}
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                      >
                        {processingPayment === fee._id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        ) : (
                          <DollarSign className="h-4 w-4" />
                        )}
                        {processingPayment === fee._id ? 'Processing...' : 'Pay Now'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
            <History className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Fee Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Amount Paid
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                      Loading payment history...
                    </div>
                  </td>
                </tr>
              ) : paymentHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <History className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>No payment history found.</p>
                  </td>
                </tr>
              ) : (
                paymentHistory.map((fee) => (
                  <tr key={fee._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{fee.feeName}</div>
                      <div className="text-xs text-slate-500">{fee.academicYear}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">${fee.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{fee.paidAt ? formatDate(fee.paidAt) : formatDate(fee.updatedAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDownloadReceipt(fee)}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900"
                      >
                        <Download className="h-4 w-4" />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FeeStatus;
