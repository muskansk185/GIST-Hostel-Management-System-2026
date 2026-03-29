import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { CreditCard, AlertCircle, CheckCircle2, Clock, Download, DollarSign, History, XCircle, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FeeStatus: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fees, setFees] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const fetchFeeData = async () => {
      try {
        setLoading(true);
        const studentRes = await api.get('/students/linked-student');
        const studentData = studentRes.data.student;
        const allStudents = studentRes.data.students || [studentData];
        setStudents(allStudents);
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

  const handleStudentChange = async (studentId: string) => {
    const selected = students.find(s => s._id === studentId);
    if (selected) {
      setStudent(selected);
      setLoading(true);
      try {
        const feeRes = await api.get(`/fees/student/${selected._id}`);
        setFees(feeRes.data);
      } catch (err) {
        setError('Failed to load fee status for selected student.');
      } finally {
        setLoading(false);
      }
    }
  };

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
    const doc = new jsPDF();
    const studentName = student ? `${student.personalDetails?.firstName} ${student.personalDetails?.lastName}` : 'Student';
    const rollNumber = student?.personalDetails?.rollNumber || 'N/A';
    const hostelName = student?.accommodation?.hostelId?.name || 'N/A';
    const roomNumber = student?.accommodation?.roomId?.roomNumber || 'N/A';

    // Header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text('Hostel Management System', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('Fee Receipt', 105, 30, { align: 'center' });

    // Receipt Info
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Receipt No: REC-${fee._id.substring(0, 8).toUpperCase()}`, 20, 45);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 190, 45, { align: 'right' });

    // Student Details Box
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(20, 55, 170, 40, 'F');
    
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('Student Details:', 25, 65);
    
    doc.setFontSize(10);
    doc.text(`Name: ${studentName}`, 25, 75);
    doc.text(`Roll Number: ${rollNumber}`, 25, 85);
    doc.text(`Hostel: ${hostelName}`, 110, 75);
    doc.text(`Room: ${roomNumber}`, 110, 85);

    // Fee Details Table
    autoTable(doc, {
      startY: 105,
      head: [['Description', 'Academic Year', 'Amount']],
      body: [
        [fee.feeName, fee.academicYear || 'N/A', `$${fee.amount}`]
      ],
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20, right: 20 }
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Paid: $${fee.amount}`, 190, finalY, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text('This is a computer-generated receipt and does not require a physical signature.', 105, 280, { align: 'center' });
    doc.text('Thank you for your payment!', 105, 285, { align: 'center' });

    doc.save(`Receipt_${fee.feeName}_${rollNumber}.pdf`);
    
    setNotification({ type: 'success', message: `Receipt for ${fee.feeName} downloaded successfully.` });
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Status & Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor and pay fees for {student ? `${student.personalDetails?.firstName} ${student.personalDetails?.lastName}` : 'your child'}.
          </p>
        </div>
        
        {students.length > 1 && (
          <select 
            className="block w-full sm:w-64 rounded-md border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            value={student?._id || ''}
            onChange={(e) => handleStudentChange(e.target.value)}
          >
            {students.map(s => (
              <option key={s._id} value={s._id}>{s.personalDetails?.firstName} {s.personalDetails?.lastName} ({s.personalDetails?.rollNumber})</option>
            ))}
          </select>
        )}
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
