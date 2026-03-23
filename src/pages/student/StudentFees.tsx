import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { DollarSign, AlertCircle, CheckCircle2, Clock, FileText, CreditCard } from 'lucide-react';

const StatCard = ({ title, value, icon, subtitle, loading, colorClass }: any) => (
  <div className={`rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 border-t-4 ${colorClass}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {loading ? (
          <div className="h-8 w-24 mt-2 bg-slate-200 animate-pulse rounded"></div>
        ) : (
          <p className="mt-2 text-3xl font-bold text-slate-900">₹{value.toLocaleString()}</p>
        )}
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClass.replace('border-', 'bg-').replace('-500', '-50')} ${colorClass.replace('border-', 'text-')}`}>
        {icon}
      </div>
    </div>
    {subtitle && (
      <div className="mt-4 text-sm text-slate-500">
        {subtitle}
      </div>
    )}
  </div>
);

const StudentFees: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fees, setFees] = useState<any[]>([]);
  const [processingFeeId, setProcessingFeeId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/fees/me');
      setFees(res.data);
    } catch (err: any) {
      setError('Failed to load fee details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFees();
    }
  }, [user]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (feeId: string) => {
    try {
      setProcessingFeeId(feeId);
      
      const res = await loadRazorpayScript();
      if (!res) {
        setNotification({ type: 'error', message: 'Razorpay SDK failed to load. Are you online?' });
        setProcessingFeeId(null);
        return;
      }

      // Create order on server
      const orderRes = await api.post('/fees/create-order', { feeId });
      const { order, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Hostel Management System',
        description: 'Fee Payment',
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await api.post('/fees/verify-payment', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              feeId
            });
            setNotification({ type: 'success', message: 'Payment successful!' });
            fetchFees();
          } catch (err) {
            console.error('Payment verification failed', err);
            setNotification({ type: 'error', message: 'Payment verification failed. Please contact support.' });
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email,
        },
        theme: {
          color: '#4f46e5',
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      console.error('Payment initiation failed', err);
      setNotification({ type: 'error', message: err.response?.data?.message || 'Failed to initiate payment' });
    } finally {
      setProcessingFeeId(null);
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

  // Calculate totals
  const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const paidAmount = fees.reduce((sum, fee) => fee.status === 'PAID' ? sum + fee.amount : sum, 0);
  const pendingAmount = fees.reduce((sum, fee) => fee.status !== 'PAID' ? sum + fee.amount : sum, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            <AlertCircle className="h-3.5 w-3.5" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`rounded-xl p-4 flex items-start justify-between ${notification.type === 'success' ? 'bg-green-50 text-green-800 ring-1 ring-green-200' : 'bg-red-50 text-red-800 ring-1 ring-red-200'}`}>
          <div className="flex gap-3">
            {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-500">
            &times;
          </button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fee Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your hostel fees and view payment history.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard 
          title="Total Fees" 
          value={totalFees} 
          icon={<FileText className="h-6 w-6" />} 
          colorClass="border-indigo-500"
          loading={loading}
        />
        <StatCard 
          title="Paid Amount" 
          value={paidAmount} 
          icon={<CheckCircle2 className="h-6 w-6" />} 
          colorClass="border-emerald-500"
          loading={loading}
        />
        <StatCard 
          title="Pending Amount" 
          value={pendingAmount} 
          icon={<AlertCircle className="h-6 w-6" />} 
          colorClass="border-amber-500"
          loading={loading}
        />
      </div>

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
          </div>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                      Loading payment history...
                    </div>
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>No fee records found.</p>
                  </td>
                </tr>
              ) : (
                fees.map((fee) => (
                  <tr key={fee._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{fee.feeName}</div>
                      <div className="text-xs text-slate-500">{fee.description || 'Hostel Fee'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">₹{fee.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{formatDate(fee.dueDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(fee.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {fee.paymentDate ? formatDate(fee.paymentDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {fee.status !== 'PAID' && (
                        <button 
                          onClick={() => handlePayment(fee._id)}
                          disabled={processingFeeId === fee._id}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingFeeId === fee._id ? 'Processing...' : 'Pay Now'}
                        </button>
                      )}
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

export default StudentFees;
