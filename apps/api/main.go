package main

import (
	"log"
	"net/http"
	"os"

	"terabe/api"
	"terabe/internal/middlewares"
)

func main() {
	mux := http.NewServeMux()

	// 1. Public Endpoints (Read-Only & Auth)
	mux.HandleFunc("/api", api.IndexHandler)
	mux.HandleFunc("/api/projects", api.ProjectsHandler)
	mux.HandleFunc("/api/auth/login", api.LoginHandler) // Endpoint login baru kita yang elegan!

	// 2. Protected Endpoints (CMS / Admin Only)
	// Kita gabungkan JWT middleware dan Role checker ('admin') berurutan.
	adminHandler := middlewares.SupabaseAuthMiddleware(
		middlewares.RequireRoleMiddleware("admin", http.HandlerFunc(api.AdminProjectsHandler)),
	)
	mux.Handle("/api/admin/projects", adminHandler)

	// Vercel akan menyuntikkan environment variable PORT
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server listening on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
