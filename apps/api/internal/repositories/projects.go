package repositories

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"terabe/internal/db"
	"terabe/internal/models"
)

var ErrProjectNotFound = errors.New("project not found")

// GetProjectSummaries returns only the fields required by the project list.
func GetProjectSummaries(search string, page, limit int) ([]models.ProjectSummary, int, error) {
	where := `WHERE ($1 = '' OR title ILIKE '%' || $1 || '%' OR COALESCE(tagline, '') ILIKE '%' || $1 || '%')`
	return queryCollection(collectionQuery{
		listSQL:  `SELECT id, title, tagline FROM projects ` + where + ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		countSQL: `SELECT COUNT(*) FROM projects ` + where,
		args:     []interface{}{search}, page: page, limit: limit,
	}, func(row pgx.CollectableRow) (models.ProjectSummary, error) {
		var item models.ProjectSummary
		err := row.Scan(&item.ID, &item.Title, &item.Tagline)
		return item, err
	})
}

// GetProjectByID returns the complete editable project only when it is opened.
func GetProjectByID(id string) (*models.Project, error) {
	pool := db.GetConnection()
	query := `
		SELECT id, slug, title, status, tagline, challenge, solution,
		       image_url, image_thumbnail_url, hero_url, hero_thumbnail_url,
		       ratio, live_url, tags, media, media_thumbnail_urls, meta, stats, created_at
		FROM projects
		WHERE id = $1
	`

	var project models.Project
	err := pool.QueryRow(context.Background(), query, id).Scan(
		&project.ID, &project.Slug, &project.Title, &project.Status,
		&project.Tagline, &project.Challenge, &project.Solution,
		&project.ImageURL, &project.ImageThumbnailURL,
		&project.HeroURL, &project.HeroThumbnailURL,
		&project.Ratio, &project.LiveURL, &project.Tags,
		&project.Media, &project.MediaThumbnailURLs,
		&project.Meta, &project.Stats, &project.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrProjectNotFound
	}
	if err != nil {
		return nil, err
	}

	return &project, nil
}
