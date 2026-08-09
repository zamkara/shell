# API Reference

Dokumentasi ini menjelaskan _endpoint_ yang tersedia di Terabe Backend. Sistem menggunakan arsitektur REST dengan tipe data JSON. Karena repositori ini bersifat publik, semua contoh data di bawah ini adalah data palsu (_mock data_).

## 1. Public Endpoints

### 1.1 Collection parameters and response

All collection endpoints (`/api/projects`, `/api/faqs`, `/api/pricing`, and `/api/content`) accept `search`, `page`, and `limit`. Defaults are `page=1` and `limit=10`; `limit` is capped at 100. Responses use `{ "items": [], "total": 0, "page": 1, "limit": 10 }`.

### 1.2 `GET /api/projects`

Mengambil daftar ringkas proyek portofolio. Endpoint ini hanya mengembalikan `id`, `title`, dan `tagline` untuk kebutuhan list.

**Contoh Request:**

```bash
curl -X GET "https://be.example.com/api/projects"
```

**Contoh Response (Mock Data):**

```json
{
  "items": [{
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "title": "Fake Project Alpha",
    "tagline": "A fake system.\nBuilt for nothing."
  }],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### 1.3 `GET /api/projects/<UUID>`

Mengambil satu proyek lengkap saat pengguna membuka proyek dari list. Endpoint ini mengembalikan seluruh field proyek dan hanya menjalankan satu query dengan filter `id`.

### 1.4 `GET /api/faqs`

Mengambil daftar ringkas FAQ berisi `id` dan `question`. Gunakan `?category=home` atau `?category=pricing` untuk membatasi kategori. `GET /api/faqs/<UUID>` mengambil seluruh field satu FAQ saat item dibuka.

`POST`, `PUT?id=<UUID>`, dan `DELETE?id=<UUID>` tersedia untuk admin terautentikasi.

### 1.5 `GET /api/pricing`

Mengambil daftar ringkas pricing tier berisi `id` dan `name` dalam urutan `order_index`. `GET /api/pricing/<UUID>` mengambil seluruh field satu tier saat item dibuka. `POST`, `PUT?id=<UUID>`, dan `DELETE?id=<UUID>` tersedia untuk admin terautentikasi.

### 1.6 `/api/content`

`GET /api/content` mengembalikan daftar ringkas berisi `key`; `GET /api/content/<key>` mengambil nilai lengkap satu setting saat dibuka. Filter exact `?key=process_steps` tetap tersedia pada endpoint daftar. `PUT /api/content` menerima `{ "key": string, "value": any }`; `DELETE /api/content?id=<key>` menghapus satu setting. Mutasi memerlukan admin terautentikasi.

---

## 2. Protected Endpoints (CMS Admin)

Semua endpoint shell memerlukan `Authorization: Bearer <TOKEN>`, `shell.access`, dan permission resource yang sesuai. Endpoint administrasi identitas juga mensyaratkan role `admin`.

### 2.1 `GET /api/auth/session`

Memvalidasi sesi shell dan mengembalikan profil beserta `role`, `roles`, dan `permissions` efektif. Avatar menggunakan metadata JWT bila tersedia, lalu Gravatar berbasis SHA-256 email sebagai fallback.

### 2.2 `/api/profile`

`GET` mengembalikan profil pengguna aktif: `id`, `email`, `full_name`, `display_name`, `avatar_url`, `resolved_avatar_url`, `role`, `roles`, `permissions`, `created_at`, dan `updated_at`. `PUT` menerima `{ "full_name": "...", "avatar_url": "..." }`. URL avatar boleh kosong untuk memakai Gravatar.

### 2.3 Identity and access modules

- `/api/admin/users[/{id}]`: list, detail, create, update profile/role assignments, and delete.
- `/api/admin/roles[/{id}]`: list, detail, and CRUD with batched `permission_ids` replacement.
- `/api/admin/permissions[/{id}]`: permission catalog and CRUD for custom keys. Seeded system permissions cannot be deleted or renamed.
- Lists accept `search`, `page`, and `limit` and use exactly two SQL queries (aggregate list plus count). Detail endpoints use one query.

Set `SUPABASE_SECRET_KEY` (preferred) or legacy `SUPABASE_SERVICE_ROLE_KEY` only on the backend before creating users.

### 2.3 `POST /api/admin/projects`

Menambahkan data proyek baru.

**Contoh Request:**

```bash
curl -X POST "https://be.example.com/api/admin/projects" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "slug": "fake-project-beta",
  "title": "Fake Project Beta",
  "status": "draft",
  "image_url": "https://example.com/images/fake-beta.jpg",
  "ratio": "4:3",
  "tags": ["SAAS"]
}'
```

**Contoh Response:**

```json
{
  "message": "Project created successfully",
  "id": "f5e4d3c2-b1a0-9f8e-7d6c-5b4a3c2d1e0f"
}
```

### 2.4 `PUT /api/admin/projects?id=<UUID>`

Memperbarui data proyek yang sudah ada.

**Contoh Request:**

```bash
curl -X PUT "https://be.example.com/api/admin/projects?id=a1b2c3d4-..." \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "title": "Fake Project Beta (Updated)"
}'
```

### 2.5 `DELETE /api/admin/projects?id=<UUID>`

Menghapus proyek dari database.

**Contoh Request:**

```bash
curl -X DELETE "https://be.example.com/api/admin/projects?id=a1b2c3d4-..." \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```
