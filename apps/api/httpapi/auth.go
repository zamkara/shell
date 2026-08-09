package httpapi

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"terabe/internal/middlewares"
	"terabe/internal/repositories"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type SessionResponse struct {
	Authenticated bool        `json:"authenticated"`
	UserID        string      `json:"user_id"`
	User          SessionUser `json:"user"`
}

type SessionUser struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Email       string   `json:"email"`
	AvatarURL   string   `json:"avatar_url"`
	Role        string   `json:"role"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
}

func SessionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	authUser, ok := r.Context().Value(middlewares.AuthUserKey).(middlewares.AuthUser)
	if !ok || authUser.ID == "" {
		http.Error(w, `{"error": "Unauthorized access"}`, http.StatusUnauthorized)
		return
	}
	access, _ := middlewares.AccessFromContext(r.Context())
	role := primaryRole(access.Roles)
	profile, err := repositories.GetOrCreateProfile(r.Context(), profileSeed(authUser))
	if err != nil {
		log.Printf("session: fetch profile %q failed: %v", authUser.ID, err)
		http.Error(w, `{"error": "Failed to fetch profile"}`, http.StatusInternalServerError)
		return
	}
	name := profile.FullName
	if name == "" {
		name = profileName(profile.Email)
	}
	avatarURL := profile.AvatarURL
	if avatarURL == "" {
		avatarURL = gravatarURL(profile.Email)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(SessionResponse{
		Authenticated: true,
		UserID:        authUser.ID,
		User: SessionUser{
			ID:          authUser.ID,
			Name:        name,
			Email:       profile.Email,
			AvatarURL:   avatarURL,
			Role:        role,
			Roles:       access.Roles,
			Permissions: access.Permissions,
		},
	})
}

func primaryRole(roles []string) string {
	for _, role := range roles {
		if role == "admin" {
			return role
		}
	}
	if len(roles) > 0 {
		return roles[0]
	}
	return ""
}

func profileName(email string) string {
	local, _, _ := strings.Cut(email, "@")
	if local == "" {
		return "User"
	}
	return local
}

func gravatarURL(email string) string {
	normalized := strings.ToLower(strings.TrimSpace(email))
	if normalized == "" {
		return ""
	}
	hash := sha256.Sum256([]byte(normalized))
	return fmt.Sprintf("https://www.gravatar.com/avatar/%x?s=80&d=identicon", hash)
}

// LoginHandler berfungsi sebagai jembatan (proxy) untuk menyembunyikan URL asli Supabase.
// Anda tidak perlu lagi melihat /v1/ atau domain supabase.co.
func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// 1. Baca request dari klien (Frontend Anda)
	var reqBody LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	// 2. Siapkan URL Supabase yang sesungguhnya di belakang layar
	supabaseURL := os.Getenv("SUPABASE_URL")
	anonKey := os.Getenv("SUPABASE_ANON_KEY") // Publishable Key

	if supabaseURL == "" || anonKey == "" {
		http.Error(w, `{"error": "Server is missing Supabase credentials"}`, http.StatusInternalServerError)
		return
	}

	supabaseURL = strings.TrimSuffix(supabaseURL, "/")
	targetURL := supabaseURL + "/auth/v1/token?grant_type=password"

	// 3. Buat payload untuk dilempar ke Supabase
	payloadBytes, _ := json.Marshal(reqBody)

	// 4. Lakukan request ke Supabase dari sisi Server (Backend)
	req, err := http.NewRequest(http.MethodPost, targetURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		http.Error(w, `{"error": "Failed to create upstream request"}`, http.StatusInternalServerError)
		return
	}
	req.Header.Set("apikey", anonKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, `{"error": "Failed to reach authentication server"}`, http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// 5. Kembalikan response langsung ke klien dengan status code yang sama
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}
