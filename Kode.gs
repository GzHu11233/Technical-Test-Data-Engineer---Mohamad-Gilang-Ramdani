const SPREADSHEET_ID = '1Ll0TD_xlCVCLxMuUCthcnn_fqsyxlLVe31GS8LBotvI'; //ID SPREADSHEET

let cache = {};

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Dashboard Penjualan')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ================== UTILITY ==================
function parseNumber(value) {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  let str = String(value).replace(/Rp\s?/g, '').replace(/\./g, '').replace(/,/g, '.');
  let num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  // Format DD/MM/YYYY
  let parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return null;
}

// ================== BACA DATA STAGING ==================
function getStagingData() {
  if (cache.stg_sales) return cache.stg_sales;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('stg_sales');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  // Bersihkan spasi pada header
  const headers = rows[0].map(h => String(h).trim());
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    let obj = {};
    headers.forEach((h, idx) => { obj[h] = row[idx]; });
    // Konversi numerik
    obj.Qty = parseNumber(obj.Qty);
    obj['Harga (+)'] = parseNumber(obj['Harga (+)']);
    obj['Harga Unit(Mu)'] = parseNumber(obj['Harga Unit(Mu)']);
    obj['Total(MU)'] = parseNumber(obj['Total(MU)']);
    obj['Disc. 1 (%)'] = parseNumber(obj['Disc. 1 (%)']);
    obj['Disc. 1 (MU)'] = parseNumber(obj['Disc. 1 (MU)']);
    obj['Disc. 2 (%)'] = parseNumber(obj['Disc. 2 (%)']);
    obj['Disc. 2 (MU)'] = parseNumber(obj['Disc. 2 (MU)']);
    obj['Disc. 3 (%)'] = parseNumber(obj['Disc. 3 (%)']);
    obj['Disc. 3 (MU)'] = parseNumber(obj['Disc. 3 (MU)']);
    obj['Disc. 4 (MU)'] = parseNumber(obj['Disc. 4 (MU)']);
    obj['Disc. 5 (%)'] = parseNumber(obj['Disc. 5 (%)']);
    obj['Disc. 5 (MU)'] = parseNumber(obj['Disc. 5 (MU)']);
    obj['Disc. 6 (MU)'] = parseNumber(obj['Disc. 6 (MU)']);
    obj['Subtot Disc(Mu)'] = parseNumber(obj['Subtot Disc(Mu)']);
    obj['Subtot(Mu)'] = parseNumber(obj['Subtot(Mu)']);
    obj['Hrg Unit Riil(Mu)'] = parseNumber(obj['Hrg Unit Riil(Mu)']);
    obj['Total Riil(Mu)'] = parseNumber(obj['Total Riil(Mu)']);
    obj['Subtot Disc Riil(Mu)'] = parseNumber(obj['Subtot Disc Riil(Mu)']);
    obj['Subtot Riil(Mu)'] = parseNumber(obj['Subtot Riil(Mu)']);
    obj['Disc Akh(Mu)'] = parseNumber(obj['Disc Akh(Mu)']);
    obj['Subtot Net(Mu)'] = parseNumber(obj['Subtot Net(Mu)']);
    obj['Pjk(Mu)'] = parseNumber(obj['Pjk(Mu)']);
    obj['Subtot Net Pjk(Mu)'] = parseNumber(obj['Subtot Net Pjk(Mu)']);
    // Parse tanggal
    obj.tanggal = parseDate(obj['Tgl Ref']);
    obj.tahun = obj.tanggal ? obj.tanggal.getFullYear() : null;
    obj.bulan = obj.tanggal ? obj.tanggal.getMonth() + 1 : null;
    obj.hari = obj.tanggal ? obj.tanggal.getDay() : null; // 0 Minggu, 6 Sabtu
    obj.tanggalStr = obj.tanggal ? Utilities.formatDate(obj.tanggal, Session.getScriptTimeZone(), 'yyyy-MM-dd') : null;
    data.push(obj);
  }
  cache.stg_sales = data;
  return data;
}

// ================== FILTER OPTIONS ==================
function getFilterOptions() {
  const data = getStagingData();
  const tahun = [...new Set(data.map(d => d.tahun).filter(Boolean))].sort();
  const kota = [...new Set(data.map(d => d['Nama Kota']).filter(Boolean))].sort();
  const salesman = [...new Set(data.map(d => d['Nama Sales']).filter(Boolean))].sort();
  const produk = [...new Set(data.map(d => d['Kode Barang']).filter(Boolean))].sort();
  return { tahun, kota, salesman, produk };
}

// ================== DASHBOARD DATA ==================
function getDashboardData(filters) {
  const data = getStagingData();
  
  // Terapkan filter
  let filtered = data;
  if (filters.tahun) filtered = filtered.filter(d => d.tahun == filters.tahun);
  if (filters.kota) filtered = filtered.filter(d => d['Nama Kota'] == filters.kota);
  if (filters.salesman) filtered = filtered.filter(d => d['Nama Sales'] == filters.salesman);
  if (filters.produk) filtered = filtered.filter(d => d['Kode Barang'] == filters.produk);
  
  // ========== TIME ANALYSIS ==========
  // KPI
  const totalQty = filtered.reduce((sum, d) => sum + d.Qty, 0);
  const totalRevenue = filtered.reduce((sum, d) => sum + d['Total(MU)'], 0);
  const transactionCount = filtered.length; // setiap baris = 1 transaksi
  
  // Monthly revenue
  const monthlyMap = new Map();
  filtered.forEach(d => {
    if (d.tahun && d.bulan) {
      const key = `${d.tahun}-${d.bulan}`;
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + d['Total(MU)']);
    }
  });
  const bulanIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyData = Array.from(monthlyMap.entries())
    .map(([key, val]) => {
      const [th, bl] = key.split('-');
      return { bulan: bulanIndo[parseInt(bl)-1] + ' ' + th, revenue: val };
    })
    .sort((a,b) => a.bulan.localeCompare(b.bulan));
  
  // Weekday vs Weekend
  let weekday = 0, weekend = 0;
  filtered.forEach(d => {
    if (d.hari === 0 || d.hari === 6) weekend += d['Total(MU)'];
    else weekday += d['Total(MU)'];
  });
  
  // Quarterly revenue
  const quarterRevenue = { Q1:0, Q2:0, Q3:0, Q4:0 };
  filtered.forEach(d => {
    if (d.bulan) {
      if (d.bulan <= 3) quarterRevenue.Q1 += d['Total(MU)'];
      else if (d.bulan <= 6) quarterRevenue.Q2 += d['Total(MU)'];
      else if (d.bulan <= 9) quarterRevenue.Q3 += d['Total(MU)'];
      else quarterRevenue.Q4 += d['Total(MU)'];
    }
  });
  
  // Daily revenue (per hari dalam seminggu)
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dailyRevenue = [0,0,0,0,0,0,0];
  filtered.forEach(d => {
    if (d.hari !== null) dailyRevenue[d.hari] += d['Total(MU)'];
  });
  const dailyData = dayNames.map((name, idx) => ({ hari: name, revenue: dailyRevenue[idx] }));
  
  // Max month revenue
  const maxMonth = monthlyData.reduce((max, m) => m.revenue > max.revenue ? m : max, { revenue: 0, bulan: '' });
  
  // Monthly transaction count (jumlah baris per bulan)
  const monthlyTransMap = new Map();
  filtered.forEach(d => {
    if (d.tahun && d.bulan) {
      const key = `${d.tahun}-${d.bulan}`;
      monthlyTransMap.set(key, (monthlyTransMap.get(key) || 0) + 1);
    }
  });
  const monthlyTransData = Array.from(monthlyTransMap.entries())
    .map(([key, val]) => {
      const [th, bl] = key.split('-');
      return { bulan: bulanIndo[parseInt(bl)-1] + ' ' + th, transaksi: val };
    })
    .sort((a,b) => a.bulan.localeCompare(b.bulan));
  
  // ========== DETAIL TAB ==========
  // Top 5 produk by revenue
  const productRevenueMap = new Map();
  filtered.forEach(d => {
    const kode = d['Kode Barang'] || 'Unknown';
    productRevenueMap.set(kode, (productRevenueMap.get(kode) || 0) + d['Total(MU)']);
  });
  const topProducts = Array.from(productRevenueMap.entries())
    .map(([kode, total]) => ({ kode, total }))
    .sort((a,b) => b.total - a.total)
    .slice(0, 5);
  
  // Top 5 produk by qty
  const productQtyMap = new Map();
  filtered.forEach(d => {
    const kode = d['Kode Barang'] || 'Unknown';
    productQtyMap.set(kode, (productQtyMap.get(kode) || 0) + d.Qty);
  });
  const topProductsQty = Array.from(productQtyMap.entries())
    .map(([kode, qty]) => ({ kode, qty }))
    .sort((a,b) => b.qty - a.qty)
    .slice(0, 5);
  
  // Sales by revenue
  const salesRevenueMap = new Map();
  filtered.forEach(d => {
    const nama = d['Nama Sales'] || 'Unknown';
    salesRevenueMap.set(nama, (salesRevenueMap.get(nama) || 0) + d['Total(MU)']);
  });
  const salesRevenue = Array.from(salesRevenueMap.entries())
    .map(([nama, total]) => ({ nama, total }))
    .sort((a,b) => b.total - a.total);
  
  // Sales by qty
  const salesQtyMap = new Map();
  filtered.forEach(d => {
    const nama = d['Nama Sales'] || 'Unknown';
    salesQtyMap.set(nama, (salesQtyMap.get(nama) || 0) + d.Qty);
  });
  const salesQty = Array.from(salesQtyMap.entries())
    .map(([nama, qty]) => ({ nama, qty }))
    .sort((a,b) => b.qty - a.qty);
  
  // Customer by revenue
  const custRevenueMap = new Map();
  filtered.forEach(d => {
    const nama = d['Nama Cust'] || 'Unknown';
    custRevenueMap.set(nama, (custRevenueMap.get(nama) || 0) + d['Total(MU)']);
  });
  const custRevenue = Array.from(custRevenueMap.entries())
    .map(([nama, total]) => ({ nama, total }))
    .sort((a,b) => b.total - a.total)
    .slice(0, 10);
  
  // Customer by qty
  const custQtyMap = new Map();
  filtered.forEach(d => {
    const nama = d['Nama Cust'] || 'Unknown';
    custQtyMap.set(nama, (custQtyMap.get(nama) || 0) + d.Qty);
  });
  const custQty = Array.from(custQtyMap.entries())
    .map(([nama, qty]) => ({ nama, qty }))
    .sort((a,b) => b.qty - a.qty)
    .slice(0, 10);
  
  // City by revenue
  const cityRevenueMap = new Map();
  filtered.forEach(d => {
    const kota = d['Nama Kota'] || 'Unknown';
    cityRevenueMap.set(kota, (cityRevenueMap.get(kota) || 0) + d['Total(MU)']);
  });
  const cityRevenue = Array.from(cityRevenueMap.entries())
    .map(([kota, total]) => ({ kota, total }))
    .sort((a,b) => b.total - a.total);
  
  // City by qty
  const cityQtyMap = new Map();
  filtered.forEach(d => {
    const kota = d['Nama Kota'] || 'Unknown';
    cityQtyMap.set(kota, (cityQtyMap.get(kota) || 0) + d.Qty);
  });
  const cityQty = Array.from(cityQtyMap.entries())
    .map(([kota, qty]) => ({ kota, qty }))
    .sort((a,b) => b.qty - a.qty);
  
  // ===== Daily revenue per top 5 customers =====
  const allDatesSet = new Set();
  filtered.forEach(d => { if (d.tanggalStr) allDatesSet.add(d.tanggalStr); });
  const allDates = Array.from(allDatesSet).sort();
  
  const custTotal = new Map();
  filtered.forEach(d => {
    if (d['Nama Cust']) custTotal.set(d['Nama Cust'], (custTotal.get(d['Nama Cust']) || 0) + d['Total(MU)']);
  });
  const topCusts = Array.from(custTotal.entries())
    .sort((a,b) => b[1] - a[1])
    .slice(0,5)
    .map(e => e[0]);
  
  const custDailyMap = new Map();
  filtered.forEach(d => {
    if (d['Nama Cust'] && d.tanggalStr) {
      const cust = d['Nama Cust'];
      if (!custDailyMap.has(cust)) custDailyMap.set(cust, new Map());
      custDailyMap.get(cust).set(d.tanggalStr, (custDailyMap.get(cust).get(d.tanggalStr) || 0) + d['Total(MU)']);
    }
  });
  
  const custDailyData = topCusts.map(cust => {
    const dayMap = custDailyMap.get(cust) || new Map();
    const values = allDates.map(date => dayMap.get(date) || 0);
    return { customer: cust, values };
  });
  
  // ===== Discount table rows (berdasarkan Subtot Disc(Mu) > 0) =====
  const discountRows = filtered.filter(d => d['Subtot Disc(Mu)'] > 0).map(d => ({
    nama_cust: d['Nama Cust'] || '-',
    kode_barang: d['Kode Barang'] || '-',
    diskon_rupiah: d['Subtot Disc(Mu)']
  }));
  
  return {
    timeAnalysis: {
      totalQty,
      totalRevenue,
      transactionCount,
      monthlyRevenue: monthlyData,
      weekdayRevenue: { weekday, weekend },
      quarterRevenue,
      dailyRevenue: dailyData,
      monthlyTrans: monthlyTransData,
      maxMonth
    },
    topProducts,
    topProductsQty,
    salesRevenue,
    salesQty,
    custRevenue,
    custQty,
    cityRevenue,
    cityQty,
    allDates,
    custDailyData,
    discountRows
  };
}
