# API Reference

Dokumentasi ini menjelaskan *endpoint* yang tersedia di Terabe Backend. Sistem menggunakan arsitektur REST dengan tipe data JSON. Karena repositori ini bersifat publik, semua contoh data di bawah ini adalah data palsu (*mock data*).

## 1. Public Endpoints

### 1.1 `GET /api/projects`
Mengambil daftar proyek portofolio (Read-Only). Endpoint ini mendukung *dynamic field pruning* (pemangkasan *field* secara dinamis).

**Parameter Query (Opsional):**
- `fields`: Daftar *field* yang ingin diambil (dipisahkan koma). Contoh: `?fields=slug,title,tags`.

**Contoh Request:**
```bash
curl -X GET "https://be.example.com/api/projects"
```

**Contoh Response (Mock Data):**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "slug": "fake-project-alpha",
    "title": "Fake Project Alpha",
    "tagline": "A fake system.\nBuilt for nothing.",
    "challenge": "Many fake issues.",
    "solution": "Solved with fake code.",
    "image_url": "https://example.com/images/fake-alpha.jpg",
    "hero_url": "https://example.com/images/fake-hero.gif",
    "ratio": "16:9",
    "live_url": "View Live",
    "tags": ["WEB", "GOLANG"],
    "media": [
      "https://example.com/images/media1.jpg",
      "https://example.com/images/media2.jpg"
    ],
    "meta": {
      "Category": "Fictional | Testing",
      "Client": "PT Fake Company",
      "Scope": "Local",
      "Techstack": "Golang | Next.js",
      "Timeline": "2026"
    },
    "stats": {
      "MODULES BUILT": "10",
      "BUGS SHIPPED": "99"
    },
    "created_at": "2026-08-01T10:00:00Z"
  }
]
```

---

## 2. Protected Endpoints (CMS Admin)

Semua *endpoint* di bawah ini memerlukan header `Authorization: Bearer <TOKEN>` dan hanya bisa diakses oleh akun yang memiliki *role* `admin`.

### 2.1 `POST /api/admin/projects`
Menambahkan data proyek baru.

**Contoh Request:**
```bash
curl -X POST "https://be.example.com/api/admin/projects" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "slug": "fake-project-beta",
  "title": "Fake Project Beta",
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

### 2.2 `PUT /api/admin/projects?id=<UUID>`
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

### 2.3 `DELETE /api/admin/projects?id=<UUID>`
Menghapus proyek dari database.

**Contoh Request:**
```bash
curl -X DELETE "https://be.example.com/api/admin/projects?id=a1b2c3d4-..." \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```
