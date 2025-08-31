import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Printer, Calendar, Undo } from 'lucide-react';
import { dataService } from '../services/dataService.js';

const StockRegister: React.FC = () => {
  const [stockRegister, setStockRegister] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [dealerName, setDealerName] = useState('Sri Sai Rythu Depot');
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => {
    loadStockRegister();
  }, []);

  const loadStockRegister = () => {
    setStockRegister(dataService.getStockRegister());
  };

  const filteredStock = stockRegister.filter((entry: any) =>
    entry.insecticideName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.dateOfReceipt.includes(searchTerm)
  );

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);
    setEditingData({ ...entry });
  };

  const handleSave = () => {
    if (editingId) {
      dataService.updateStockRegisterEntry(editingId, editingData);
      loadStockRegister();
      setEditingId(null);
      setEditingData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const showUndoToast = () => {
    setShowUndo(true);
    setTimeout(() => setShowUndo(false), 10000);
  };

  const handleUndo = () => {
    dataService.undoLastAction();
    loadStockRegister();
    setShowUndo(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this stock entry?')) {
      dataService.deleteStockRegisterEntry(id);
      loadStockRegister();
      showUndoToast();
    }
  };

  const handleAddRow = () => {
    const newEntry = {
      dateOfReceipt: new Date().toISOString().split('T')[0],
      supplier: '',
      insecticideName: '',
      batchNo: '',
      mnfDate: '',
      expDate: '',
      qtyReceived: 0,
      qtyInHand: 0,
      total: 0,
      sold: 0,
      balance: 0,
      billNoDate: '',
      purchaserName: '',
      purchaserSignature: '',
      remarks: ''
    };
    const added = dataService.addToStockRegister(newEntry);
    loadStockRegister();
    setEditingId(added.id);
    setEditingData(added);
  };

  const handleAddMultipleRows = () => {
    for (let i = 0; i < 20; i++) {
      dataService.addToStockRegister({
        dateOfReceipt: new Date().toISOString().split('T')[0],
        supplier: '',
        insecticideName: '',
        batchNo: '',
        mnfDate: '',
        expDate: '',
        qtyReceived: 0,
        qtyInHand: 0,
        total: 0,
        sold: 0,
        balance: 0,
        billNoDate: '',
        purchaserName: '',
        purchaserSignature: '',
        remarks: ''
      });
    }
    loadStockRegister();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };



  const printRegister = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">STOCK REGISTER</h1>
          <h2 className="text-xl text-gray-600">స్టాక్ రిజిస్టర్</h2>
          <p className="text-sm text-gray-500 mt-1">
            Appendix–II of Rule 15 / నిబంధన 15 లో అనుబంధం–II
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={printRegister}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print Register</span>
          </button>
          <button
            onClick={handleAddRow}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Row</span>
          </button>
          <button
            onClick={handleAddMultipleRows}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add 20 Rows</span>
          </button>
        </div>
      </div>

      {/* Dealer Info & Controls */}
      <div className="bg-white rounded-2xl shadow-sm p-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dealer Name / డీలర్ పేరు
            </label>
            <input
              type="text"
              value={dealerName}
              onChange={(e) => setDealerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month/Year / నెల/సంవత్సరం
            </label>
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by product, supplier, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Print Header (only visible when printing) */}
      <div className="print-only">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">STOCK REGISTER / స్టాక్ రిజిస్టర్</h1>
          <p className="text-sm mb-4">Appendix–II of Rule 15 / నిబంధన 15 లో అనుబంధం–II</p>
          <div className="flex justify-between text-sm">
            <span>Dealer Name / డీలర్ పేరు: {dealerName}</span>
            <span>Month/Year / నెల/సంవత్సరం: {new Date(currentMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stock Register Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden print:shadow-none print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 print:bg-gray-100">
              <tr>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Sl. No</div>
                  <div className="text-xs text-gray-500">సీరియల్ నంబర్</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Date of Receipt</div>
                  <div className="text-xs text-gray-500">వచ్చిన తేది</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Supplier</div>
                  <div className="text-xs text-gray-500">సప్లైయర్</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Insecticide Name</div>
                  <div className="text-xs text-gray-500">కీటనాశిని పేరు</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Batch No</div>
                  <div className="text-xs text-gray-500">బ్యాచ్ నంబర్</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Mnf Date</div>
                  <div className="text-xs text-gray-500">తయారీ తేది</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Exp Date</div>
                  <div className="text-xs text-gray-500">గడువు తేది</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Qty Received</div>
                  <div className="text-xs text-gray-500">వచ్చిన పరిమాణం</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Qty in Hand</div>
                  <div className="text-xs text-gray-500">చేతిలో ఉన్న పరిమాణం</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Total</div>
                  <div className="text-xs text-gray-500">మొత్తం</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Sold</div>
                  <div className="text-xs text-gray-500">అమ్మిన పరిమాణం</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Balance</div>
                  <div className="text-xs text-gray-500">మిగిలిన పరిమాణం</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Bill No & Date</div>
                  <div className="text-xs text-gray-500">బిల్ నంబర్ & తేది</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Purchaser Name</div>
                  <div className="text-xs text-gray-500">కొనుగోలుదారు పేరు</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Purchaser Signature</div>
                  <div className="text-xs text-gray-500">కొనుగోలుదారు సంతకం</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300">
                  <div>Remarks</div>
                  <div className="text-xs text-gray-500">వ్యాఖ్యలు</div>
                </th>
                <th className="px-2 py-3 text-left font-medium text-gray-700 border border-gray-300 no-print">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((entry: any, index: number) => (
                <tr key={entry.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                  <td className="px-2 py-2 border border-gray-300 text-center">
                    {entry.slNo}
                  </td>
                  <td className="px-2 py-2 border border-gray-300">
                    {editingId === entry.id ? (
                      <input
                        type="date"
                        value={editingData.dateOfReceipt || ''}
                        onChange={(e) => setEditingData({ ...editingData, dateOfReceipt: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    ) : (
                      <span>{formatDate(entry.dateOfReceipt)}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border border-gray-300">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editingData.supplier || ''}
                        onChange={(e) => setEditingData({ ...editingData, supplier: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    ) : (
                      <span>{entry.supplier}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border border-gray-300">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editingData.insecticideName || ''}
                        onChange={(e) => setEditingData({ ...editingData, insecticideName: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    ) : (
                      <span>{entry.insecticideName}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border border-gray-300">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editingData.batchNo || ''}
                        onChange={(e) => setEditingData({ ...editingData, batchNo: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    ) : (
                      <span>{entry.batchNo}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border border-gray-300">
                    {editingId === entry.id ? (
                      <input
                        type="date"
                        value={editingData.mnfDate || ''}
                        onChange={(e) => setEditingData({ ...editingData, mnfDate: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    ) : (
                      <span>{formatDate(entry.mnfDate)}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border border-gray-300">
                    {editingId === entry.id ? (
                      <input
                        type="date"
                        value={editingData.expDate || ''}
                        onChange={(e) => setEditingData({ ...editingData, expDate: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    ) : (
                      <span>{formatDate(entry.expDate)}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border border-gray-300 text-right">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editingData.qtyReceived || ''}
                        onChange={(e) => setEditingData({ ...editingData, qtyReceived: parseInt(e.target.value) || 0 })}
                        onKeyDown={handleKeyPress}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-right"
                      />
                    ) : (
                      <span>{entry.qtyReceived}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border border-gray-300 text-right">
                    {editingId === entry.id ? (
                      <input
                        type="number"
                        value={editingData.qtyInHand || ''}
                        onChange={(e) => setEditingData({ ...editingData, qtyInHand: parseInt(e.target.value) || 0 })}
                        onKeyDown={handleKeyPress}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 text-right"
                      />
                    ) : (
                      <span>{entry.qtyInHand}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border border-gray-300 text-right">
                    <span>{entry.total}</span>
                  </td>
                  <td className="px-2 py-2 border border-gray-300 text-right">
                    <span>{entry.sold}</span>
                  </td>
                  <td className="px-2 py-2 border border-gray-300 text-right">
                    <span>{entry.balance}</span>
                  </td>
                  <td className="px-2 py-2 border border-gray-300">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editingData.billNoDate || ''}
                        onChange={(e) => setEditingData({ ...editingData, billNoDate: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    ) : (
                      <span>{entry.billNoDate}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border border-gray-300">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editingData.purchaserName || ''}
                        onChange={(e) => setEditingData({ ...editingData, purchaserName: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    ) : (
                      <span>{entry.purchaserName}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border border-gray-300">
                    <span>{entry.purchaserSignature}</span>
                  </td>
                  <td className="px-2 py-2 border border-gray-300">
                    {editingId === entry.id ? (
                      <input
                        type="text"
                        value={editingData.remarks || ''}
                        onChange={(e) => setEditingData({ ...editingData, remarks: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                    ) : (
                      <span>{entry.remarks}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border border-gray-300 no-print">
                    {editingId === entry.id ? (
                      <div className="flex space-x-1">
                        <button
                          onClick={handleSave}
                          className="text-emerald-600 hover:text-emerald-900 text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            font-size: 10px;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default StockRegister;