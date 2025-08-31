export const seedFarmers = [
  {
    id: '1',
    name: 'Ravi Kumar',
    fatherName: 'Subba Rao',
    village: 'Chalivendram',
    mandal: 'Naidupeta',
    district: 'Tirupati',
    pin: '524421',
    mobile: '9876543210',
    balance: 2500,
    lastUpdated: '2024-12-01T00:00:00.000Z'
  },
  {
    id: '2',
    name: 'Lakshmi Devi',
    fatherName: 'Krishna Murthy',
    village: 'Vaddigunta Kandriga',
    mandal: 'Naidupeta',
    district: 'Tirupati',
    pin: '524421',
    mobile: '8765432109',
    balance: 1800,
    lastUpdated: '2024-11-15T00:00:00.000Z'
  },
  {
    id: '3',
    name: 'Suresh Babu',
    fatherName: 'Rama Rao',
    village: 'Pellakuru',
    mandal: 'Naidupeta',
    district: 'Tirupati',
    pin: '524421',
    mobile: '7654321098',
    balance: 0,
    lastUpdated: '2024-12-20T00:00:00.000Z'
  },
  {
    id: '4',
    name: 'Anitha Reddy',
    fatherName: 'Venkat Reddy',
    village: 'Chittoor',
    mandal: 'Chittoor',
    district: 'Chittoor',
    pin: '517001',
    mobile: '6543210987',
    balance: 3200,
    lastUpdated: '2024-10-30T00:00:00.000Z'
  },
  {
    id: '5',
    name: 'Manjula',
    fatherName: 'Narayana',
    village: 'Tirupati',
    mandal: 'Tirupati',
    district: 'Tirupati',
    pin: '517501',
    mobile: '5432109876',
    balance: 900,
    lastUpdated: '2024-11-20T00:00:00.000Z'
  }
];

export const seedProducts = [
  {
    id: '1',
    hsn: '38089100',
    productName: 'Monocrotophos 36% SL',
    batchNo: 'MCR2024001',
    mnfDate: '2024-01-15',
    expDate: '2026-01-15',
    quantity: '',
    size: '250ml',
    rate: 85,
    discount: 5,
    cgst: 0,
    sgst: 0,
    amount: 91.8,
    stockInHand: 120
  },
  {
    id: '2',
    productName: 'Chlorpyriphos 20% EC',
    hsn: '38089200',
    batchNo: 'CPF2024002',
    mnfDate: '2024-02-10',
    expDate: '2026-02-10',
    quantity: '',
    size: '500ml',
    rate: 180,
    discount: 10,
    cgst: 0,
    sgst: 0,
    amount: 201.96,
    stockInHand: 85
  },
  {
    id: '3',
    productName: 'Imidacloprid 17.8% SL',
    hsn: '38089300',
    batchNo: 'IMD2024003',
    mnfDate: '2024-01-20',
    expDate: '2026-01-20',
    quantity: '',
    size: '100ml',
    rate: 45,
    discount: 2,
    cgst: 0,
    sgst: 0,
    amount: 50.94,
    stockInHand: 200
  },
  {
    id: '4',
    productName: 'Lambda Cyhalothrin 5% EC',
    hsn: '38089400',
    batchNo: 'LCH2024004',
    mnfDate: '2024-03-05',
    expDate: '2026-03-05',
    quantity: '',
    size: '50ml',
    rate: 35,
    discount: 0,
    cgst: 0,
    sgst: 0,
    amount: 41.30,
    stockInHand: 150
  },
  {
    id: '5',
    productName: 'Profenofos 50% EC',
    hsn: '38089500',
    batchNo: 'PRF2024005',
    mnfDate: '2024-02-28',
    expDate: '2026-02-28',
    quantity: '',
    size: '1L',
    rate: 320,
    discount: 15,
    cgst: 0,
    sgst: 0,
    amount: 362.02,
    stockInHand: 75
  }
];

export const seedBills = [];

export const seedStockRegister = [
  {
    id: '1',
    slNo: 1,
    dateOfReceipt: '2024-12-01',
    supplier: 'Bayer CropScience',
    insecticideName: 'Monocrotophos 36% SL',
    batchNo: 'MCR2024001',
    mnfDate: '2024-01-15',
    expDate: '2026-01-15',
    qtyReceived: 200,
    qtyInHand: 120,
    total: 200,
    sold: 80,
    balance: 120,
    billNoDate: '',
    purchaserName: '',
    purchaserSignature: '',
    remarks: 'Opening Stock'
  },
  {
    id: '2',
    slNo: 2,
    dateOfReceipt: '2024-12-01',
    supplier: 'Tata Rallis',
    insecticideName: 'Chlorpyriphos 20% EC',
    batchNo: 'CPF2024002',
    mnfDate: '2024-02-10',
    expDate: '2026-02-10',
    qtyReceived: 120,
    qtyInHand: 85,
    total: 120,
    sold: 35,
    balance: 85,
    billNoDate: '',
    purchaserName: '',
    purchaserSignature: '',
    remarks: 'Opening Stock'
  }
];