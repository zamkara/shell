package httpapi

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"strings"

	"terabe/internal/middlewares"
	"terabe/internal/models"
	"terabe/internal/repositories"
)

const (
	maxProfileNameLength = 120
	maxAvatarURLLength   = 2048
)

type ProfileResponse struct {
	ID                string   `json:"id"`
	Email             string   `json:"email"`
	FullName          string   `json:"full_name"`
	DisplayName       string   `json:"display_name"`
	AvatarURL         string   `json:"avatar_url"`
	ResolvedAvatarURL string   `json:"resolved_avatar_url"`
	Role              string   `json:"role"`
	Roles             []string `json:"roles"`
	Permissions       []string `json:"permissions"`
	CreatedAt         string   `json:"created_at"`
	UpdatedAt         string   `json:"updated_at"`
}

func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	authUser, ok := r.Context().Value(middlewares.AuthUserKey).(middlewares.AuthUser)
	if !ok || authUser.ID == "" || authUser.Email == "" {
		writeProfileError(w, http.StatusUnauthorized, "Unauthorized access")
		return
	}

	switch r.Method {
	case http.MethodGet:
		profile, err := repositories.GetOrCreateProfile(r.Context(), profileSeed(authUser))
		if err != nil {
			log.Printf("profile: fetch %q failed: %v", authUser.ID, err)
			writeProfileError(w, http.StatusInternalServerError, "Failed to fetch profile")
			return
		}
		writeProfile(w, r, profile)
	case http.MethodPut:
		update, err := decodeProfileUpdate(r)
		if err != nil {
			writeProfileError(w, http.StatusBadRequest, err.Error())
			return
		}
		profile, err := repositories.UpdateProfile(r.Context(), profileSeed(authUser), update)
		if err != nil {
			log.Printf("profile: update %q failed: %v", authUser.ID, err)
			writeProfileError(w, http.StatusInternalServerError, "Failed to update profile")
			return
		}
		writeProfile(w, r, profile)
	default:
		w.Header().Set("Allow", "GET, PUT")
		writeProfileError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func decodeProfileUpdate(r *http.Request) (models.ProfileUpdate, error) {
	var update models.ProfileUpdate
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&update); err != nil {
		return update, profileValidationError("Invalid request body")
	}

	update.FullName = strings.TrimSpace(update.FullName)
	update.AvatarURL = strings.TrimSpace(update.AvatarURL)
	if update.FullName == "" {
		return update, profileValidationError("Full name is required")
	}
	if len(update.FullName) > maxProfileNameLength {
		return update, profileValidationError("Full name is too long")
	}
	if len(update.AvatarURL) > maxAvatarURLLength {
		return update, profileValidationError("Avatar URL is too long")
	}
	if update.AvatarURL != "" && !isHTTPURL(update.AvatarURL) {
		return update, profileValidationError("Avatar URL must use http or https")
	}
	return update, nil
}

type profileValidationError string

func (err profileValidationError) Error() string { return string(err) }

func isHTTPURL(value string) bool {
	parsed, err := url.ParseRequestURI(value)
	return err == nil && parsed.Host != "" && (parsed.Scheme == "http" || parsed.Scheme == "https")
}

func profileSeed(user middlewares.AuthUser) models.ProfileSeed {
	return models.ProfileSeed{
		ID:        user.ID,
		Email:     user.Email,
		FullName:  user.FullName,
		AvatarURL: user.AvatarURL,
	}
}

func writeProfile(w http.ResponseWriter, r *http.Request, profile models.Profile) {
	access, _ := middlewares.AccessFromContext(r.Context())
	resolvedAvatarURL := profile.AvatarURL
	if resolvedAvatarURL == "" {
		resolvedAvatarURL = gravatarURL(profile.Email)
	}
	displayName := profile.FullName
	if displayName == "" {
		displayName = profileName(profile.Email)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ProfileResponse{
		ID:                profile.ID,
		Email:             profile.Email,
		FullName:          profile.FullName,
		DisplayName:       displayName,
		AvatarURL:         profile.AvatarURL,
		ResolvedAvatarURL: resolvedAvatarURL,
		Role:              primaryRole(access.Roles),
		Roles:             access.Roles,
		Permissions:       access.Permissions,
		CreatedAt:         profile.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		UpdatedAt:         profile.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z"),
	})
}

func writeProfileError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
