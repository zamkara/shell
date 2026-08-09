package httpapi

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"terabe/internal/models"
	"terabe/internal/repositories"
)

func ProjectsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	view := r.URL.Query().Get("view")
	if view == "card" {
		publishedOnly := !strings.HasPrefix(r.URL.Path, "/api/admin/")
		serveCollection(w, r, "projects", func(params CollectionParams) ([]models.ProjectCard, int, error) {
			return repositories.GetProjectCards(params.Search, params.Page, params.Limit, publishedOnly)
		})
		return
	}
	if view != "" && view != "summary" {
		http.Error(w, `{"error":"Unsupported collection view"}`, http.StatusBadRequest)
		return
	}

	serveCollection(w, r, "projects", func(params CollectionParams) ([]models.ProjectSummary, int, error) {
		return repositories.GetProjectSummaries(params.Search, params.Page, params.Limit)
	})
}

func ProjectDetailHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	project, err := repositories.GetProjectByID(r.PathValue("id"))
	if errors.Is(err, repositories.ErrProjectNotFound) {
		http.Error(w, `{"error": "Project not found"}`, http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("projects: detail failed: %v", err)
		http.Error(w, `{"error": "Failed to fetch project"}`, http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, project)
}
