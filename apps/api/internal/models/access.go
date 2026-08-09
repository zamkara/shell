package models

import "time"

type UserSummary struct {
	ID          string   `json:"id"`
	Email       string   `json:"email"`
	DisplayName string   `json:"display_name"`
	Roles       []string `json:"roles"`
}

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	AvatarURL string    `json:"avatar_url"`
	RoleIDs   []int32   `json:"role_ids"`
	Roles     []string  `json:"roles"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UserCreate struct {
	Email     string  `json:"email"`
	Password  string  `json:"password"`
	FullName  string  `json:"full_name"`
	AvatarURL string  `json:"avatar_url"`
	RoleIDs   []int32 `json:"role_ids"`
}

type UserUpdate struct {
	Email     string  `json:"email"`
	FullName  string  `json:"full_name"`
	AvatarURL string  `json:"avatar_url"`
	RoleIDs   []int32 `json:"role_ids"`
}

type RoleSummary struct {
	ID              int32  `json:"id"`
	Name            string `json:"name"`
	PermissionCount int32  `json:"permission_count"`
	IsSystem        bool   `json:"is_system"`
}

type Role struct {
	ID            int32     `json:"id"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	IsSystem      bool      `json:"is_system"`
	PermissionIDs []int32   `json:"permission_ids"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type RoleMutation struct {
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	PermissionIDs []int32 `json:"permission_ids"`
}

type Permission struct {
	ID          int32     `json:"id"`
	Key         string    `json:"key"`
	Module      string    `json:"module"`
	Action      string    `json:"action"`
	Description string    `json:"description"`
	IsSystem    bool      `json:"is_system"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type PermissionMutation struct {
	Key         string `json:"key"`
	Description string `json:"description"`
}
