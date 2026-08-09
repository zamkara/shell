package handler

import (
	"net/http"

	"terabe/internal/httpapi"
)

var application = httpapi.NewHandler()

// Handler is the single Vercel Go Function entrypoint. The Vercel rewrite
// supplies the original API path through __path so the shared ServeMux sees
// the same request path as the local server.
func Handler(w http.ResponseWriter, r *http.Request) {
	if originalPath := r.URL.Query().Get("__path"); originalPath != "" {
		query := r.URL.Query()
		query.Del("__path")
		r.URL.Path = originalPath
		r.URL.RawPath = ""
		r.URL.RawQuery = query.Encode()
	}

	application.ServeHTTP(w, r)
}
