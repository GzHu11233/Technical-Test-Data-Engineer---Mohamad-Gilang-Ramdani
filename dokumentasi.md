# Dokumentasi Proyek Data Warehouse Penjualan

## 1. Gambaran Umum
Proyek ini membangun pipeline ELT dari data CSV penjualan menjadi data warehouse dengan skema bintang (star schema) di Supabase. Data kemudian diekspor ke Google Sheets untuk diakses tim marketing melalui dashboard interaktif yang dibuat dengan Google Apps Script.

## 2. Cara Menjalankan

### a. Setup Database di Supabase
1. Buat project di [Supabase](https://supabase.com/).
2. Dapatkan connection string (URI) dan anon key dari Project Settings → Database dan API.
3. Jalankan script `etl.sql` di SQL Editor Supabase secara berurutan untuk membuat tabel staging, dimensi, fakta, dan view.
4. Upload file CSV ke tabel `stg_sales` (manual via Table Editor atau menggunakan script Python `upload_to_supabase.py`).

### b. Ekspor Data ke Google Sheets (Opsional)
1. Buat service account di Google Cloud Console, download file JSON.
2. Buat spreadsheet baru, catat ID-nya.
3. Share spreadsheet dengan email service account sebagai Editor.
4. Jalankan script `export_to_sheets.py` setelah mengatur `SPREADSHEET_ID`, `CREDS_FILE`, dan kredensial Supabase.

### c. Menjalankan Dashboard Web
1. Buka spreadsheet tujuan, buka Extensions → Apps Script.
2. Buat file `Code.gs` dan `Index.html` (dari folder `dashboard/`) di editor.
3. Atur `SPREADSHEET_ID` di `Code.gs` sesuai spreadsheet yang berisi data.
4. Deploy sebagai web app (Deploy → New deployment → Web app).
5. Akses URL yang dihasilkan untuk melihat dashboard.

## 3. Arsitektur Data (Star Schema)

**Tabel Dimensi**:
- `dim_product`: informasi produk (kode, nama). Nama produk diisi 'Tidak Diketahui' jika NULL.
- `dim_customer`: data pelanggan (kode, nama, alamat, kota).
- `dim_sales`: data salesman (kode, nama). Kombinasi kode dan nama dibuat unik karena satu kode bisa memiliki beberapa nama.
- `dim_date`: dimensi waktu dengan atribut tanggal, bulan, tahun, kuartal.

**Tabel Fakta**:
- `fact_sales`: menyimpan setiap item transaksi dengan ukuran qty, harga satuan, total, diskon, dan pajak.

**View**:
- `v_sales_summary`: gabungan fakta dan dimensi untuk kemudahan query.
- `v_dash_monthly`, `v_dash_product`, `v_dash_city`: agregat untuk dashboard.

## 4. Alasan Pemilihan Arsitektur
- **Star Schema**: Memudahkan analis marketing membuat query agregat tanpa join rumit. Denormalisasi pada dimensi meningkatkan performa query.
- **ELT**: Transformasi dilakukan di dalam database menggunakan SQL, memanfaatkan kekuatan PostgreSQL dan mengurangi kebutuhan coding eksternal.
- **Dimensi Sales dengan Unique Constraint (kode, nama)**: Mengakomodasi kemungkinan satu kode sales memiliki beberapa nama, sehingga tidak ada informasi yang hilang.
- **Penggunaan View**: Menyederhanakan akses data untuk dashboard dan query umum, serta menangani nilai NULL dengan default.

## 5. Contoh Query Analitik

### a. Total Penjualan per Bulan
```sql
SELECT year, month, SUM(total_amount) AS total_sales
FROM v_sales_summary
GROUP BY year, month
ORDER BY year, month;

**### b. 5 Produk Terlaris (Berdasarkan Revenue)**

SELECT kode_barang, nama_barang, SUM(total_amount) AS total_sales
FROM v_sales_summary
GROUP BY kode_barang, nama_barang
ORDER BY total_sales DESC
LIMIT 5;

**### c. Penjualan per Kota dengan Jumlah Transaksi**

SELECT nama_kota, COUNT(*) AS transaction_count, SUM(total_amount) AS total_sales
FROM v_sales_summary
GROUP BY nama_kota
ORDER BY total_sales DESC;

