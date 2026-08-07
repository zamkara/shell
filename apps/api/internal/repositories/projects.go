package repositories

import (
	"context"
	"terabe/internal/db"
	"terabe/internal/models"
)

// GetProjects mengambil seluruh daftar proyek dari database
func GetProjects() ([]models.Project, error) {
	pool := db.GetConnection()
	
	// Query standar. Untuk CMS, Anda bisa menambahkan 'ORDER BY created_at DESC'
	query := `SELECT id, slug, title, tagline, challenge, solution, image_url, hero_url, ratio, live_url, tags, media, meta, stats, created_at FROM projects ORDER BY created_at DESC`
	
	rows, err := pool.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var p models.Project
		err := rows.Scan(
			&p.ID, &p.Slug, &p.Title, &p.Tagline, &p.Challenge, &p.Solution,
			&p.ImageURL, &p.HeroURL, &p.Ratio, &p.LiveURL,
			&p.Tags, &p.Media, &p.Meta, &p.Stats, &p.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		projects = append(projects, p)
	}
	
	// Jika tidak ada data, kembalikan array kosong bukan null
	if projects == nil {
		projects = []models.Project{}
	}

	return projects, nil
}
