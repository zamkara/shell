# Terabe Backend Architecture & Database Schema

Dokumen ini memetakan arsitektur database Supabase dan struktur *endpoint* Golang untuk melayani kebutuhan data dinamis proyek **petot** (Good Fella Clone) sekaligus sebagai *Headless CMS* untuk *Admin Page*.

---

## 1. Database Schema (Supabase PostgreSQL)

Kita membagi skema menjadi 2 bagian besar: **Konten (CMS)** dan **Autentikasi/Otorisasi (RBAC)**.

### A. Autentikasi & Otorisasi (RBAC - Role Based Access Control)

Karena kita menggunakan Supabase, tabel inti `users` sudah dikelola dengan sangat aman oleh skema `auth.users` bawaan Supabase. Kita hanya membuat ekstensi di skema `public`.

#### Tabel 1: `profiles`
Ekstensi profil dari `auth.users` Supabase. Trigger otomatis dibuat setiap ada pendaftaran akun baru.

| Column Name  | Data Type | Constraints             | Description |
| :---         | :---      | :---                    | :--- |
| `id`         | `uuid`    | PK, FK (`auth.users`)   | Referensi ID dari Supabase Auth |
| `email`      | `text`    | Unique, Not Null        | Email admin/pengguna |
| `full_name`  | `text`    | Nullable                | Nama lengkap |
| `avatar_url` | `text`    | Nullable                | URL foto profil |
| `created_at` | `timestamp`| Default: `now()`        | |

#### Tabel 2: `roles`
Tingkatan akses CMS (contoh: "Superadmin", "Editor", "Viewer").

| Column Name   | Data Type | Constraints      | Description |
| :---          | :---      | :---             | :--- |
| `id`          | `int4`    | Primary Key      | ID Peran (Auto Increment) |
| `name`        | `text`    | Unique, Not Null | Nama Peran ("admin", "editor") |
| `description` | `text`    | Nullable         | Deskripsi akses |

#### Tabel 3: `user_roles`
Tabel penghubung (Many-to-Many) antara Profil dan Peran.

| Column Name  | Data Type | Constraints                 | Description |
| :---         | :---      | :---                        | :--- |
| `user_id`    | `uuid`    | PK, FK (`profiles.id`)      | ID Pengguna |
| `role_id`    | `int4`    | PK, FK (`roles.id`)         | ID Peran |
| `assigned_by`| `uuid`    | FK (`profiles.id`)          | Siapa yang memberi peran ini |
| `created_at` | `timestamp`| Default: `now()`            | |


### B. Konten Portofolio & Situs

Tabel ini akan dilindungi menggunakan fitur **Row Level Security (RLS)** dari Supabase, sehingga hanya *User* dengan Role "admin" atau "editor" yang bisa mengubah data, sedangkan publik (tanpa login) hanya bisa membaca (SELECT).

#### Tabel 4: `projects`
Menyimpan data portofolio utama (seperti *Lezza DMS*, *Ark Linux*, dll).

| Column Name  | Data Type   | Constraints          | Description |
| :---         | :---        | :---                 | :--- |
| `id`         | `uuid`      | Primary Key          | UUID v4 |
| `slug`       | `text`      | Unique, Not Null     | ID URL, contoh: "lezza" |
| `title`      | `text`      | Not Null             | Nama proyek |
| `tagline`    | `text`      | Nullable             | Kalimat pembuka hero |
| `challenge`  | `text`      | Nullable             | Deskripsi tantangan |
| `solution`   | `text`      | Nullable             | Deskripsi solusi |
| `image_url`  | `text`      | Not Null             | URL gambar cover/thumbnail (Pixhost) |
| `hero_url`   | `text`      | Nullable             | URL gambar resolusi tinggi untuk hero |
| `ratio`      | `text`      | Not Null             | Resolusi aspek rasio ("2250 / 1500") |
| `live_url`   | `text`      | Nullable             | URL live proyek |
| `tags`       | `text[]`    | Nullable             | Array string. Misal: `{"[ENTERPRISE]"}` |
| `media`      | `text[]`    | Nullable             | Array URL gambar galeri proyek |
| `meta`       | `jsonb`     | Nullable             | Array/Objek untuk Timeline, Techstack |
| `stats`      | `jsonb`     | Nullable             | Angka statistik spesifik proyek |
| `created_by` | `uuid`      | FK (`profiles.id`)   | Admin yang membuat post ini |
| `created_at` | `timestamp` | Default: `now()`     | Waktu data dibuat |

#### Tabel 5: `faqs`
Menyimpan pertanyaan yang sering diajukan untuk halaman *Home* dan *Pricing*.

| Column Name   | Data Type   | Constraints      | Description |
| :---          | :---        | :---             | :--- |
| `id`          | `uuid`      | Primary Key      | UUID v4 |
| `category`    | `text`      | Not Null         | "home" atau "pricing" |
| `question`    | `text`      | Not Null         | Pertanyaan FAQ |
| `answer`      | `text`      | Not Null         | Jawaban FAQ |
| `order_index` | `int4`      | Default: 0       | Urutan tampil (Ascending) |

#### Tabel 6: `pricing_tiers`
Menyimpan data paket harga (The Build, The Keep, Quoted).

| Column Name  | Data Type | Constraints      | Description |
| :---         | :---      | :---             | :--- |
| `id`         | `uuid`    | Primary Key      | UUID v4 |
| `name`       | `text`    | Not Null         | "THE BUILD" |
| `basis`      | `text`    | Not Null         | "Fixed scope" |
| `for_desc`   | `text`    | Not Null         | Deskripsi target audiens paket ini |
| `items`      | `text[]`  | Not Null         | Array string fitur/layanan yang didapat |
| `order_index`| `int4`    | Default: 0       | Urutan tampil |

#### Tabel 7: `site_settings`
Tabel *Key-Value* dinamis menggunakan JSONB untuk konfigurasi global (`PROCESS`, `BUILD_ITEMS`, dll).

| Column Name | Data Type | Constraints | Description |
| :---        | :---      | :---        | :--- |
| `key`       | `text`    | Primary Key | Kunci unik (contoh: "process_steps") |
| `value`     | `jsonb`   | Not Null    | Data array/objek lengkap dalam format JSON |

---

## 2. API Endpoints (Vercel Serverless Golang)

Karena ini menjadi sebuah CMS, setiap *endpoint* wajib mendukung operasi CRUD (Create, Read, Update, Delete) yang dilindungi oleh JWT Middleware, kecuali operasi Read (GET) yang bersifat publik.

### A. Autentikasi (Middlewares)
*   Semua metode `POST`, `PUT`, `DELETE` wajib melampirkan header `Authorization: Bearer <Supabase_JWT>`.
*   Backend Golang akan memverifikasi token dan mencocokkan *Role* *User* sebelum memproses data.

### B. Konten (CMS Endpoints)

**1. `/api/projects`**
*   `GET` - Ambil daftar portofolio (Public, support `?fields=...`).
*   `GET /api/projects?slug=...` - Ambil detail spesifik.
*   `POST` - Buat proyek baru (Butuh Role: Admin/Editor).
*   `PUT` - Update data proyek (Butuh Role: Admin/Editor).
*   `DELETE` - Hapus proyek (Butuh Role: Admin).

**2. `/api/faqs`**
*   `GET` - Ambil daftar FAQ (Public).
*   `POST`, `PUT`, `DELETE` - Kelola FAQ (Butuh Role: Admin/Editor).

**3. `/api/pricing`**
*   `GET` - Ambil paket harga (Public).
*   `POST`, `PUT`, `DELETE` - Kelola Harga (Butuh Role: Admin).

**4. `/api/content`**
*   `GET` - Ambil `site_settings` (Public).
*   `PUT` - Ubah `site_settings` (Butuh Role: Admin).

---

## 3. Direktori Backend (Clean Architecture + CMS)

*   **`/api`**: Folder *Handlers* (contoh: `projects.go`, `auth.go`).
*   **`/internal/db`**: Koneksi `pgxpool`.
*   **`/internal/middlewares`**: Fungsi pencegat HTTP untuk memvalidasi JWT dari Supabase Auth dan memeriksa kecocokan *Role*.
*   **`/internal/utils`**: Fungsi bantuan (*Dynamic Field Filter* dan *Error Handling*).
*   **`/internal/repositories`**: Lapisan eksekusi Query SQL.
