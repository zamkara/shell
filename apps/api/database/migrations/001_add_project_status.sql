DO $$
BEGIN
    CREATE TYPE project_status AS ENUM ('draft', 'archived', 'published');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS status project_status NOT NULL DEFAULT 'draft';
