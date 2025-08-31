import React, { useState, useEffect } from 'react';
import { Search, Plus, Printer, Save, X, Edit2, Trash2, Download, FileDown } from 'lucide-react';
import { dataService } from '../services/dataService.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ALLOWED_SIZES = ['50ml', '100ml', '120ml', '150ml', '200ml', '250ml', '400ml', '500ml', '600ml', '800ml', '1L', '5L', '1Kg'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Credit'];

const Billing: React.FC = () => {
  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('0');
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentBill, setCurrentBill] = useState(null);
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

  const calculateLineTotal = (item: any) => {
    const subtotal = (item.quantity * item.rate) - item.discount;
    const cgstAmount = (subtotal * item.cgst) / 100;
    const sgstAmount = (subtotal * item.sgst) / 100;
    return subtotal + cgstAmount + sgstAmount;
  };

  const addProductToBill = (product: any) => {
    if (billItems.find(item => item.productId === product.id)) {
      alert('Product already added to bill');
      return;
    }

    const newItem = {
      productId: product.id,
      productName: product.productName,
      hsn: product.hsn,
      batchNo: product.batchNo,
      mnfDate: product.mnfDate,
      expDate: product.expDate,
      size: product.size,
      quantity: '',
      rate: product.rate,
      discount: 0,
      cgst: 0,
      sgst: 0,
      stockInHand: product.stockInHand
    };

    setBillItems([...billItems, newItem]);
  };

  const updateBillItem = (index: number, field: string, value: any) => {
    const updatedItems = [...billItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setBillItems(updatedItems);
  };

  const removeBillItem = (index: number) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => {
      return sum + ((item.quantity * item.rate) - item.discount);
    }, 0);

    const totalCGST = billItems.reduce((sum, item) => {
      const itemSubtotal = (item.quantity * item.rate) - item.discount;
      return sum + (itemSubtotal * item.cgst) / 100;
    }, 0);

    const totalSGST = billItems.reduce((sum, item) => {
      const itemSubtotal = (item.quantity * item.rate) - item.discount;
      return sum + (itemSubtotal * item.sgst) / 100;
    }, 0);

    const total = subtotal + totalCGST + totalSGST;
    const outstanding = total - amountPaid;

    return { subtotal, totalCGST, totalSGST, total, outstanding };
  };

  const saveBill = () => {
    if (!selectedFarmer) {
      alert('Please select a farmer');
      return;
    }

    if (billItems.length === 0) {
      alert('Please add at least one product');
      return;
    }

    // Validate that all items have quantity
    for (const item of billItems) {
      if (!item.quantity || item.quantity <= 0) {
        alert(`Please enter quantity for ${item.productName}`);
        return;
      }
    }

    // Validate stock
    for (const item of billItems) {
      if (item.quantity > item.stockInHand) {
        alert(`Insufficient stock for ${item.productName}. Available: ${item.stockInHand}`);
        return;
      }
    }

    const totals = calculateTotals();
    const bill = {
      farmer: selectedFarmer,
      items: billItems,
      paymentMode,
      amountPaid: parseFloat(amountPaid) || 0,
      ...totals
    };

    const savedBill = dataService.addBill(bill);
    setCurrentBill(savedBill);
    setShowInvoice(true);

    // Reset form
    setSelectedFarmer(null);
    setBillItems([]);
    setAmountPaid('0');
    loadData(); // Refresh data to show updated stock
  };

  const printInvoice = () => {
    window.print();
  };

  const saveAsPDF = async () => {
    if (!currentBill) return;
    
    setIsGeneratingPDF(true);
    
    const element = document.getElementById('invoice-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
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
      
      pdf.save(`Bill-${currentBill.billNo}-${currentBill.farmer.name}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const totals = calculateTotals();

  if (showInvoice && currentBill) {
    return (
      <div className="space-y-6">
        {/* Invoice Header */}
        <div className="flex justify-between items-center no-print">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Preview</h1>
          <div className="flex space-x-4">
            <button
              onClick={printInvoice}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={saveAsPDF}
              disabled={isGeneratingPDF}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isGeneratingPDF ? 'Generating...' : 'Save as PDF'}</span>
            </button>
            <button
              onClick={() => setShowInvoice(false)}
              className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Invoice */}
        <div id="invoice-content" className="bg-white p-8 rounded-2xl shadow-sm print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-between items-start mb-2">
              <div className="text-left">
                <p className="text-sm">GST.No. 37CZCPM6609Q1ZN</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">Cash - Bill</p>
              </div>
              <div className="text-right">
                <p className="text-sm">Cell: 9030630081</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <div className="text-left">
                <p className="text-sm">P.L No : SRI SAI RYTHU DEPOT</p>
              </div>
              <div className="text-right">
                <p className="text-sm">Date: {formatDate(currentBill.date)}</p>
                <p className="text-sm">Time: {formatTime(currentBill.date)}</p>
              </div>
            </div>

            <p className="text-lg font-bold mb-2">FARMER COPY</p>
            <p className="text-xs mb-4">
              Address: D NO 8-190, Chalivendram, Vaddigunta Kandriga, Naidupeta Md., Tirupati Dt., AP ,524421
            </p>
          </div>

          {/* Bill Details */}
          <div className="mb-6">
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-sm"><strong>Bill No:</strong> {currentBill.billNo}</p>
                <p className="text-sm"><strong>To:</strong> {currentBill.farmer.name}</p>
                <p className="text-sm">{currentBill.farmer.village}, {currentBill.farmer.mandal}</p>
                <p className="text-sm">Mobile: {currentBill.farmer.mobile}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs mb-6">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Product</th>
                <th className="text-left py-2">Batch</th>
                <th className="text-left py-2">Size</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Rate</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {currentBill.items.map((item: any, index: number) => (
                <tr key={index} className="border-b">
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2">{item.batchNo}</td>
                  <td className="py-2">{item.size}</td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">{formatCurrency(item.rate)}</td>
                  <td className="text-right py-2">{formatCurrency(calculateLineTotal(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-1">
                <span className="text-sm">Subtotal:</span>
                <span className="text-sm">{formatCurrency(currentBill.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm">CGST:</span>
                <span className="text-sm">{formatCurrency(currentBill.totalCGST)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm">SGST:</span>
                <span className="text-sm">{formatCurrency(currentBill.totalSGST)}</span>
              </div>
              <div className="flex justify-between py-2 border-t font-bold">
                <span>Total:</span>
                <span>{formatCurrency(currentBill.total)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm">Paid:</span>
                <span className="text-sm">{formatCurrency(currentBill.amountPaid)}</span>
              </div>
              {currentBill.outstanding > 0 && (
                <div className="flex justify-between py-1 text-red-600">
                  <span className="text-sm">Outstanding:</span>
                  <span className="text-sm">{formatCurrency(currentBill.outstanding)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs mt-8">
            <p className="mb-2">పురుగు మందులు కొన్న తరువాత తిరిగి తీసుకోబడవు</p>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">New Bill</h1>
        <div className="flex space-x-4">
          <button
            disabled
            className="flex items-center space-x-2 bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={saveBill}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            <Save className="w-4 h-4" />
            <span>Save Bill</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Farmer & Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Select Farmer */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Farmer</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search farmers..."
                value={farmerSearch}
                onChange={(e) => setFarmerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredFarmers.map((farmer: any) => (
                <div
                  key={farmer.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedFarmer?.id === farmer.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                  onClick={() => setSelectedFarmer(farmer)}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={selectedFarmer?.id === farmer.id}
                      onChange={() => setSelectedFarmer(farmer)}
                      className="text-emerald-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{farmer.name}</p>
                      <p className="text-sm text-gray-600">{farmer.village} • {farmer.mobile}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Products */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Products</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredProducts.map((product: any) => (
                <div
                  key={product.id}
                  className="p-3 rounded-lg border border-gray-200 hover:border-emerald-300 cursor-pointer"
                  onClick={() => addProductToBill(product)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{product.productName}</p>
                      <p className="text-sm text-gray-600">
                        {product.size} • Rate: {formatCurrency(product.rate)} • Stock: {product.stockInHand}
                      </p>
                    </div>
                    <Plus className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Bill Summary */}
        <div className="space-y-6">
          {/* Bill Items */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill Items</h2>
            
            {billItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items added</p>
            ) : (
              <div className="space-y-4">
                {billItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">{item.batchNo}</p>
                      </div>
                      <button
                        onClick={() => removeBillItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                        <select
                          value={item.size}
                          onChange={(e) => updateBillItem(index, 'size', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                        >
                          {ALLOWED_SIZES.map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          max={item.stockInHand}
                          value={item.quantity}
                          onChange={(e) => updateBillItem(index, 'quantity', parseInt(e.target.value) || '')}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Rate</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateBillItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Discount</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => updateBillItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Line Total:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(calculateLineTotal(item))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Summary</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CGST:</span>
                <span className="font-medium">{formatCurrency(totals.totalCGST)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SGST:</span>
                <span className="font-medium">{formatCurrency(totals.totalSGST)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-semibold">{formatCurrency(totals.total)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  {PAYMENT_MODES.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totals.total}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="Enter amount paid"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              {(totals.total - (parseFloat(amountPaid) || 0)) > 0 && (
                <div className="flex justify-between pt-3 border-t border-gray-200 text-red-600">
                  <span className="font-medium">Outstanding:</span>
                  <span className="font-medium">{formatCurrency(totals.total - (parseFloat(amountPaid) || 0))}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;