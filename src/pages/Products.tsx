import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Undo, AlertTriangle } from 'lucide-react';
import { dataService } from '../services/dataService.js';

const ALLOWED_SIZES = ['50ml', '100ml', '120ml', '150ml', '200ml', '250ml', '400ml', '500ml', '600ml', '800ml', '1L', '5L', '1Kg'];

const Products: React.FC = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    setProducts(dataService.getProducts());
  };

  const filteredProducts = products.filter((product: any) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.hsn.includes(searchTerm)
  );

  const calculateAmount = (qty: number, rate: number, discount: number, cgst: number, sgst: number) => {
    const discountedAmount = (qty * rate) - discount;
    const cgstAmount = (discountedAmount * cgst) / 100;
    const sgstAmount = (discountedAmount * sgst) / 100;
    return discountedAmount + cgstAmount + sgstAmount;
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setEditingData({ ...product });
  };

  const handleSave = () => {
    if (editingId) {
      // Auto-calculate amount
      const amount = calculateAmount(
        editingData.quantity || 0,
        editingData.rate || 0,
        editingData.discount || 0,
        editingData.cgst || 0,
        editingData.sgst || 0
      );
      
      const updatedData = { ...editingData, amount };
      
      dataService.updateProduct(editingId, updatedData);
      loadProducts();
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
    if (confirm('Are you sure you want to delete this product?')) {
      dataService.deleteProduct(id);
      loadProducts();
      showUndoToast();
    }
  };

  const handleAddRow = () => {
    const newProduct = {
      hsn: '',
      productName: '',
      batchNo: '',
      mnfDate: '',
      expDate: '',
      quantity: '',
      size: '250ml',
      rate: 0,
      discount: 0,
      cgst: 0,
      sgst: 0,
      amount: 0,
      stockInHand: 0
    };
    const added = dataService.addProduct(newProduct);
    loadProducts();
    setEditingId(added.id);
    setEditingData(added);
  };

  const handleAddMultipleRows = () => {
    for (let i = 0; i < 10; i++) {
      dataService.addProduct({
        hsn: '',
        productName: '',
        batchNo: '',
        mnfDate: '',
        expDate: '',
        quantity: '',
        size: '250ml',
        rate: 0,
        discount: 0,
        cgst: 0,
        sgst: 0,
        amount: 0,
        stockInHand: 0
      });
    }
    loadProducts();
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
    loadProducts();
    setShowUndo(false);
  };

  const getStockBadge = (stock: number, quantity: number = 0) => {
    const isLowStock = stock <= 10;
    const isOverStock = quantity > stock;
    
    if (isOverStock) {
      return (
        <div className="flex items-center space-x-1">
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">{stock}</span>
          <AlertTriangle className="w-4 h-4 text-red-600" />
        </div>
      );
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        isLowStock ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
      }`}>
        {stock}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
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
            <span>Add 10 Rows</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by product name or HSN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mnf Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exp Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGST%</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SGST%</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock in Hand</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product: any) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="text"
                        value={editingData.hsn || ''}
                        onChange={(e) => setEditingData({ ...editingData, hsn: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{product.hsn}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="text"
                        value={editingData.productName || ''}
                        onChange={(e) => setEditingData({ ...editingData, productName: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{product.productName}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="text"
                        value={editingData.batchNo || ''}
                        onChange={(e) => setEditingData({ ...editingData, batchNo: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{product.batchNo}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="date"
                        value={editingData.mnfDate || ''}
                        onChange={(e) => setEditingData({ ...editingData, mnfDate: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{product.mnfDate}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="date"
                        value={editingData.expDate || ''}
                        onChange={(e) => setEditingData({ ...editingData, expDate: e.target.value })}
                        onKeyDown={handleKeyPress}
                        className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{product.expDate}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        value={editingData.quantity || ''}
                        onChange={(e) => setEditingData({ ...editingData, quantity: e.target.value })}
                        onKeyDown={handleKeyPress}
                        placeholder="Enter quantity"
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{product.quantity || '-'}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <select
                        value={editingData.size || ''}
                        onChange={(e) => setEditingData({ ...editingData, size: e.target.value })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      >
                        {ALLOWED_SIZES.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-900">{product.size}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingData.rate || ''}
                        onChange={(e) => setEditingData({ ...editingData, rate: parseFloat(e.target.value) || 0 })}
                        onKeyDown={handleKeyPress}
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">₹{product.rate}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingData.discount || ''}
                        onChange={(e) => setEditingData({ ...editingData, discount: parseFloat(e.target.value) || 0 })}
                        onKeyDown={handleKeyPress}
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">₹{product.discount}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="28"
                        value={editingData.cgst || ''}
                        onChange={(e) => setEditingData({ ...editingData, cgst: parseFloat(e.target.value) || 0 })}
                        onKeyDown={handleKeyPress}
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{product.cgst}%</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="28"
                        value={editingData.sgst || ''}
                        onChange={(e) => setEditingData({ ...editingData, sgst: parseFloat(e.target.value) || 0 })}
                        onKeyDown={handleKeyPress}
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{product.sgst}%</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">₹{product.amount.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStockBadge(product.stockInHand, product.quantity)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {editingId === product.id ? (
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
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default Products;