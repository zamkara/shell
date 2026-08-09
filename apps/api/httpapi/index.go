package httpapi

import (
	"net/http"
	"terabe/internal/utils"
)

// Info response structure
type APIInfo struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func IndexHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	data := APIInfo{
		Status:  "success",
		Message: "API is ready",
	}

	utils.SendResponse(w, r, data)
}
