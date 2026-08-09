BEGIN;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS image_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS hero_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS media_thumbnail_urls text[];

-- Repair Pixhost thumbnails that older Shell versions stored as full images.
UPDATE projects
SET image_thumbnail_url = image_url,
    image_url = REGEXP_REPLACE(
      image_url,
      '^https://t([0-9]+)\.pixhost\.cc/thumbs/',
      E'https://img\\1.pixhost.cc/images/'
    )
WHERE image_url ~ '^https://t[0-9]+\.pixhost\.cc/thumbs/';

UPDATE projects
SET hero_thumbnail_url = hero_url,
    hero_url = REGEXP_REPLACE(
      hero_url,
      '^https://t([0-9]+)\.pixhost\.cc/thumbs/',
      E'https://img\\1.pixhost.cc/images/'
    )
WHERE hero_url ~ '^https://t[0-9]+\.pixhost\.cc/thumbs/';

WITH normalized_media AS (
  SELECT
    project.id,
    ARRAY_AGG(
      CASE
        WHEN asset.url ~ '^https://t[0-9]+\.pixhost\.cc/thumbs/'
          THEN REGEXP_REPLACE(
            asset.url,
            '^https://t([0-9]+)\.pixhost\.cc/thumbs/',
            E'https://img\\1.pixhost.cc/images/'
          )
        ELSE asset.url
      END
      ORDER BY asset.position
    ) AS full_urls,
    ARRAY_AGG(
      CASE
        WHEN asset.url ~ '^https://t[0-9]+\.pixhost\.cc/thumbs/'
          THEN asset.url
        ELSE COALESCE(
          project.media_thumbnail_urls[asset.position::int],
          asset.url
        )
      END
      ORDER BY asset.position
    ) AS thumbnail_urls
  FROM projects AS project
  CROSS JOIN LATERAL UNNEST(project.media)
    WITH ORDINALITY AS asset(url, position)
  GROUP BY project.id
)
UPDATE projects AS project
SET media = normalized_media.full_urls,
    media_thumbnail_urls = normalized_media.thumbnail_urls
FROM normalized_media
WHERE project.id = normalized_media.id;

-- Existing providers may not expose a dedicated thumbnail. Preserve every
-- image and establish one-to-one pairs; subsequent uploads store Pixhost's
-- distinct full-size and thumbnail URLs.
UPDATE projects
SET image_thumbnail_url = image_url
WHERE image_thumbnail_url IS NULL
   OR (NULLIF(BTRIM(image_url), '') IS NOT NULL
       AND NULLIF(BTRIM(image_thumbnail_url), '') IS NULL);

UPDATE projects
SET hero_thumbnail_url = hero_url
WHERE hero_thumbnail_url IS NULL
  AND hero_url IS NOT NULL;

UPDATE projects
SET media_thumbnail_urls = media
WHERE media IS NOT NULL
  AND CARDINALITY(COALESCE(media, ARRAY[]::text[])) <>
      CARDINALITY(COALESCE(media_thumbnail_urls, ARRAY[]::text[]));

ALTER TABLE projects
  ALTER COLUMN image_thumbnail_url SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_image_thumbnail_pair_check'
      AND conrelid = 'projects'::regclass
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_image_thumbnail_pair_check
      CHECK (
        (NULLIF(BTRIM(image_url), '') IS NULL) =
        (NULLIF(BTRIM(image_thumbnail_url), '') IS NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_hero_thumbnail_pair_check'
      AND conrelid = 'projects'::regclass
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_hero_thumbnail_pair_check
      CHECK (
        (NULLIF(BTRIM(hero_url), '') IS NULL) =
        (NULLIF(BTRIM(hero_thumbnail_url), '') IS NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_media_thumbnail_count_check'
      AND conrelid = 'projects'::regclass
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_media_thumbnail_count_check
      CHECK (
        CARDINALITY(COALESCE(media, ARRAY[]::text[])) =
        CARDINALITY(COALESCE(media_thumbnail_urls, ARRAY[]::text[]))
      );
  END IF;
END
$$;

COMMIT;
