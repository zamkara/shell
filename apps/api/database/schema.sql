CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CMS Tables
CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    tagline text,
    challenge text,
    solution text,
    image_url text NOT NULL,
    hero_url text,
    ratio text NOT NULL,
    live_url text,
    tags text[],
    media text[],
    meta jsonb,
    stats jsonb,
    created_by uuid,
    created_at timestamp DEFAULT now()
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
    description text
);

-- Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    role_id int4 REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

-- Default Roles
INSERT INTO roles (name, description) VALUES 
('admin', 'Full access'),
('editor', 'Content edit access'),
('viewer', 'Read only')
ON CONFLICT (name) DO NOTHING;
