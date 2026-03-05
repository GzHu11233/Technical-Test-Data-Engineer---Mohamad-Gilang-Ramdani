<img width="782" height="850" alt="image" src="https://github.com/user-attachments/assets/9828dcd5-df94-4f9e-aeba-5bee2cf36c1f" /># Technical-Test-Data-Engineer---Mohamad-Gilang-Ramdani

# Data Warehouse & Dashboard Penjualan

Proyek ini merupakan implementasi pipeline ELT (Extract, Load, Transform) dari data CSV penjualan menjadi data warehouse dengan skema bintang (star schema) di **Supabase**. Data kemudian disajikan dalam dashboard interaktif menggunakan **Google Apps Script** dan **Google Charts**.

<img width="391" height="425" alt="image" src="https://github.com/user-attachments/assets/39e17fbc-30fd-4882-966c-373857bf83e4" />

*Gambar 1: Tab Time Analysis*

## 📋 Daftar Isi
- [Fitur](#fitur)
- [Arsitektur Data](#arsitektur-data)
- [Teknologi](#teknologi)
- [Cara Menjalankan](#cara-menjalankan)
- [Screenshot Dashboard](#screenshot-dashboard)
- [Kode Penting](#kode-penting)
- [Contoh Query Analitik](#contoh-query-analitik)
- [Struktur Repositori](#struktur-repositori)
- [Kontribusi](#kontribusi)

## ✨ Fitur
- **Data Warehouse** dengan skema bintang (dimensi: produk, customer, sales, tanggal; fakta: penjualan).
- **ELT** menggunakan SQL di Supabase.
- **Dashboard Interaktif** dua tab:
  - *Time Analysis*: KPI, grafik bulanan, perbandingan revenue & transaksi, kontribusi hari, weekday vs weekend.
  - *Detail*: Top produk, kinerja sales, top customer, analisis kota, grafik revenue harian per customer, dan tabel transaksi diskon.
- **Filter** berdasarkan tahun, kota, salesman, dan produk.
- **Visualisasi** dengan Google Charts (line, bar, pie).

## 🏗️ Arsitektur Data
![ERD](screenshots/erd.png)
*Star Schema: Tabel fakta `fact_sales` terhubung ke dimensi `dim_product`, `dim_customer`, `dim_sales`, `dim_date`.*

**Penjelasan**:
- `dim_product`: Menyimpan kode dan nama produk (nama diganti 'Tidak Diketahui' jika NULL).
- `dim_customer`: Data pelanggan dengan kode, nama, alamat, kota.
- `dim_sales`: Data salesman – kombinasi unik (kode, nama) karena satu kode bisa memiliki beberapa nama.
- `dim_date`: Dimensi waktu dengan atribut tanggal, bulan, tahun, kuartal.
- `fact_sales`: Setiap baris mewakili satu item transaksi, berisi ukuran qty, harga satuan, total, diskon, pajak.

## 🛠️ Teknologi
- **Database**: Supabase (PostgreSQL)
- **ETL**: SQL (di Supabase) + Python (opsional untuk upload CSV)
- **Dashboard**: Google Apps Script, Google Charts, Bootstrap 5
- **Visualisasi**: Chart.js

## 🚀 Cara Menjalankan

### Prasyarat
- Akun [Supabase](https://supabase.com/)
- Akun Google (untuk spreadsheet dan Apps Script)
- File CSV `sales.csv` dengan struktur sesuai tabel staging

### 1. Setup Database di Supabase
1. Buat project baru di Supabase.
2. Buka **SQL Editor** dan jalankan script [`etl.sql`](etl.sql) secara berurutan.
3. Upload data CSV ke tabel `stg_sales`:
   - Manual: Buka **Table Editor** → pilih `stg_sales` → Insert → Import CSV.
   - Atau gunakan script Python [`upload_to_supabase.py`](upload_to_supabase.py) setelah mengatur koneksi.

### 2. Ekspor Data ke Google Sheets (Opsional)
Jika ingin menyimpan data di spreadsheet untuk keperluan lain, jalankan [`export_to_sheets.py`](export_to_sheets.py) setelah mengatur kredensial service account.

### 3. Deploy Dashboard Web
1. Buat spreadsheet baru di Google Sheets.
2. Buka **Extensions → Apps Script**, hapus kode default.
3. Salin isi [`dashboard/Code.gs`](dashboard/Code.gs) dan [`dashboard/Index.html`](dashboard/Index.html) ke editor.
4. Di `Code.gs`, ganti `SPREADSHEET_ID` dengan ID spreadsheet Anda.
5. Klik **Deploy → New deployment** → pilih **Web app**.
   - Execute as: `Me`
   - Who has access: `Anyone` (atau sesuai kebutuhan)
6. Klik **Deploy** dan salin URL web app.
7. Buka URL untuk melihat dashboard.

## 📸 Screenshot Dashboard

| Tab Time Analysis | Tab Detail |
|-------------------|------------|
| ![Time](screenshots/dashboard-time.png) | ![Detail](screenshots/dashboard-detail.png) |

| Grafik Customer Harian | Tabel Diskon |
|------------------------|--------------|
| ![Customer Daily](screenshots/customer-daily.png) | ![Discount](screenshots/discount-table.png) |

## 🔍 Kode Penting

### 1. Script ETL (SQL) – Membuat Tabel Fakta
```sql
INSERT INTO fact_sales (
    sale_id, date_key, product_key, customer_key, sales_key,
    qty, unit_price, total_amount, discount_amount, tax_amount
)
SELECT
    s.unique_key,
    d.date_key,
    p.product_key,
    c.customer_key,
    sl.sales_key,
    s."Qty",
    s."Harga Unit(Mu)"::FLOAT,
    CAST(REPLACE(REPLACE(s."Subtot Net Pjk(Mu)", '.', ''), ',', '.') AS FLOAT),
    CAST(REPLACE(REPLACE(s."Subtot Disc(Mu)", '.', ''), ',', '.') AS FLOAT),
    CAST(REPLACE(REPLACE(s."Pjk(Mu)", '.', ''), ',', '.') AS FLOAT)
FROM stg_sales s
LEFT JOIN dim_date d ON TO_DATE(s."Tgl Ref", 'DD/MM/YYYY') = d.full_date
LEFT JOIN dim_product p ON s."Kode Barang" = p.kode_barang
LEFT JOIN dim_customer c ON s."Kode Cust" = c.kode_cust
LEFT JOIN dim_sales sl ON s."Kode Sales" = sl.kode_sales AND s."Nama Sales" = sl.nama_sales;

Technical Test: Data Engineer
