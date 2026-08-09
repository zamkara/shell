CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'archived', 'published');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

-- CMS Tables
CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    status project_status NOT NULL DEFAULT 'draft',
    tagline text,
    challenge text,
    solution text,
    image_url text NOT NULL,
    image_thumbnail_url text NOT NULL,
    hero_url text,
    hero_thumbnail_url text,
    ratio text NOT NULL,
    live_url text,
    tags text[],
    media text[],
    media_thumbnail_urls text[],
    meta jsonb,
    stats jsonb,
    created_by uuid,
    created_at timestamp DEFAULT now(),
    CONSTRAINT projects_image_thumbnail_pair_check CHECK (
      (NULLIF(BTRIM(image_url), '') IS NULL) =
      (NULLIF(BTRIM(image_thumbnail_url), '') IS NULL)
    ),
    CONSTRAINT projects_hero_thumbnail_pair_check CHECK (
      (NULLIF(BTRIM(hero_url), '') IS NULL) =
      (NULLIF(BTRIM(hero_thumbnail_url), '') IS NULL)
    ),
    CONSTRAINT projects_media_thumbnail_count_check CHECK (
      CARDINALITY(COALESCE(media, ARRAY[]::text[])) =
      CARDINALITY(COALESCE(media_thumbnail_urls, ARRAY[]::text[]))
    )
);

CREATE TABLE IF NOT EXISTS faqs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    category text NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    order_index int4 DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pricing_tiers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    basis text NOT NULL,
    for_desc text NOT NULL,
    items text[] NOT NULL,
    order_index int4 DEFAULT 0
);

CREATE TABLE IF NOT EXISTS site_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL
);

-- RBAC Tables
CREATE TABLE IF NOT EXISTS roles (
    id serial PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_system boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    role_id int4 REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS permissions (
    id serial PRIMARY KEY,
    key text UNIQUE NOT NULL,
    module text NOT NULL,
    action text NOT NULL,
    description text,
    is_system boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT permissions_key_format_check CHECK (key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
    CONSTRAINT permissions_key_parts_check CHECK (key = module || '.' || action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id int4 REFERENCES roles(id) ON DELETE CASCADE,
    permission_id int4 REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

-- Default Roles
INSERT INTO roles (name, description) VALUES 
('admin', 'Full access'),
('editor', 'Content edit access'),
('viewer', 'Read only')
ON CONFLICT (name) DO NOTHING;
