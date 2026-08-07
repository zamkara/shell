package api

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
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
