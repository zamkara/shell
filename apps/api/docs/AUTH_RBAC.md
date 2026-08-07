# CMS Security & RBAC Architecture

Terabe mengimplementasikan **Role-Based Access Control (RBAC)** secara modular dan aman, memanfaatkan ekosistem otentikasi dari Supabase dengan arsitektur validasi *stateless* di Vercel.

## 1. Asymmetric JWT Verification (JWKS)
Sejak *update* keamanan terbaru, Supabase mengeluarkan JWT yang ditandatangani menggunakan algoritma asimetris (ECC P-256 / ES256) secara *default*.

Untuk memvalidasi token ini tanpa memerlukan koneksi HTTP *round-trip* ke Supabase pada setiap *request*, backend Golang kita mengimplementasikan pola **JWKS (JSON Web Key Set)**:
1. Saat aplikasi berjalan, Golang secara dinamis mengambil *Public Key* (JWKS) dari URL `SUPABASE_URL/auth/v1/.well-known/jwks.json`.
2. Middleware (`internal/middlewares/auth.go`) secara *stateless* memvalidasi kriptografi token klien menggunakan *Public Key* ini.
3. *Fallback* otomatis tersedia untuk token berbasis HMAC (HS256) jika dibutuhkan.

## 2. RBAC Implementation
Setelah JWT tervalidasi secara kriptografi, sistem perlu memverifikasi apakah akun tersebut diizinkan melakukan operasi CMS.

### Skema Tabel
- **`profiles`**: Terhubung langsung (berelasi) dengan tabel internal `auth.users` Supabase.
- **`roles`**: Berisi daftar jabatan/otoritas (misal: `admin`, `editor`, `viewer`).
- **`user_roles`**: *Table mapping* (Many-to-Many) yang menghubungkan pengguna dengan otoritas mereka.

### Alur Middleware Otorisasi
Fungsi `RequireRoleMiddleware` mengambil `user_id` yang telah diekstrak dari JWT, lalu melakukan kueri ringan ke *database* untuk memastikan keberadaan relasi *role* yang disyaratkan.

```go
// Contoh Pseudo-Logic di Middleware
func RequireRoleMiddleware(requiredRole string) {
    userID := extractSubFromJWT()
    hasRole := db.CheckRole(userID, requiredRole)
    if !hasRole {
        return HTTP 403 Forbidden
    }
}
```

## 3. Keuntungan Arsitektur
1. **Sangat Terisolasi:** Rute publik (`GET`) tidak terbebani pengecekan JWT.
2. **Performa Tinggi:** Validasi JWT dilakukan secara lokal di *memory* Vercel (karena menggunakan *Public Key* dari JWKS).
3. **Fleksibel:** Rute baru dapat dengan mudah dilindungi hanya dengan membungkusnya di dalam struktur *chaining middleware*.
