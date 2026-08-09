package httpapi

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/mail"
	"os"
	"strings"
	"time"

	"terabe/internal/models"
	"terabe/internal/repositories"
)

var supabaseAdminClient = &http.Client{Timeout: 15 * time.Second}

type supabaseAdminUser struct {
	ID string `json:"id"`
}

func createUser(w http.ResponseWriter, r *http.Request) {
	var item models.UserCreate
	if !decode(w, r, &item) || !validateUserCreate(w, &item) {
		return
	}
	if err := repositories.ValidateRoleIDs(r.Context(), item.RoleIDs); err != nil {
		writeAccessMutationError(w, "User", err)
		return
	}
	created, err := callSupabaseAdmin(http.MethodPost, "/auth/v1/admin/users", map[string]interface{}{
		"email": item.Email, "password": item.Password, "email_confirm": true,
		"user_metadata": map[string]string{"full_name": item.FullName, "avatar_url": item.AvatarURL},
	})
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "Failed to create authentication user"})
		return
	}
	if err = repositories.InsertUserProfile(r.Context(), created.ID, actorID(r), item); err != nil {
		_, _ = callSupabaseAdmin(http.MethodDelete, "/auth/v1/admin/users/"+created.ID, nil)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to create user profile"})
		return
	}
	result, err := repositories.GetUser(r.Context(), created.ID)
	writeAccessDetail(w, "User", result, err, http.StatusCreated)
}

func updateUser(w http.ResponseWriter, r *http.Request, id string) {
	var item models.UserUpdate
	if !decode(w, r, &item) || !validateUserUpdate(w, &item) {
		return
	}
	if err := repositories.EnsureAdminRemains(r.Context(), id, item.RoleIDs); err != nil {
		writeAccessMutationError(w, "User", err)
		return
	}
	_, err := callSupabaseAdmin(http.MethodPut, "/auth/v1/admin/users/"+id, map[string]interface{}{
		"email": item.Email, "user_metadata": map[string]string{"full_name": item.FullName, "avatar_url": item.AvatarURL},
	})
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "Failed to update authentication user"})
		return
	}
	if !writeAccessMutationError(w, "User", repositories.UpdateUser(r.Context(), id, actorID(r), item)) {
		return
	}
	updated, err := repositories.GetUser(r.Context(), id)
	writeAccessDetail(w, "User", updated, err)
}

func deleteUser(w http.ResponseWriter, r *http.Request, id string) {
	if id == actorID(r) {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "You cannot delete your own account"})
		return
	}
	if !writeAccessMutationError(w, "User", repositories.CanRemoveUser(r.Context(), id)) {
		return
	}
	if _, err := callSupabaseAdmin(http.MethodDelete, "/auth/v1/admin/users/"+id, nil); err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "Failed to delete authentication user"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "User deleted"})
}

func validateUserCreate(w http.ResponseWriter, item *models.UserCreate) bool {
	if !validateUserFields(w, &item.Email, &item.FullName, &item.AvatarURL) {
		return false
	}
	if len(item.Password) < 8 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Password must contain at least 8 characters"})
		return false
	}
	return true
}

func validateUserUpdate(w http.ResponseWriter, item *models.UserUpdate) bool {
	return validateUserFields(w, &item.Email, &item.FullName, &item.AvatarURL)
}

func validateUserFields(w http.ResponseWriter, email, fullName, avatarURL *string) bool {
	*email = strings.ToLower(strings.TrimSpace(*email))
	*fullName = strings.TrimSpace(*fullName)
	*avatarURL = strings.TrimSpace(*avatarURL)
	address, err := mail.ParseAddress(*email)
	if err != nil || address.Address != *email {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "A valid email is required"})
		return false
	}
	if *fullName == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Full name is required"})
		return false
	}
	if *avatarURL != "" && !isHTTPURL(*avatarURL) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Avatar URL must use http or https"})
		return false
	}
	return true
}

func callSupabaseAdmin(method, path string, body interface{}) (supabaseAdminUser, error) {
	var result supabaseAdminUser
	baseURL := strings.TrimSuffix(os.Getenv("SUPABASE_URL"), "/")
	secret := os.Getenv("SUPABASE_SECRET_KEY")
	if secret == "" {
		secret = os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	}
	if baseURL == "" || secret == "" {
		return result, fmt.Errorf("Supabase admin credentials are not configured")
	}
	var reader io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			return result, err
		}
		reader = bytes.NewReader(raw)
	}
	request, err := http.NewRequest(method, baseURL+path, reader)
	if err != nil {
		return result, err
	}
	request.Header.Set("apikey", secret)
	// New sb_secret keys are not JWTs and must stay out of the Bearer header.
	// Legacy service_role keys are JWTs and still require the Auth header.
	if !strings.HasPrefix(secret, "sb_secret_") {
		request.Header.Set("Authorization", "Bearer "+secret)
	}
	request.Header.Set("Content-Type", "application/json")
	response, err := supabaseAdminClient.Do(request)
	if err != nil {
		return result, err
	}
	defer response.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(response.Body, 1<<20))
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return result, fmt.Errorf("Supabase admin returned %d: %s", response.StatusCode, string(raw))
	}
	if len(raw) > 0 && method != http.MethodDelete {
		if err = json.Unmarshal(raw, &result); err != nil {
			return result, err
		}
	}
	return result, nil
}
