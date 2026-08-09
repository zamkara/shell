package httpapi

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"terabe/internal/middlewares"
	"terabe/internal/models"
	"terabe/internal/repositories"
)

func normalizeProjectStatus(p *models.Project) bool {
	if p.Status == "" {
		p.Status = models.ProjectStatusDraft
	}

	return p.Status.IsValid()
}

func hasString(value *string) bool {
	return value != nil && strings.TrimSpace(*value) != ""
}

func hasImagePairs(p *models.Project) bool {
	if (strings.TrimSpace(p.ImageURL) != "") != (strings.TrimSpace(p.ImageThumbnailURL) != "") {
		return false
	}
	if hasString(p.HeroURL) != hasString(p.HeroThumbnailURL) {
		return false
	}
	if len(p.Media) != len(p.MediaThumbnailURLs) {
		return false
	}
	for index, mediaURL := range p.Media {
		if (strings.TrimSpace(mediaURL) != "") != (strings.TrimSpace(p.MediaThumbnailURLs[index]) != "") {
			return false
		}
	}
	return true
}

// AdminProjectsHandler menangani request POST, PUT, DELETE untuk proyek CMS
func AdminProjectsHandler(w http.ResponseWriter, r *http.Request) {
	// Ambil ID User dari middleware untuk pencatatan (Audit Trail)
	userID, _ := r.Context().Value(middlewares.UserIDKey).(string)

	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodPost:
		var p models.Project
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, `{"error": "Invalid request payload"}`, http.StatusBadRequest)
			return
		}
		if !normalizeProjectStatus(&p) {
			http.Error(w, `{"error": "Invalid project status"}`, http.StatusBadRequest)
			return
		}
		if !hasImagePairs(&p) {
			http.Error(w, `{"error": "Every project image requires a matching thumbnail URL"}`, http.StatusBadRequest)
			return
		}

		if err := repositories.InsertProject(&p, userID); err != nil {
			log.Printf("admin projects: create failed: %v", err)
			http.Error(w, `{"error": "Failed to create project"}`, http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Project created successfully",
			"id":      p.ID,
		})

	case http.MethodPut:
		// Mengharapkan /api/admin/projects?id=...
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, `{"error": "Project ID is required"}`, http.StatusBadRequest)
			return
		}

		var p models.Project
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, `{"error": "Invalid request payload"}`, http.StatusBadRequest)
			return
		}
		if !normalizeProjectStatus(&p) {
			http.Error(w, `{"error": "Invalid project status"}`, http.StatusBadRequest)
			return
		}
		if !hasImagePairs(&p) {
			http.Error(w, `{"error": "Every project image requires a matching thumbnail URL"}`, http.StatusBadRequest)
			return
		}

		if err := repositories.UpdateProject(id, &p); err != nil {
			if strings.Contains(err.Error(), "not found") {
				http.Error(w, `{"error": "Project not found"}`, http.StatusNotFound)
				return
			}
			log.Printf("admin projects: update %q failed: %v", id, err)
			http.Error(w, `{"error": "Failed to update project"}`, http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"message": "Project updated successfully"})

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, `{"error": "Project ID is required"}`, http.StatusBadRequest)
			return
		}

		if err := repositories.DeleteProject(id); err != nil {
			if strings.Contains(err.Error(), "not found") {
				http.Error(w, `{"error": "Project not found"}`, http.StatusNotFound)
				return
			}
			log.Printf("admin projects: delete %q failed: %v", id, err)
			http.Error(w, `{"error": "Failed to delete project"}`, http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"message": "Project deleted successfully"})

	default:
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}
