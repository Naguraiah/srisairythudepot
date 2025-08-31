import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Package, FileText, IndianRupee, Clock, CreditCard, CalendarDays } from 'lucide-react';
import { dataService } from '../services/dataService.js';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    todaysSales: 0,
    monthlySales: 0,
    totalFarmers: 0,
    totalProducts: 0,
    pendingBills: 0,
    outstandingAmount: 0,
    totalInterest: 0,
    todayPaid: 0,
    partialSales: 0
  });
  
  const [outstandingBills, setOutstandingBills] = useState([]);
  const [recentBills, setRecentBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const todaysBills = dataService.getTodaysSales();
    const monthlyBills = dataService.getMonthlySales();
    const farmers = dataService.getFarmers();
    const products = dataService.getProducts();
    const allBills = dataService.getBills();
    const outstanding = dataService.getOutstandingBills();

    const todaysSales = todaysBills.reduce((sum, bill) => sum + bill.total, 0);
    const monthlySales = monthlyBills.reduce((sum, bill) => sum + bill.total, 0);
    const outstandingAmount = outstanding.reduce((sum, bill) => sum + (bill.total - bill.amountPaid), 0);
    const totalInterest = outstanding.reduce((sum, bill) => sum + dataService.calculateInterest(bill), 0);
    const todayPaid = todaysBills.reduce((sum, bill) => sum + bill.amountPaid, 0);
    const partialSales = allBills.filter(bill => bill.status === 'partial').reduce((sum, bill) => sum + bill.total, 0);

    setMetrics({
      todaysSales,
      monthlySales,
      totalFarmers: farmers.length,
      totalProducts: products.length,
      pendingBills: outstanding.length,
      outstandingAmount,
      totalInterest,
      todayPaid,
      partialSales
    });

    setOutstandingBills(outstanding.slice(0, 5));
    setRecentBills(allBills.slice(-5).reverse());
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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

  const handleMarkPayment = (bill) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const handleMarkAsPaid = () => {
    if (selectedBill && paymentAmount) {
      const paidAmount = parseFloat(paymentAmount);
      const outstanding = selectedBill.total - selectedBill.amountPaid;
      
      if (paidAmount > outstanding) {
        alert('Payment amount cannot exceed outstanding amount');
        return;
      }
      
      const newAmountPaid = selectedBill.amountPaid + paidAmount;
      const newStatus = newAmountPaid >= selectedBill.total ? 'paid' : 'partial';
      
      // Create payment record
      const paymentRecord = {
        id: Date.now().toString(),
        billId: selectedBill.id,
        billNo: selectedBill.billNo,
        farmerId: selectedBill.farmer.id,
        farmerName: selectedBill.farmer.name,
        amount: paidAmount,
        paymentDate: paymentDate,
        paymentMethod: 'Cash',
        createdAt: new Date().toISOString()
      };
      
      dataService.addPaymentRecord(paymentRecord);
      
      const updatedBill = { 
        ...selectedBill, 
        amountPaid: newAmountPaid,
        status: newStatus,
        lastUpdated: new Date().toISOString()
      };
      
      dataService.updateBill(selectedBill.id, updatedBill);
      
      // Update farmer balance
      const farmer = dataService.getFarmers().find(f => f.id === selectedBill.farmer.id);
      if (farmer) {
        const updatedFarmer = {
          ...farmer,
          balance: Math.max(0, farmer.balance - paidAmount),
          lastUpdated: new Date().toISOString()
        };
        dataService.updateFarmer(farmer.id, updatedFarmer);
      }
      
      loadDashboardData();
      setShowPaymentModal(false);
      setSelectedBill(null);
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  };

  const formatAmountBilingual = (amount) => {
    return (
      <div className="text-right">
        <div className="font-medium">{formatCurrency(amount)}</div>
        <div className="text-xs text-gray-500">రూపాయలు {amount.toLocaleString('en-IN')}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar className="w-5 h-5" />
          <span>{formatDate(new Date().toISOString())}</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.todaysSales)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Sales</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.monthlySales)}</p>
            </div>
            <IndianRupee className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Farmers</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.totalFarmers}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-indigo-600">{metrics.totalProducts}</p>
            </div>
            <Package className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Bills</p>
              <p className="text-2xl font-bold text-orange-600">{metrics.pendingBills}</p>
            </div>
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outstanding Amount</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.outstandingAmount)}</p>
            </div>
            <Clock className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today Paid</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.todayPaid)}</p>
            </div>
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Interest</p>
              <p className="text-2xl font-bold text-pink-600">{formatCurrency(metrics.totalInterest)}</p>
            </div>
            <IndianRupee className="w-8 h-8 text-pink-600" />
          </div>
        </div>
      </div>

      {/* Outstanding Balances Table */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Outstanding Balances</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bill</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Payable</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {outstandingBills.map((bill: any) => {
                const outstanding = bill.total - bill.amountPaid;
                const interest = dataService.calculateInterest(bill);
                const totalPayable = outstanding + interest;
                
                return (
                  <tr key={bill.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{bill.farmer.name}</div>
                        <div className="text-sm text-gray-500">{bill.farmer.village} • {bill.farmer.mobile}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmountBilingual(bill.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmountBilingual(bill.amountPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatAmountBilingual(outstanding)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmountBilingual(interest)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {formatAmountBilingual(totalPayable)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bill.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleMarkPayment(bill)}
                          className="bg-emerald-600 text-white px-2 py-1 rounded text-xs hover:bg-emerald-700"
                        >
                          Mark Payment
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

      {/* Recent Bills */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Bills</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBills.map((bill: any) => (
                <tr key={bill.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{bill.billNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bill.farmer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(bill.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bill.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusChip(bill.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Next Visit Calendar Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mark Payment for {selectedBill.farmer.name}
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Bill:</span>
                    <span>{formatCurrency(selectedBill.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Already Paid:</span>
                    <span>{formatCurrency(selectedBill.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span>Outstanding:</span>
                    <span className="text-red-600">{formatCurrency(selectedBill.total - selectedBill.amountPaid)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedBill.total - selectedBill.amountPaid}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter payment amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Mark Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;