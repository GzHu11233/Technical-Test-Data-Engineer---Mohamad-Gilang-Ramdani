-- =====================================================
-- 1. Aktifkan UUID extension
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. Tabel Staging (stg_sales)
-- =====================================================
CREATE TABLE IF NOT EXISTS stg_sales (
    unique_key UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "No. Urut" float4,
    "Ref" varchar(50),
    "Tgl Ref" varchar(50),
    "No. Ref" varchar(50),
    "No. Dok Ref" varchar(50),
    "Kode Cust" varchar(50),
    "Nama Cust" varchar(50),
    "Alamat Cust" varchar(128),
    "Kode Panel" varchar(50),
    "Nama Panel" varchar(50),
    "Kode Sales" varchar(50),
    "Nama Sales" varchar(50),
    "Keterangan" varchar(50),
    "Pajak" varchar(50),
    "Kategori Pjk" varchar(50),
    "Kode Barang" varchar(50),
    "Nama Jns Brg" varchar(50),
    "Ket Ref" varchar(50),
    "Qty" float4,
    "Sat" varchar(50),
    "Qty Std" float4,
    "Sat Std" varchar(50),
    "Harga (+)" float4,
    "Harga Sbl (+)" varchar(50),
    "Harga Unit(Mu)" varchar(50),
    "Total(MU)" varchar(50),
    "Disc. 1 (%)" float4,
    "Disc. 1 (MU)" varchar(50),
    "Disc. 2 (%)" float4,
    "Disc. 2 (MU)" varchar(50),
    "Disc. 3 (%)" float4,
    "Disc. 3 (MU)" float4,
    "Disc. 4 (MU)" float4,
    "Disc. 5 (%)" float4,
    "Disc. 5 (MU)" float4,
    "Disc. 6 (MU)" float4,
    "Subtot Disc(Mu)" varchar(50),
    "Subtot(Mu)" varchar(50),
    "Hrg Unit Riil(Mu)" varchar(50),
    "Total Riil(Mu)" varchar(50),
    "Subtot Disc Riil(Mu)" varchar(50),
    "Subtot Riil(Mu)" varchar(50),
    "Disc Akh(Mu)" float4,
    "Subtot Net(Mu)" varchar(50),
    "Pjk(Mu)" varchar(50),
    "Subtot Net Pjk(Mu)" varchar(50),
    "Kode Kota" varchar(50),
    "Nama Kota" varchar(50)
);

-- =====================================================
-- 3. Tabel Dimensi
-- =====================================================

-- Dimensi Produk
CREATE TABLE dim_product (
    product_key SERIAL PRIMARY KEY,
    kode_barang VARCHAR(50) UNIQUE NOT NULL,
    nama_barang VARCHAR(50) DEFAULT 'Tidak Diketahui'
);
INSERT INTO dim_product (kode_barang, nama_barang)
SELECT DISTINCT "Kode Barang", COALESCE("Nama Jns Brg", 'Tidak Diketahui')
FROM stg_sales WHERE "Kode Barang" IS NOT NULL;

-- Dimensi Customer
CREATE TABLE dim_customer (
    customer_key SERIAL PRIMARY KEY,
    kode_cust VARCHAR(50) UNIQUE NOT NULL,
    nama_cust VARCHAR(50),
    alamat_cust VARCHAR(128),
    kode_kota VARCHAR(50),
    nama_kota VARCHAR(50)
);
INSERT INTO dim_customer (kode_cust, nama_cust, alamat_cust, kode_kota, nama_kota)
SELECT DISTINCT "Kode Cust", "Nama Cust", "Alamat Cust", "Kode Kota", "Nama Kota"
FROM stg_sales WHERE "Kode Cust" IS NOT NULL;

-- Dimensi Sales
CREATE TABLE dim_sales (
    sales_key SERIAL PRIMARY KEY,
    kode_sales VARCHAR(50) NOT NULL,
    nama_sales VARCHAR(50) NOT NULL,
    CONSTRAINT unique_kode_nama_sales UNIQUE (kode_sales, nama_sales)
);
INSERT INTO dim_sales (kode_sales, nama_sales)
SELECT DISTINCT "Kode Sales", "Nama Sales"
FROM stg_sales WHERE "Kode Sales" IS NOT NULL AND "Nama Sales" IS NOT NULL;

-- Dimensi Tanggal
CREATE TABLE dim_date (
    date_key INTEGER PRIMARY KEY,
    full_date DATE UNIQUE NOT NULL,
    day INTEGER,
    month INTEGER,
    year INTEGER,
    quarter INTEGER
);
INSERT INTO dim_date (date_key, full_date, day, month, year, quarter)
SELECT DISTINCT
    TO_CHAR(TO_DATE("Tgl Ref", 'DD/MM/YYYY'), 'YYYYMMDD')::INTEGER,
    TO_DATE("Tgl Ref", 'DD/MM/YYYY'),
    EXTRACT(DAY FROM TO_DATE("Tgl Ref", 'DD/MM/YYYY'))::INTEGER,
    EXTRACT(MONTH FROM TO_DATE("Tgl Ref", 'DD/MM/YYYY'))::INTEGER,
    EXTRACT(YEAR FROM TO_DATE("Tgl Ref", 'DD/MM/YYYY'))::INTEGER,
    EXTRACT(QUARTER FROM TO_DATE("Tgl Ref", 'DD/MM/YYYY'))::INTEGER
FROM stg_sales WHERE "Tgl Ref" IS NOT NULL;

-- =====================================================
-- 4. Tabel Fakta
-- =====================================================
CREATE TABLE fact_sales (
    sale_id UUID PRIMARY KEY,
    date_key INTEGER REFERENCES dim_date(date_key),
    product_key INTEGER REFERENCES dim_product(product_key),
    customer_key INTEGER REFERENCES dim_customer(customer_key),
    sales_key INTEGER REFERENCES dim_sales(sales_key),
    qty FLOAT4,
    unit_price FLOAT4,
    total_amount FLOAT4,
    discount_amount FLOAT4,
    tax_amount FLOAT4
);

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

-- =====================================================
-- 5. View untuk Analisis
-- =====================================================
CREATE VIEW v_sales_summary AS
SELECT
    f.sale_id,
    d.full_date,
    d.year,
    d.month,
    d.quarter,
    p.kode_barang,
    COALESCE(p.nama_barang, p.kode_barang) AS nama_barang,
    c.nama_cust,
    c.nama_kota,
    sl.kode_sales,
    sl.nama_sales,
    f.qty,
    f.unit_price,
    f.total_amount,
    f.discount_amount,
    f.tax_amount
FROM fact_sales f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_product p ON f.product_key = p.product_key
JOIN dim_customer c ON f.customer_key = c.customer_key
LEFT JOIN dim_sales sl ON f.sales_key = sl.sales_key;

-- View untuk dashboard bulanan
CREATE VIEW v_dash_monthly AS
SELECT year, month, SUM(total_amount) AS total_sales
FROM v_sales_summary
GROUP BY year, month ORDER BY year, month;

-- View untuk dashboard produk
CREATE VIEW v_dash_product AS
SELECT kode_barang, nama_barang, SUM(qty) AS total_qty, SUM(total_amount) AS total_sales
FROM v_sales_summary
GROUP BY kode_barang, nama_barang ORDER BY total_sales DESC;

-- View untuk dashboard kota
CREATE VIEW v_dash_city AS
SELECT nama_kota, SUM(total_amount) AS total_sales
FROM v_sales_summary
GROUP BY nama_kota ORDER BY total_sales DESC;

-- Grant akses untuk anon (jika digunakan dengan anon key)
GRANT SELECT ON dim_product TO anon;
GRANT SELECT ON dim_customer TO anon;
GRANT SELECT ON dim_sales TO anon;
GRANT SELECT ON dim_date TO anon;
GRANT SELECT ON fact_sales TO anon;
GRANT SELECT ON v_sales_summary TO anon;
GRANT SELECT ON v_dash_monthly TO anon;
GRANT SELECT ON v_dash_product TO anon;
GRANT SELECT ON v_dash_city TO anon;
