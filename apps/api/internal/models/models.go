package models

import (
	"time"
)

type Project struct {
	ID        string                 `json:"id"`
	Slug      string                 `json:"slug"`
	Title     string                 `json:"title"`
	Tagline   *string                `json:"tagline,omitempty"`
	Challenge *string                `json:"challenge,omitempty"`
	Solution  *string                `json:"solution,omitempty"`
	ImageURL  string                 `json:"image_url"`
	HeroURL   *string                `json:"hero_url,omitempty"`
	Ratio     string                 `json:"ratio"`
	LiveURL   *string                `json:"live_url,omitempty"`
	Tags      []string               `json:"tags,omitempty"`
	Media     []string               `json:"media,omitempty"`
	Meta      map[string]interface{} `json:"meta,omitempty"`
	Stats     map[string]interface{} `json:"stats,omitempty"`
	CreatedBy *string                `json:"created_by,omitempty"`
	CreatedAt time.Time              `json:"created_at"`
}
