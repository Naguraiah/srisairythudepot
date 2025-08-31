import React, { useState, useEffect } from 'react';
import { Search, Plus, Printer, Save, X, FileDown, Trash2 } from 'lucide-react';
import { dataService } from '../services/dataService.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ALLOWED_SIZES = ['50ml', '100ml', '120ml', '150ml', '200ml', '250ml', '400ml', '500ml', '600ml', '800ml', '1L', '5L', '1Kg'];

const FarmerReturns: React.FC = () => {
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentReturn, setCurrentReturn] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setFarmers(dataService.getFarmers());
    setProducts(dataService.getProducts());
  };

  const filteredFarmers = farmers.filter((farmer: any) =>
    farmer.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    farmer.village.toLowerCase().includes(farmerSearch.toLowerCase()) ||
    farmer.mobile.includes(farmerSearch)
  );

  const filteredProducts = products.filter((product: any) =>
    product.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.hsn.includes(productSearch)
  );

  const addProductToReturn = (product: any) => {
    if (returnItems.find(item => item.productId === product.id)) {
      alert('Product already added to return');
      return;
    }
    const newItem = {
      productId: product.id,
      productName: product.productName,
      hsn: product.hsn,
      batchNo: product.batchNo,
      size: product.size,
      quantity: '',
      rate: product.rate,
      stockInHand: product.stockInHand
    };
    setReturnItems([...returnItems, newItem]);
  };

  const updateReturnItem = (index: number, field: string, value: any) => {
    const updatedItems = [...returnItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setReturnItems(updatedItems);
  };

  const removeReturnItem = (index: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const calculateReturnTotal = () => {
    return returnItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const saveReturn = () => {
    if (!selectedFarmer) { alert('Please select a farmer'); return; }
    if (returnItems.length === 0) { alert('Please add at least one product'); return; }
    for (const item of returnItems) {
      if (!item.quantity || item.quantity <= 0) {
        alert(`Please enter quantity for ${item.productName}`);
        return;
      }
    }
    const returnTotal = calculateReturnTotal();
    const returnBill = { farmer: selectedFarmer, items: returnItems, total: returnTotal, reason: returnReason, type: 'return' };
    const savedReturn = dataService.addReturn(returnBill);
    setCurrentReturn(savedReturn);
    setShowInvoice(true);
    setSelectedFarmer(null);
    setReturnItems([]);
    setReturnReason('');
    loadData();
  };

  const saveAsPDF = async () => {
    if (!currentReturn) return;
    setIsGeneratingPDF(true);
    const element = document.getElementById('return-invoice-content');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Return-${currentReturn.returnNo}-${currentReturn.farmer.name}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  /** NEW: Delete and Edit Handlers **/
  const handleDeleteReturn = (returnNo: string) => {
    if (window.confirm("Are you sure you want to delete this return bill?")) {
      dataService.deleteReturn(returnNo);
      setShowInvoice(false);
      setCurrentReturn(null);
      loadData();
    }
  };

  const handleEditReturn = (returnData: any) => {
    setSelectedFarmer(returnData.farmer);
    setReturnItems(returnData.items);
    setReturnReason(returnData.reason);
    setShowInvoice(false);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  if (showInvoice && currentReturn) {
    return (
      <div className="space-y-6">
        {/* Invoice Preview */}
        <div id="return-invoice-content" className="bg-white p-8 rounded-2xl shadow-sm">
          <h1 className="text-3xl font-bold mb-4">RETURN BILL</h1>
          <p>Return No: {currentReturn.returnNo}</p>
          <p>Farmer: {currentReturn.farmer.name}</p>
          <p>Date: {formatDate(currentReturn.date)}</p>
          <p>Time: {formatTime(currentReturn.date)}</p>
          <table className="w-full text-sm mt-4 border">
            <thead>
              <tr className="border-b">
                <th>Product</th><th>Batch</th><th>Size</th><th>Qty</th><th>Rate</th><th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {currentReturn.items.map((item: any, index: number) => (
                <tr key={index} className="border-b">
                  <td>{item.productName}</td>
                  <td>{item.batchNo}</td>
                  <td>{item.size}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.rate)}</td>
                  <td>{formatCurrency(item.quantity * item.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 font-bold">Return Total: {formatCurrency(currentReturn.total)}</p>
        </div>

        {/* Invoice Action Buttons */}
        <div className="flex space-x-4">
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded">Print</button>
          <button onClick={saveAsPDF} disabled={isGeneratingPDF} className="bg-purple-600 text-white px-4 py-2 rounded">{isGeneratingPDF ? 'Generating...' : 'Save as PDF'}</button>
          <button onClick={() => setShowInvoice(false)} className="bg-gray-600 text-white px-4 py-2 rounded">Close</button>

          {/* NEW: Edit & Delete */}
          <button onClick={() => handleEditReturn(currentReturn)} className="bg-yellow-600 text-white px-4 py-2 rounded">Edit</button>
          <button onClick={() => handleDeleteReturn(currentReturn.returnNo)} className="bg-red-600 text-white px-4 py-2 rounded">Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Farmer Returns Form */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Farmer Returns</h1>
        <button onClick={saveReturn} className="bg-emerald-600 text-white px-4 py-2 rounded flex items-center space-x-2">
          <Save className="w-4 h-4" /><span>Process Return</span>
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Farmer Selection */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="font-semibold mb-4">Select Farmer</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"/>
              <input type="text" value={farmerSearch} onChange={(e) => setFarmerSearch(e.target.value)} placeholder="Search farmers..." className="w-full pl-10 py-2 border rounded"/>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filteredFarmers.map((farmer: any) => (
                <div key={farmer.id} className={`p-3 border rounded mb-2 cursor-pointer ${selectedFarmer?.id === farmer.id ? 'bg-emerald-50 border-emerald-500' : 'border-gray-200'}`} onClick={() => setSelectedFarmer(farmer)}>
                  <div className="flex items-center space-x-3">
                    <input type="radio" checked={selectedFarmer?.id === farmer.id} onChange={() => setSelectedFarmer(farmer)} />
                    <div>
                      <p>{farmer.name}</p>
                      <p className="text-sm text-gray-600">{farmer.village} • {farmer.mobile}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Product Selection */}
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="font-semibold mb-4">Add Products to Return</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"/>
              <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 py-2 border rounded"/>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredProducts.map((product: any) => (
                <div key={product.id} className="p-3 border rounded cursor-pointer flex justify-between items-center" onClick={() => addProductToReturn(product)}>
                  <div>
                    <p>{product.productName}</p>
                    <p className="text-sm">{product.size} • Rate: {formatCurrency(product.rate)} • Stock: {product.stockInHand}</p>
                  </div>
                  <Plus className="text-emerald-600 w-5 h-5"/>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="font-semibold mb-4">Return Items</h2>
            {returnItems.length === 0 ? <p className="text-gray-500 text-center py-8">No items added</p> :
              <div className="space-y-4">
                {returnItems.map((item, index) => (
                  <div key={index} className="border p-4 rounded">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p>{item.productName}</p>
                        <p className="text-sm text-gray-600">{item.batchNo}</p>
                      </div>
                      <button onClick={() => removeReturnItem(index)} className="text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs mb-1">Size</label>
                        <select value={item.size} onChange={(e) => updateReturnItem(index, 'size', e.target.value)} className="w-full px-2 py-1 border rounded">
                          {ALLOWED_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs mb-1">Quantity</label>
                        <input type="number" min="1" value={item.quantity} onChange={(e) => updateReturnItem(index, 'quantity', parseInt(e.target.value) || '')} className="w-full px-2 py-1 border rounded"/>
                      </div>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Line Total:</span>
                      <span>{formatCurrency(item.quantity * item.rate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h2 className="font-semibold mb-4">Return Summary</h2>
            <div className="flex justify-between border-t pt-3">
              <span>Return Total:</span>
              <span className="text-red-600 font-semibold">{formatCurrency(calculateReturnTotal())}</span>
            </div>
            <div className="mt-4">
              <label className="block mb-2">Return Reason</label>
              <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerReturns;
