# Database Schema

Database menggunakan PostgreSQL yang di- _hosting_ oleh Supabase dan diakses melalui **Transaction/Session Pooler** (menggunakan _driver_ `pgxpool`).

## Table Relations

```mermaid
erDiagram
    PROFILES ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned_to
    PROFILES ||--o{ PROJECTS : creates

    PROFILES {
        uuid id PK
        text email
        text full_name
    }

    ROLES {
        int4 id PK
        text name
    }

    USER_ROLES {
        uuid user_id PK
        int4 role_id PK
    }

    PROJECTS {
        uuid id PK
        text slug
        text title
        project_status status
        jsonb meta
        jsonb stats
    }
```

## Fitur Kunci

1. **UUIDv4**: Menggunakan UUID generasi ke-4 untuk menghindari tebakan ID yang sekuensial.
2. **JSONB**: Menggunakan format `jsonb` pada `meta` dan `stats` agar struktur portofolio bisa dinamis (misalnya, ada proyek yang tidak punya "_Techstack_" tapi punya "_Hardware_") tanpa perlu merombak _schema_ kolom relasional secara terus-menerus.
3. **Cascading Deletes**: Jika sebuah akun (_Profile_) dihapus, semua kepemilikan _role_ mereka di tabel `user_roles` akan otomatis terhapus untuk mencegah data yatim piatu (_orphaned records_).
4. **Project Status Enum**: Kolom `projects.status` menggunakan enum `project_status` dengan nilai `draft`, `archived`, atau `published`; nilai default-nya adalah `draft`.
