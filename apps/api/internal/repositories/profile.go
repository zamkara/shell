package repositories

import (
	"context"

	"terabe/internal/db"
	"terabe/internal/models"
)

const profileColumns = `id, email, COALESCE(full_name, ''), COALESCE(avatar_url, ''), created_at, updated_at`

func GetOrCreateProfile(ctx context.Context, seed models.ProfileSeed) (models.Profile, error) {
	var profile models.Profile
	err := db.GetConnection().QueryRow(ctx, `
		INSERT INTO profiles (id, email, full_name, avatar_url)
		VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''))
		ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
		RETURNING `+profileColumns,
		seed.ID,
		seed.Email,
		seed.FullName,
		seed.AvatarURL,
	).Scan(
		&profile.ID,
		&profile.Email,
		&profile.FullName,
		&profile.AvatarURL,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)
	return profile, err
}

func UpdateProfile(ctx context.Context, seed models.ProfileSeed, update models.ProfileUpdate) (models.Profile, error) {
	var profile models.Profile
	err := db.GetConnection().QueryRow(ctx, `
		INSERT INTO profiles (id, email, full_name, avatar_url)
		VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''))
		ON CONFLICT (id) DO UPDATE SET
			email = EXCLUDED.email,
			full_name = EXCLUDED.full_name,
			avatar_url = EXCLUDED.avatar_url
		RETURNING `+profileColumns,
		seed.ID,
		seed.Email,
		update.FullName,
		update.AvatarURL,
	).Scan(
		&profile.ID,
		&profile.Email,
		&profile.FullName,
		&profile.AvatarURL,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)
	return profile, err
}
