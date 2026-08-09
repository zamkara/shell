package models

import (
	"encoding/json"
	"time"
)

type ProjectStatus string

const (
	ProjectStatusDraft     ProjectStatus = "draft"
	ProjectStatusArchived  ProjectStatus = "archived"
	ProjectStatusPublished ProjectStatus = "published"
)

func (s ProjectStatus) IsValid() bool {
	switch s {
	case ProjectStatusDraft, ProjectStatusArchived, ProjectStatusPublished:
		return true
	default:
		return false
	}
}

type Project struct {
	ID                 string        `json:"id"`
	Slug               string        `json:"slug"`
	Title              string        `json:"title"`
	Status             ProjectStatus `json:"status"`
	Tagline            *string       `json:"tagline,omitempty"`
	Challenge          *string       `json:"challenge,omitempty"`
	Solution           *string       `json:"solution,omitempty"`
	ImageURL           string        `json:"image_url"`
	ImageThumbnailURL  string        `json:"image_thumbnail_url"`
	HeroURL            *string       `json:"hero_url,omitempty"`
	HeroThumbnailURL   *string       `json:"hero_thumbnail_url,omitempty"`
	Ratio              string        `json:"ratio"`
	LiveURL            *string       `json:"live_url,omitempty"`
	Tags               []string      `json:"tags,omitempty"`
	Media              []string      `json:"media,omitempty"`
	MediaThumbnailURLs []string      `json:"media_thumbnail_urls,omitempty"`
	// JSONB fields intentionally accept both objects and arrays. Petot stores
	// project statistics as an array, while the admin editor may send an object.
	Meta      json.RawMessage `json:"meta,omitempty"`
	Stats     json.RawMessage `json:"stats,omitempty"`
	CreatedBy *string         `json:"created_by,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

type ProjectSummary struct {
	ID      string  `json:"id"`
	Title   string  `json:"title"`
	Tagline *string `json:"tagline,omitempty"`
}
