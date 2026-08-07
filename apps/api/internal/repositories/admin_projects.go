package repositories

import (
	"context"
	"errors"
	"time"

	"terabe/internal/db"
	"terabe/internal/models"
)

// InsertProject menambahkan proyek baru ke database
func InsertProject(p *models.Project, createdBy string) error {
	pool := db.GetConnection()
	query := `
		INSERT INTO projects (slug, title, tagline, challenge, solution, image_url, hero_url, ratio, live_url, tags, media, meta, stats, created_by, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		RETURNING id
	`

	err := pool.QueryRow(context.Background(), query,
		p.Slug, p.Title, p.Tagline, p.Challenge, p.Solution,
		p.ImageURL, p.HeroURL, p.Ratio, p.LiveURL,
		p.Tags, p.Media, p.Meta, p.Stats, createdBy, time.Now(),
	).Scan(&p.ID)

	return err
}

// UpdateProject memperbarui data proyek yang sudah ada berdasarkan ID
func UpdateProject(id string, p *models.Project) error {
	pool := db.GetConnection()
	query := `
		UPDATE projects
		SET slug = $1, title = $2, tagline = $3, challenge = $4, solution = $5, image_url = $6, hero_url = $7, ratio = $8, live_url = $9, tags = $10, media = $11, meta = $12, stats = $13
		WHERE id = $14
	`
	cmdTag, err := pool.Exec(context.Background(), query,
		p.Slug, p.Title, p.Tagline, p.Challenge, p.Solution,
		p.ImageURL, p.HeroURL, p.Ratio, p.LiveURL,
		p.Tags, p.Media, p.Meta, p.Stats, id,
	)

	if err != nil {
		return err
	}
	if cmdTag.RowsAffected() == 0 {
		return errors.New("project not found")
	}
	return nil
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
