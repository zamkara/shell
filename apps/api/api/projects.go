package api

import (
	"fmt"
	"log"
	"net/http"
	"terabe/internal/repositories"
	"terabe/internal/utils"
)

func ProjectsHandler(w http.ResponseWriter, r *http.Request) {
	// CMS Endpoints: /api/projects
	
	switch r.Method {
	case http.MethodGet:
		// READ: Ambil seluruh data portofolio dari Supabase DB
		projects, err := repositories.GetProjects()
		if err != nil {
			log.Printf("Failed to fetch projects: %v", err)
			http.Error(w, fmt.Sprintf(`{"error": "Failed to fetch projects: %v"}`, err), http.StatusInternalServerError)
			return
		}
		
		// Kirim response dan otomatis filter JSON sesuai parameter ?fields=...
		utils.SendResponse(w, r, projects)
		
	case http.MethodPost:
		// TODO: CMS CREATE logic (Protected by JWT)
		http.Error(w, `{"error": "POST method not yet implemented"}`, http.StatusNotImplemented)
	
	case http.MethodPut:
		// TODO: CMS UPDATE logic (Protected by JWT)
		http.Error(w, `{"error": "PUT method not yet implemented"}`, http.StatusNotImplemented)
		
	case http.MethodDelete:
		// TODO: CMS DELETE logic (Protected by JWT)
		http.Error(w, `{"error": "DELETE method not yet implemented"}`, http.StatusNotImplemented)
		
	default:
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
	}
}
