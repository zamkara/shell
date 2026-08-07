package api

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"terabe/internal/db"
	"terabe/internal/utils"
)

// Info response structure
type APIInfo struct {
	Status    string `json:"status"`
	Message   string `json:"message"`
	DBVersion string `json:"db_version,omitempty"`
}

func IndexHandler(w http.ResponseWriter, r *http.Request) {
	// Ambil koneksi Singleton (Reusable)
	pool := db.GetConnection()

	// Query
	var version string
	if err := pool.QueryRow(context.Background(), "SELECT version()").Scan(&version); err != nil {
		log.Printf("Query failed: %v", err)
		http.Error(w, fmt.Sprintf(`{"error": "Query failed: %v"}`, err), http.StatusInternalServerError)
		return
	}

	// Buat objek respons
	data := APIInfo{
		Status:    "success",
		Message:   "Golang Backend on Vercel is ready with Clean Architecture!",
		DBVersion: version,
	}

	// Gunakan fungsi utilitas kita yang bisa memfilter fields secara dinamis
	utils.SendResponse(w, r, data)
}
