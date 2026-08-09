BEGIN;

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS permissions (
  id serial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  module text NOT NULL,
  action text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT permissions_key_format_check
    CHECK (key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  CONSTRAINT permissions_key_parts_check
    CHECK (key = module || '.' || action)
);

ALTER TABLE permissions
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id int4 NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id int4 NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS user_roles_role_id_idx ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx
  ON role_permissions(permission_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS roles_set_updated_at ON roles;
CREATE TRIGGER roles_set_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS permissions_set_updated_at ON permissions;
CREATE TRIGGER permissions_set_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO permissions (key, module, action, description) VALUES
  ('shell.access', 'shell', 'access', 'Open the authenticated shell'),
  ('projects.read', 'projects', 'read', 'View projects'),
  ('projects.create', 'projects', 'create', 'Create and duplicate projects'),
  ('projects.update', 'projects', 'update', 'Update projects and project status'),
  ('projects.delete', 'projects', 'delete', 'Delete projects'),
  ('faqs.read', 'faqs', 'read', 'View FAQs'),
  ('faqs.create', 'faqs', 'create', 'Create FAQs'),
  ('faqs.update', 'faqs', 'update', 'Update FAQs'),
  ('faqs.delete', 'faqs', 'delete', 'Delete FAQs'),
  ('pricing.read', 'pricing', 'read', 'View pricing tiers'),
  ('pricing.create', 'pricing', 'create', 'Create pricing tiers'),
  ('pricing.update', 'pricing', 'update', 'Update pricing tiers'),
  ('pricing.delete', 'pricing', 'delete', 'Delete pricing tiers'),
  ('content.read', 'content', 'read', 'View site content'),
  ('content.create', 'content', 'create', 'Create site content'),
  ('content.update', 'content', 'update', 'Update site content'),
  ('content.delete', 'content', 'delete', 'Delete site content'),
  ('profile.read', 'profile', 'read', 'View own profile'),
  ('profile.update', 'profile', 'update', 'Update own profile'),
  ('users.read', 'users', 'read', 'View users'),
  ('users.create', 'users', 'create', 'Create users'),
  ('users.update', 'users', 'update', 'Update users and role assignments'),
  ('users.delete', 'users', 'delete', 'Delete users'),
  ('roles.read', 'roles', 'read', 'View roles'),
  ('roles.create', 'roles', 'create', 'Create roles'),
  ('roles.update', 'roles', 'update', 'Update roles and grants'),
  ('roles.delete', 'roles', 'delete', 'Delete roles'),
  ('permissions.read', 'permissions', 'read', 'View permission catalog'),
  ('permissions.create', 'permissions', 'create', 'Create permissions'),
  ('permissions.update', 'permissions', 'update', 'Update permissions'),
  ('permissions.delete', 'permissions', 'delete', 'Delete permissions')
ON CONFLICT (key) DO UPDATE SET
  module = EXCLUDED.module,
  action = EXCLUDED.action,
  description = EXCLUDED.description;

UPDATE permissions SET is_system = true WHERE key = ANY (ARRAY[
  'shell.access', 'projects.read', 'projects.create', 'projects.update', 'projects.delete',
  'faqs.read', 'faqs.create', 'faqs.update', 'faqs.delete',
  'pricing.read', 'pricing.create', 'pricing.update', 'pricing.delete',
  'content.read', 'content.create', 'content.update', 'content.delete',
  'profile.read', 'profile.update', 'users.read', 'users.create', 'users.update', 'users.delete',
  'roles.read', 'roles.create', 'roles.update', 'roles.delete',
  'permissions.read', 'permissions.create', 'permissions.update', 'permissions.delete'
]);

UPDATE roles SET is_system = true WHERE name IN ('admin', 'editor', 'viewer');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key = ANY (ARRAY[
  'shell.access', 'projects.read', 'projects.create', 'projects.update',
  'faqs.read', 'faqs.create', 'faqs.update',
  'pricing.read', 'pricing.create', 'pricing.update',
  'content.read', 'content.create', 'content.update',
  'profile.read', 'profile.update'
])
WHERE r.name = 'editor'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key = ANY (ARRAY[
  'shell.access', 'projects.read', 'faqs.read', 'pricing.read',
  'content.read', 'profile.read', 'profile.update'
])
WHERE r.name = 'viewer'
ON CONFLICT DO NOTHING;

COMMIT;
