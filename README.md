# Technical-Test-Data-Engineer---Mohamad-Gilang-Ramdani

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
<img width="1450" height="928" alt="supabase-schema-zywsjxwavkpjjzgsipow (1)" src="https://github.com/user-attachments/assets/598115ec-909c-48a5-a236-dfff0abbe034" />

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

<img width="389" height="416" alt="image" src="https://github.com/user-attachments/assets/bfb533b4-7a1e-4da9-a685-f1ec9f5e9c44" />


<img width="386" height="321" alt="image" src="https://github.com/user-attachments/assets/4ac32592-bbdd-42ee-b8ca-dd82cde48c82" />


## 🔍 Kode Penting


Technical Test: Data Engineer
