import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Undo, Calendar, CalendarDays } from 'lucide-react';
import { dataService } from '../services/dataService.js';

const Farmers: React.FC = () => {
  const [farmers, setFarmers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [showUndo, setShowUndo] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [nextVisitDate, setNextVisitDate] = useState('');

  useEffect(() => {
    loadFarmers();
  }, []);

  const loadFarmers = () => {
    setFarmers(dataService.getFarmers());
  };

  const filteredFarmers = farmers.filter((farmer: any) =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.mobile.includes(searchTerm)
  );

  const handleEdit = (farmer: any) => {
    setEditingId(farmer.id);
    setEditingData({ ...farmer });
  };

  const handleSave = () => {
    if (editingId) {
      // Validation
      if (editingData.pin && editingData.pin.length !== 6) {
        alert('PIN must be 6 digits');
        return;
      }
      if (editingData.mobile && editingData.mobile.length !== 10) {
        alert('Mobile must be 10 digits');
        return;
      }

      dataService.updateFarmer(editingId, editingData);
      loadFarmers();
      setEditingId(null);
      setEditingData({});
      showUndoToast();
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this farmer?')) {
      dataService.deleteFarmer(id);
      loadFarmers();
      showUndoToast();
    }
  };

  const handleAddRow = () => {
    const newFarmer = {
      name: '',
      fatherName: '',
      village: '',
      mandal: '',
      district: '',
      pin: '',
      mobile: '',
      balance: 0
    };
    const added = dataService.addFarmer(newFarmer);
    loadFarmers();
    setEditingId(added.id);
    setEditingData(added);
  };

  const handleAddMultipleRows = () => {
    for (let i = 0; i < 20; i++) {
      dataService.addFarmer({
        name: '',
        fatherName: '',
        village: '',
        mandal: '',
        district: '',
        pin: '',
        mobile: '',
        balance: 0
      });
    }
    loadFarmers();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const showUndoToast = () => {
    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 10000);
  };

  const handleUndo = () => {
    dataService.undoLastAction();
    loadFarmers();
    setShowUndo(false);
  };

  const handleSetNextVisit = (farmer) => {
    setSelectedFarmer(farmer);
    setShowCalendar(true);
    setNextVisitDate('');
  };

  const handleSaveNextVisit = () => {
    if (selectedFarmer && nextVisitDate) {
      const updatedFarmer = { ...selectedFarmer, nextVisitDate };
      dataService.updateFarmer(selectedFarmer.id, updatedFarmer);
      loadFarmers();
      setShowCalendar(false);
      setSelectedFarmer(null);
      setNextVisitDate('');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatAmountBilingual = (amount) => {
    return (
      <div>
        <div className={`font-medium ${amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(amount)}
        </div>
        <div className="text-xs text-gray-500">
          రూపాయలు {amount.toLocaleString('en-IN')}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Farmers Management</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleAddRow}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Row</span>
          </button>
          <button
            onClick={handleAddMultipleRows}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add 20 Rows</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, village, or mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Farmers Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farmer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Father's Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Village
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mandal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PIN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  మొత్తం బిల్లు<br/>(TOTAL BILL)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  చెల్లించిన మొత్తం<br/>(AMOUNT PAID)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  పెండింగ్<br/>(OUTSTANDING)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  వడ్డీ<br/>(INTEREST)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  మొత్తం చెల్లించవలసినది<br/>(TOTAL PAYABLE)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  చివరి నవీకరణ<br/>(LAST UPDATED)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Visit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFarmers.map((farmer: any) => {
                const farmerBills = dataService.getBills().filter(bill => bill.farmer.id === farmer.id);
                const totalBill = farmerBills.reduce((sum, bill) => sum + bill.total, 0);
                const amountPaid = farmerBills.reduce((sum, bill) => sum + bill.amountPaid, 0);
                const outstanding = totalBill - amountPaid;
                
                let interest = 0;
                if (outstanding > 0) {
                  if (farmer.nextVisitDate) {
                    // Calculate interest from last updated to next visit date
                    interest = dataService.calculateInterestForDate({ 
                      total: outstanding, 
                      amountPaid: 0, 
                      date: farmer.lastUpdated || new Date().toISOString() 
                    }, farmer.nextVisitDate);
                  } else {
                    // Calculate daily increasing interest
                    interest = dataService.calculateDailyInterest({ 
                      total: outstanding, 
                      amountPaid: 0, 
                      date: farmer.lastUpdated || new Date().toISOString(),
                      lastUpdated: farmer.lastUpdated || new Date().toISOString()
                    });
                  }
                }
                
                const totalPayable = outstanding + interest;
                
                return (
                  <tr key={farmer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === farmer.id ? (
                        <input
                          type="text"
                          value={editingData.name || ''}
                          onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          onKeyDown={handleKeyPress}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{farmer.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === farmer.id ? (
                        <input
                          type="text"
                          value={editingData.fatherName || ''}
                          onChange={(e) => setEditingData({ ...editingData, fatherName: e.target.value })}
                          onKeyDown={handleKeyPress}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{farmer.fatherName}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === farmer.id ? (
                        <input
                          type="text"
                          value={editingData.village || ''}
                          onChange={(e) => setEditingData({ ...editingData, village: e.target.value })}
                          onKeyDown={handleKeyPress}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{farmer.village}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === farmer.id ? (
                        <input
                          type="text"
                          value={editingData.mandal || ''}
                          onChange={(e) => setEditingData({ ...editingData, mandal: e.target.value })}
                          onKeyDown={handleKeyPress}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{farmer.mandal}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === farmer.id ? (
                        <input
                          type="text"
                          value={editingData.district || ''}
                          onChange={(e) => setEditingData({ ...editingData, district: e.target.value })}
                          onKeyDown={handleKeyPress}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{farmer.district}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === farmer.id ? (
                        <input
                          type="text"
                          value={editingData.pin || ''}
                          onChange={(e) => setEditingData({ ...editingData, pin: e.target.value })}
                          onKeyDown={handleKeyPress}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                          maxLength={6}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{farmer.pin}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === farmer.id ? (
                        <input
                          type="tel"
                          value={editingData.mobile || ''}
                          onChange={(e) => setEditingData({ ...editingData, mobile: e.target.value })}
                          onKeyDown={handleKeyPress}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                          maxLength={10}
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{farmer.mobile}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatAmountBilingual(farmer.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatAmountBilingual(totalBill)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatAmountBilingual(amountPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={outstanding > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatAmountBilingual(outstanding)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-orange-600">
                        {formatAmountBilingual(interest)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-red-600 font-medium">
                        {formatAmountBilingual(totalPayable)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {farmer.lastUpdated ? new Date(farmer.lastUpdated).toLocaleDateString('en-IN') : 'Not set'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {farmer.lastUpdated ? new Date(farmer.lastUpdated).toLocaleDateString('te-IN') : 'సెట్ చేయలేదు'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {farmer.nextVisitDate ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {new Date(farmer.nextVisitDate).toLocaleDateString('en-IN')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(farmer.nextVisitDate).toLocaleDateString('te-IN')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not set</span>
                        )}
                        <button
                          onClick={() => handleSetNextVisit(farmer)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <CalendarDays className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === farmer.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSave}
                            className="text-emerald-600 hover:text-emerald-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(farmer)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(farmer.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Next Visit Calendar Modal */}
      {showCalendar && selectedFarmer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Set Next Visit Date for {selectedFarmer.name}
            </h3>
            <h4 className="text-sm text-gray-600 mb-4">
              తదుపరి సందర్శన తేది సెట్ చేయండి {selectedFarmer.name} కోసం
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Visit Date / తదుపరి సందర్శన తేది
                </label>
                <input
                  type="date"
                  value={nextVisitDate}
                  onChange={(e) => setNextVisitDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              {selectedFarmer.balance > 0 && nextVisitDate && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Interest Calculation / వడ్డీ లెక్కింపు</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Outstanding / బకాయి:</span>
                      <span>{formatCurrency(selectedFarmer.balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Rate / వడ్డీ రేటు:</span>
                      <span>2% per month</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Interest till {new Date(nextVisitDate).toLocaleDateString()}:</span>
                      <span className="text-red-600">
                        {formatCurrency(dataService.calculateInterestForDate({ 
                          total: selectedFarmer.balance, 
                          amountPaid: 0, 
                          date: new Date().toISOString() 
                        }, nextVisitDate))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCalendar(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNextVisit}
                disabled={!nextVisitDate}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Save Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast */}
      {showUndo && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <span>Action completed</span>
          <button
            onClick={handleUndo}
            className="flex items-center space-x-1 text-blue-300 hover:text-blue-100"
          >
            <Undo className="w-4 h-4" />
            <span>Undo</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Farmers;