import { seedFarmers, seedProducts, seedBills, seedStockRegister } from '../data/seed.js';

const STORAGE_KEYS = {
  FARMERS: 'depot_farmers',
  PRODUCTS: 'depot_products',
  BILLS: 'depot_bills',
  PAYMENTS: 'depot_payments',
  RETURNS: 'depot_returns',
  STOCK_REGISTER: 'depot_stock_register',
  SETTINGS: 'depot_settings'
};

class DataService {
  constructor() {
    this.initializeData();
    this.lastAction = null;
    this.lastActionTimestamp = null;
  }

  initializeData() {
    if (!localStorage.getItem(STORAGE_KEYS.FARMERS)) {
      this.setFarmers(seedFarmers);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.setProducts(seedProducts);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BILLS)) {
      this.setBills(seedBills);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
      this.setPaymentRecords([]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RETURNS)) {
      this.setReturns([]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_REGISTER)) {
      this.setStockRegister(seedStockRegister);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.setSettings({
        dealerName: 'Sri Sai Rythu Depot',
        lastBillNumber: 0,
        interestRate: 2, // 2% per month
        address: 'D NO 8-190, Chalivendram, Vaddigunta Kandriga, Naidupeta Md., Tirupati Dt., AP ,524421',
        gstNumber: '37CZCPM6609Q1ZN',
        phone: '9030630081'
      });
    }
  }

  // Farmers CRUD
  getFarmers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FARMERS) || '[]');
  }

  setFarmers(farmers) {
    localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(farmers));
  }

  addFarmer(farmer) {
    const farmers = this.getFarmers();
    const newFarmer = { ...farmer, id: Date.now().toString() };
    farmers.push(newFarmer);
    this.setFarmers(farmers);
    this.setLastAction('add_farmer', newFarmer);
    return newFarmer;
  }

  updateFarmer(id, updates) {
    const farmers = this.getFarmers();
    const index = farmers.findIndex(f => f.id === id);
    if (index !== -1) {
      const oldFarmer = { ...farmers[index] };
      farmers[index] = { ...farmers[index], ...updates, lastUpdated: new Date().toISOString() };
      this.setFarmers(farmers);
      this.setLastAction('update_farmer', { old: oldFarmer, new: farmers[index] });
      return farmers[index];
    }
    return null;
  }

  deleteFarmer(id) {
    const farmers = this.getFarmers();
    const index = farmers.findIndex(f => f.id === id);
    if (index !== -1) {
      const deletedFarmer = farmers[index];
      farmers.splice(index, 1);
      this.setFarmers(farmers);
      this.setLastAction('delete_farmer', deletedFarmer);
      return deletedFarmer;
    }
    return null;
  }

  // Payment Records
  getPaymentRecords() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS) || '[]');
  }

  setPaymentRecords(payments) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }

  addPaymentRecord(payment) {
    const payments = this.getPaymentRecords();
    payments.push(payment);
    this.setPaymentRecords(payments);
    return payment;
  }

  // Returns
  getReturns() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RETURNS) || '[]');
  }

  setReturns(returns) {
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));
  }

  addReturn(returnBill) {
    const returns = this.getReturns();
    const settings = this.getSettings();
    const newReturnNumber = (settings.lastReturnNumber || 0) + 1;
    
    const newReturn = {
      ...returnBill,
      id: Date.now().toString(),
      returnNo: newReturnNumber,
      date: new Date().toISOString()
    };
    
    returns.push(newReturn);
    this.setReturns(returns);
    
    // Update return number
    this.updateSettings({ lastReturnNumber: newReturnNumber });
    
    // Update product stocks (add back returned quantity)
    returnBill.items.forEach(item => {
      const products = this.getProducts();
      const productIndex = products.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        products[productIndex].stockInHand += item.quantity;
        this.setProducts(products);
      }
    });
    
    this.setLastAction('add_return', newReturn);
    return newReturn;
  }

  // Products CRUD
  getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
  }

  setProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  addProduct(product) {
    const products = this.getProducts();
    const newProduct = { ...product, id: Date.now().toString() };
    products.push(newProduct);
    this.setProducts(products);
    this.setLastAction('add_product', newProduct);
    return newProduct;
  }

  updateProduct(id, updates) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      const oldProduct = { ...products[index] };
      products[index] = { ...products[index], ...updates };
      this.setProducts(products);
      this.setLastAction('update_product', { old: oldProduct, new: products[index] });
      return products[index];
    }
    return null;
  }

  deleteProduct(id) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      const deletedProduct = products[index];
      products.splice(index, 1);
      this.setProducts(products);
      this.setLastAction('delete_product', deletedProduct);
      return deletedProduct;
    }
    return null;
  }

  updateProductStock(id, quantity) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index].stockInHand = Math.max(0, products[index].stockInHand - quantity);
      this.setProducts(products);
      return products[index];
    }
    return null;
  }

  // Bills CRUD
  getBills() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLS) || '[]');
  }
  getBillById(id) {
  const bills = this.getBills();
  return bills.find(b => b.id === id) || null;
}

getBillByNumber(billNo) {
  const bills = this.getBills();
  return bills.find(b => b.billNo === billNo) || null;
}


  setBills(bills) {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  }

  addBill(bill) {
    const bills = this.getBills();
    const settings = this.getSettings();
    const newBillNumber = settings.lastBillNumber + 1;
    
    const paidAmount = parseFloat(bill.amountPaid) || 0;
    
    const newBill = {
      ...bill,
      id: Date.now().toString(),
      billNo: newBillNumber,
      date: new Date().toISOString(),
      amountPaid: paidAmount,
      status: paidAmount >= bill.total ? 'paid' : paidAmount > 0 ? 'partial' : 'pending'
    };
    
    bills.push(newBill);
    this.setBills(bills);
    
    // Update bill number
    this.updateSettings({ lastBillNumber: newBillNumber });
    
    // Update product stocks
    bill.items.forEach(item => {
      this.updateProductStock(item.productId, item.quantity);
    });
    
    // Add to stock register
    bill.items.forEach(item => {
      this.addToStockRegister({
        dateOfReceipt: new Date().toISOString().split('T')[0],
        supplier: 'Sale',
        insecticideName: item.productName,
        batchNo: item.batchNo,
        mnfDate: item.mnfDate,
        expDate: item.expDate,
        qtyReceived: 0,
        qtyInHand: item.stockInHand - item.quantity,
        total: item.stockInHand,
        sold: item.quantity,
        balance: item.stockInHand - item.quantity,
        billNoDate: `${newBillNumber} / ${new Date().toLocaleDateString()}`,
        purchaserName: bill.farmer.name,
        purchaserSignature: '',
        remarks: 'Sale'
      });
    });
    
    this.setLastAction('add_bill', newBill);
    return newBill;
  }

  updateBill(id, updates) {
    const bills = this.getBills();
    const index = bills.findIndex(b => b.id === id);
    if (index !== -1) {
      const oldBill = { ...bills[index] };
      bills[index] = { ...bills[index], ...updates };
      this.setBills(bills);
      this.setLastAction('update_bill', { old: oldBill, new: bills[index] });
      return bills[index];
    }
    return null;
  }

  deleteBill(id) {
    const bills = this.getBills();
    const index = bills.findIndex(b => b.id === id);
    if (index !== -1) {
      const deletedBill = bills[index];
      bills.splice(index, 1);
      this.setBills(bills);
      this.setLastAction('delete_bill', deletedBill);
      return deletedBill;
    }
    return null;
  }

  // Stock Register
  getStockRegister() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STOCK_REGISTER) || '[]');
  }

  setStockRegister(stockRegister) {
    localStorage.setItem(STORAGE_KEYS.STOCK_REGISTER, JSON.stringify(stockRegister));
  }

  addToStockRegister(entry) {
    const stockRegister = this.getStockRegister();
    const newEntry = {
      ...entry,
      id: Date.now().toString(),
      slNo: stockRegister.length + 1
    };
    stockRegister.push(newEntry);
    this.setStockRegister(stockRegister);
    return newEntry;
  }

  updateStockRegisterEntry(id, updates) {
    const stockRegister = this.getStockRegister();
    const index = stockRegister.findIndex(s => s.id === id);
    if (index !== -1) {
      stockRegister[index] = { ...stockRegister[index], ...updates };
      this.setStockRegister(stockRegister);
      return stockRegister[index];
    }
    return null;
  }

  // Settings
  getSettings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
  }

  setSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  updateSettings(updates) {
    const settings = this.getSettings();
    const newSettings = { ...settings, ...updates };
    this.setSettings(newSettings);
    return newSettings;
  }

  // Analytics
  getTodaysSales() {
    const bills = this.getBills();
    const today = new Date().toISOString().split('T')[0];
    return bills.filter(bill => bill.date.split('T')[0] === today);
  }

  getMonthlySales() {
    const bills = this.getBills();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return bills.filter(bill => {
      const billDate = new Date(bill.date);
      return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
    });
  }

  getOutstandingBills() {
    const bills = this.getBills();
    return bills.filter(bill => bill.status === 'pending' || bill.status === 'partial');
  }

  calculateInterest(bill) {
    // Default interest: ₹100 principal → ₹2 interest per month (2%)
    const interestRate = 2; // 2% per month
    const principal = bill.total - bill.amountPaid;
    
    if (principal <= 0) return 0;
    
    const startDate = new Date(bill.lastUpdated || bill.date);
    const currentDate = new Date();
    
    // Calculate months difference
    const timeDiff = currentDate.getTime() - startDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    const monthsDiff = daysDiff / 30; // Convert days to months
    
    if (monthsDiff <= 0) return 0;
    
    return (principal * interestRate * monthsDiff) / 100;
  }

  deleteStockRegisterEntry(id) {
    const stockRegister = this.getStockRegister();
    const index = stockRegister.findIndex(s => s.id === id);
    if (index !== -1) {
      const deletedEntry = stockRegister[index];
      stockRegister.splice(index, 1);
      
      // Renumber remaining entries
      stockRegister.forEach((entry, idx) => {
        entry.slNo = idx + 1;
      });
      
      this.setStockRegister(stockRegister);
      this.setLastAction('delete_stock_entry', deletedEntry);
      return deletedEntry;
    }
    return null;
  }

  calculateInterestForDate(bill, targetDate) {
    // Calculate interest from last updated date to specific target date
    const interestRate = 2; // 2% per month
    const principal = bill.total - bill.amountPaid;
    
    if (principal <= 0) return 0;
    
    const startDate = new Date(bill.lastUpdated || bill.date);
    const endDate = new Date(targetDate);
    
    // Calculate days difference and convert to months
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    const monthsDiff = daysDiff / 30;
    
    if (monthsDiff <= 0) return 0;
    
    return (principal * interestRate * monthsDiff) / 100;
  }

  calculateDailyInterest(bill) {
    // Calculate daily interest: 2% per month = 0.067% per day approximately
    const interestRate = 2; // 2% per month
    const principal = bill.total - bill.amountPaid;
    
    if (principal <= 0) return 0;
    
    const startDate = new Date(bill.lastUpdated || bill.date);
    const currentDate = new Date();
    
    // Calculate days difference
    const timeDiff = currentDate.getTime() - startDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff <= 0) return 0;
    
    // Daily interest = (monthly rate / 30 days)
    const dailyRate = interestRate / 30;
    return (principal * dailyRate * daysDiff) / 100;
  }

  // Undo functionality
  setLastAction(type, data) {
    this.lastAction = { type, data };
    this.lastActionTimestamp = Date.now();
  }

  undoLastAction() {
    if (!this.lastAction || (Date.now() - this.lastActionTimestamp > 10000)) {
      return false; // No action to undo or expired
    }

    const { type, data } = this.lastAction;
    
    switch (type) {
      case 'add_farmer':
        this.deleteFarmer(data.id);
        break;
      case 'delete_farmer':
        const farmers = this.getFarmers();
        farmers.push(data);
        this.setFarmers(farmers);
        break;
      case 'update_farmer':
        this.updateFarmer(data.new.id, data.old);
        break;
      case 'add_product':
        this.deleteProduct(data.id);
        break;
      case 'delete_product':
        const products = this.getProducts();
        products.push(data);
        this.setProducts(products);
        break;
      case 'update_product':
        this.updateProduct(data.new.id, data.old);
        break;
      case 'delete_stock_entry':
        const stockRegister = this.getStockRegister();
        stockRegister.push(data);
        this.setStockRegister(stockRegister);
        break;
      // Similar cases for products and bills
      default:
        return false;
    }

    this.lastAction = null;
    this.lastActionTimestamp = null;
    return true;
  }
}

export const dataService = new DataService();