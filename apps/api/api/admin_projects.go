package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"terabe/internal/models"
	"terabe/internal/repositories"
	"terabe/internal/middlewares"
)

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

		if err := repositories.InsertProject(&p, userID); err != nil {
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

		if err := repositories.UpdateProject(id, &p); err != nil {
			if strings.Contains(err.Error(), "not found") {
				http.Error(w, `{"error": "Project not found"}`, http.StatusNotFound)
				return
			}
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
			http.Error(w, `{"error": "Failed to delete project"}`, http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"message": "Project deleted successfully"})

	default:
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}
