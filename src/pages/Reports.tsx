import React, { useState, useEffect } from 'react';
import { Download, Search, Calendar, FileText, TrendingUp, Users, Clock } from 'lucide-react';
import { dataService } from '../services/dataService.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [returns, setReturns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [metrics, setMetrics] = useState({
    todaysSales: 0,
    monthlySales: 0,
    outstandingAmount: 0,
    pendingBills: 0,
    paidCount: 0,
    partialCount: 0,
    pendingCount: 0
  });

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = () => {
    const allBills = dataService.getBills();
    const allPayments = dataService.getPaymentRecords();
    const allReturns = dataService.getReturns();
    const todaysBills = dataService.getTodaysSales();
    const monthlyBills = dataService.getMonthlySales();
    const outstandingBills = dataService.getOutstandingBills();

    setBills(allBills);
    setPayments(allPayments);
    setReturns(allReturns);

    const todaysSales = todaysBills.reduce((sum, bill) => sum + bill.total, 0);
    const monthlySales = monthlyBills.reduce((sum, bill) => sum + bill.total, 0);
    const outstandingAmount = outstandingBills.reduce((sum, bill) => sum + (bill.total - bill.amountPaid), 0);

    const paidCount = allBills.filter(bill => bill.status === 'paid').length;
    const partialCount = allBills.filter(bill => bill.status === 'partial').length;
    const pendingCount = allBills.filter(bill => bill.status === 'pending').length;

    setMetrics({
      todaysSales,
      monthlySales,
      outstandingAmount,
      pendingBills: outstandingBills.length,
      paidCount,
      partialCount,
      pendingCount
    });
  };

  const filteredBills = bills.filter((bill: any) => {
    const matchesSearch = bill.farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.billNo.toString().includes(searchTerm);
    const matchesDate = !dateFilter || bill.date.split('T')[0] === dateFilter;
    return matchesSearch && matchesDate;
  });

  const filteredPayments = payments.filter((payment: any) => {
    const matchesSearch = payment.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.billNo.toString().includes(searchTerm);
    const matchesDate = !dateFilter || payment.paymentDate === dateFilter;
    return matchesSearch && matchesDate;
  });

  const filteredReturns = returns.filter((returnBill: any) => {
    const matchesSearch = returnBill.farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnBill.returnNo.toString().includes(searchTerm);
    const matchesDate = !dateFilter || returnBill.date.split('T')[0] === dateFilter;
    return matchesSearch && matchesDate;
  });

  const outstandingBills = bills.filter((bill: any) => 
    bill.status === 'pending' || bill.status === 'partial'
  );

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const downloadBillPDF = async (bill: any, type: string = 'bill') => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add header
      pdf.setFontSize(16);
      pdf.text('Sri Sai Rythu Depot', 105, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`${type.toUpperCase()} RECEIPT`, 105, 30, { align: 'center' });
      
      // Add bill details
      pdf.setFontSize(10);
      let yPos = 50;
      
      if (type === 'payment') {
        pdf.text(`Payment Receipt No: ${bill.id}`, 20, yPos);
        pdf.text(`Bill No: ${bill.billNo}`, 20, yPos + 10);
        pdf.text(`Farmer: ${bill.farmerName}`, 20, yPos + 20);
        pdf.text(`Payment Date: ${new Date(bill.paymentDate).toLocaleDateString()}`, 20, yPos + 30);
        pdf.text(`Amount Paid: ₹${bill.amount.toLocaleString('en-IN')}`, 20, yPos + 40);
      } else if (type === 'return') {
        pdf.text(`Return No: ${bill.returnNo}`, 20, yPos);
        pdf.text(`Farmer: ${bill.farmer.name}`, 20, yPos + 10);
        pdf.text(`Return Date: ${new Date(bill.date).toLocaleDateString()}`, 20, yPos + 20);
        pdf.text(`Return Total: ₹${bill.total.toLocaleString('en-IN')}`, 20, yPos + 30);
        if (bill.reason) {
          pdf.text(`Reason: ${bill.reason}`, 20, yPos + 40);
        }
      } else {
        pdf.text(`Bill No: ${bill.billNo}`, 20, yPos);
        pdf.text(`Farmer: ${bill.farmer.name}`, 20, yPos + 10);
        pdf.text(`Date: ${new Date(bill.date).toLocaleDateString()}`, 20, yPos + 20);
        pdf.text(`Total: ₹${bill.total.toLocaleString('en-IN')}`, 20, yPos + 30);
        pdf.text(`Status: ${bill.status}`, 20, yPos + 40);
      }
      
      const filename = type === 'payment' 
        ? `Payment-${bill.id}-${bill.farmerName}.pdf`
        : type === 'return'
        ? `Return-${bill.returnNo}-${bill.farmer.name}.pdf`
        : `Bill-${bill.billNo}-${bill.farmer.name}.pdf`;
        
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const exportToExcel = (data: any[], filename: string) => {
    let csvContent = '';
    
    if (activeTab === 'payments') {
      csvContent = 'Payment ID,Bill No,Farmer,Payment Date,Amount,Payment Method\n';
      csvContent += data.map((payment: any) => 
        `${payment.id},${payment.billNo},${payment.farmerName},${payment.paymentDate},${payment.amount},${payment.paymentMethod}`
      ).join('\n');
    } else if (activeTab === 'returns') {
      csvContent = 'Return No,Farmer,Return Date,Total Amount,Reason\n';
      csvContent += data.map((returnBill: any) => 
        `${returnBill.returnNo},${returnBill.farmer.name},${new Date(returnBill.date).toLocaleDateString()},${returnBill.total},${returnBill.reason || ''}`
      ).join('\n');
    } else {
      csvContent = 'Bill No,Date,Farmer,Mobile,Total,Paid,Outstanding,Status\n';
      csvContent += data.map((bill: any) => 
        `${bill.billNo},${formatDate(bill.date)},${bill.farmer.name},${bill.farmer.mobile},${bill.total},${bill.amountPaid},${bill.total - bill.amountPaid},${bill.status}`
      ).join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusChip = (status: string) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const exportReport = () => {
    // Create CSV content
    const headers = ['Bill No', 'Date', 'Farmer', 'Mobile', 'Total', 'Paid', 'Outstanding', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredBills.map((bill: any) => [
        bill.billNo,
        formatDate(bill.date),
        bill.farmer.name,
        bill.farmer.mobile,
        bill.total,
        bill.amountPaid,
        bill.total - bill.amountPaid,
        bill.status
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <button
          onClick={exportReport}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'all-bills', label: 'All Bills' },
              { id: 'payments', label: 'Payment Records' },
              { id: 'returns', label: 'Return Bills' },
              { id: 'outstanding', label: 'Outstanding' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-emerald-50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-600">Today's Sales</p>
                      <p className="text-2xl font-bold text-emerald-700">{formatCurrency(metrics.todaysSales)}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Monthly Sales</p>
                      <p className="text-2xl font-bold text-blue-700">{formatCurrency(metrics.monthlySales)}</p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-red-50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Outstanding</p>
                      <p className="text-2xl font-bold text-red-700">{formatCurrency(metrics.outstandingAmount)}</p>
                    </div>
                    <Clock className="w-8 h-8 text-red-600" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Pending Bills</p>
                      <p className="text-2xl font-bold text-purple-700">{metrics.pendingBills}</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Payment Status Panel */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{metrics.paidCount}</div>
                    <div className="text-sm text-gray-600">Paid Bills</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{metrics.partialCount}</div>
                    <div className="text-sm text-gray-600">Partial Payments</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{metrics.pendingCount}</div>
                    <div className="text-sm text-gray-600">Pending Bills</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Bills Tab */}
          {activeTab === 'all-bills' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by farmer name or bill number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => exportToExcel(filteredBills, `sales-bills-${new Date().toISOString().split('T')[0]}.csv`)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Export Excel
                </button>
              </div>

              {/* Bills Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bill Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Farmer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBills.map((bill: any) => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">#{bill.billNo}</div>
                            <div className="text-sm text-gray-500">{formatDate(bill.date)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{bill.farmer.name}</div>
                            <div className="text-sm text-gray-500">{bill.farmer.mobile}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(bill.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(bill.amountPaid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                          {formatCurrency(bill.total - bill.amountPaid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusChip(bill.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => downloadBillPDF(bill, 'bill')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              PDF
                            </button>
                            <button 
                              onClick={() => exportToExcel([bill], `bill-${bill.billNo}.csv`)}
                              className="text-emerald-600 hover:text-emerald-900"
                            >
                              Excel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Records Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by farmer name or bill number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => exportToExcel(filteredPayments, `payment-records-${new Date().toISOString().split('T')[0]}.csv`)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Export Excel
                </button>
              </div>

              {/* Payments Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bill No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Farmer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">#{payment.id}</div>
                            <div className="text-sm text-gray-500">{formatDate(payment.createdAt)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          #{payment.billNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{payment.farmerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.paymentDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => downloadBillPDF(payment, 'payment')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              PDF
                            </button>
                            <button 
                              onClick={() => exportToExcel([payment], `payment-${payment.id}.csv`)}
                              className="text-emerald-600 hover:text-emerald-900"
                            >
                              Excel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Return Bills Tab */}
          {activeTab === 'returns' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by farmer name or return number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => exportToExcel(filteredReturns, `return-bills-${new Date().toISOString().split('T')[0]}.csv`)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Export Excel
                </button>
              </div>

              {/* Returns Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Return Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Farmer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Return Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReturns.map((returnBill: any) => (
                      <tr key={returnBill.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">#{returnBill.returnNo}</div>
                            <div className="text-sm text-gray-500">{formatDate(returnBill.date)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{returnBill.farmer.name}</div>
                            <div className="text-sm text-gray-500">{returnBill.farmer.mobile}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(returnBill.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                          {formatCurrency(returnBill.total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {returnBill.reason || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => downloadBillPDF(returnBill, 'return')}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              PDF
                            </button>
                            <button 
                              onClick={() => exportToExcel([returnBill], `return-${returnBill.returnNo}.csv`)}
                              className="text-emerald-600 hover:text-emerald-900"
                            >
                              Excel
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Outstanding Tab */}
          {activeTab === 'outstanding' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bill Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Farmer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Outstanding
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {outstandingBills.map((bill: any) => {
                      const outstanding = bill.total - bill.amountPaid;
                      const interest = dataService.calculateInterest(bill);
                      
                      return (
                        <tr key={bill.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">#{bill.billNo}</div>
                              <div className="text-sm text-gray-500">{formatDate(bill.date)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{bill.farmer.name}</div>
                              <div className="text-sm text-gray-500">{bill.farmer.village} • {bill.farmer.mobile}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(bill.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                            {formatCurrency(outstanding)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(interest)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => downloadBillPDF(bill, 'bill')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                PDF
                              </button>
                              <button 
                                onClick={() => exportToExcel([bill], `outstanding-${bill.billNo}.csv`)}
                                className="text-emerald-600 hover:text-emerald-900"
                              >
                                Excel
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;