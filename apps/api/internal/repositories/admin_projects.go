package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"terabe/internal/db"
	"terabe/internal/models"
)

// InsertProject menambahkan proyek baru ke database
func InsertProject(p *models.Project, createdBy string) error {
	metaJSON, statsJSON, err := marshalProjectJSONFields(p)
	if err != nil {
		return err
	}

	pool := db.GetConnection()
	query := `
		INSERT INTO projects (slug, title, status, tagline, challenge, solution, image_url, image_thumbnail_url, hero_url, hero_thumbnail_url, ratio, live_url, tags, media, media_thumbnail_urls, meta, stats, created_by, created_at)
		VALUES ($1, $2, $3::project_status, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17::jsonb, $18, $19)
		RETURNING id
	`

	err = pool.QueryRow(context.Background(), query,
		p.Slug, p.Title, string(p.Status), p.Tagline, p.Challenge, p.Solution,
		p.ImageURL, p.ImageThumbnailURL, p.HeroURL, p.HeroThumbnailURL,
		p.Ratio, p.LiveURL, p.Tags, p.Media, p.MediaThumbnailURLs,
		metaJSON, statsJSON, createdBy, time.Now(),
	).Scan(&p.ID)

	return err
}

// UpdateProject memperbarui data proyek yang sudah ada berdasarkan ID
func UpdateProject(id string, p *models.Project) error {
	metaJSON, statsJSON, err := marshalProjectJSONFields(p)
	if err != nil {
		return err
	}

	pool := db.GetConnection()
	query := `
		UPDATE projects
		SET slug = $1, title = $2, status = $3::project_status, tagline = $4, challenge = $5, solution = $6, image_url = $7, image_thumbnail_url = $8, hero_url = $9, hero_thumbnail_url = $10, ratio = $11, live_url = $12, tags = $13, media = $14, media_thumbnail_urls = $15, meta = $16::jsonb, stats = $17::jsonb
		WHERE id = $18
	`
	cmdTag, err := pool.Exec(context.Background(), query,
		p.Slug, p.Title, string(p.Status), p.Tagline, p.Challenge, p.Solution,
		p.ImageURL, p.ImageThumbnailURL, p.HeroURL, p.HeroThumbnailURL,
		p.Ratio, p.LiveURL, p.Tags, p.Media, p.MediaThumbnailURLs,
		metaJSON, statsJSON, id,
	)

	if err != nil {
		return err
	}
	if cmdTag.RowsAffected() == 0 {
		return errors.New("project not found")
	}
	return nil
}

func marshalProjectJSONFields(p *models.Project) (string, string, error) {
	metaJSON := p.Meta
	if len(metaJSON) == 0 {
		metaJSON = []byte("{}")
	}
	if !json.Valid(metaJSON) {
		return "", "", fmt.Errorf("marshal project meta: invalid JSON")
	}
	statsJSON := p.Stats
	if len(statsJSON) == 0 {
		statsJSON = []byte("{}")
	}
	if !json.Valid(statsJSON) {
		return "", "", fmt.Errorf("marshal project stats: invalid JSON")
	}
	return string(metaJSON), string(statsJSON), nil
}

// DeleteProject menghapus proyek berdasarkan ID
func DeleteProject(id string) error {
	pool := db.GetConnection()
	query := `DELETE FROM projects WHERE id = $1`
	cmdTag, err := pool.Exec(context.Background(), query, id)

	if err != nil {
		return err
	}
	if cmdTag.RowsAffected() == 0 {
		return errors.New("project not found")
	}
	return nil
}
