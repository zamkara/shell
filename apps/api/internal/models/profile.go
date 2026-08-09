package models

import "time"

type Profile struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	AvatarURL string    `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ProfileSeed struct {
	ID        string
	Email     string
	FullName  string
	AvatarURL string
}

type ProfileUpdate struct {
	FullName  string `json:"full_name"`
	AvatarURL string `json:"avatar_url"`
}
