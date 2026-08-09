package httpapi

import (
	"net/http"

	"terabe/internal/middlewares"
)

// NewHandler builds the complete API router for both the local HTTP server and
// the Vercel Go Function. Route registration is centralized so both runtimes
// expose exactly the same endpoint contract.
func NewHandler() http.Handler {
	mux := http.NewServeMux()

	authenticated := func(handler http.Handler) http.Handler {
		return middlewares.SupabaseAuthMiddleware(
			middlewares.LoadAccessMiddleware(handler),
		)
	}
	withPermission := func(permission string, handler http.Handler) http.Handler {
		return authenticated(middlewares.RequirePermissionMiddleware(permission, handler))
	}
	adminPermission := func(permission string, handler http.Handler) http.Handler {
		return authenticated(middlewares.RequireRoleMiddleware("admin",
			middlewares.RequirePermissionMiddleware(permission, handler),
		))
	}
	adminResource := func(module string, handler http.HandlerFunc) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			adminPermission(module+"."+actionForMethod(r.Method), handler).ServeHTTP(w, r)
		})
	}
	permissionResource := func(module string, handler http.HandlerFunc) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			withPermission(module+"."+actionForMethod(r.Method), handler).ServeHTTP(w, r)
		})
	}
	publicReadOnly := func(handler http.HandlerFunc) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodGet {
				writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
				return
			}
			handler.ServeHTTP(w, r)
		})
	}

	mux.HandleFunc("/api", IndexHandler)
	mux.HandleFunc("/api/projects", ProjectsHandler)
	mux.HandleFunc("/api/projects/{id}", ProjectDetailHandler)
	mux.Handle("/api/faqs", publicReadOnly(FAQsHandler))
	mux.HandleFunc("/api/faqs/{id}", FAQDetailHandler)
	mux.Handle("/api/pricing", publicReadOnly(PricingHandler))
	mux.HandleFunc("/api/pricing/{id}", PricingDetailHandler)
	mux.Handle("/api/content", publicReadOnly(ContentHandler))
	mux.HandleFunc("/api/content/{id}", SiteSettingDetailHandler)
	mux.HandleFunc("/api/auth/login", LoginHandler)
	mux.Handle("/api/auth/session", withPermission("shell.access", http.HandlerFunc(SessionHandler)))
	mux.Handle("/api/profile", permissionResource("profile", ProfileHandler))

	mux.Handle("/api/admin/projects", permissionResource("projects", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			ProjectsHandler(w, r)
			return
		}
		AdminProjectsHandler(w, r)
	})))
	mux.Handle("/api/admin/projects/{id}", withPermission("projects.read", http.HandlerFunc(ProjectDetailHandler)))
	mux.Handle("/api/admin/faqs", permissionResource("faqs", FAQsHandler))
	mux.Handle("/api/admin/faqs/{id}", withPermission("faqs.read", http.HandlerFunc(FAQDetailHandler)))
	mux.Handle("/api/admin/pricing", permissionResource("pricing", PricingHandler))
	mux.Handle("/api/admin/pricing/{id}", withPermission("pricing.read", http.HandlerFunc(PricingDetailHandler)))
	mux.Handle("/api/admin/content", permissionResource("content", ContentHandler))
	mux.Handle("/api/admin/content/{id}", withPermission("content.read", http.HandlerFunc(SiteSettingDetailHandler)))

	mux.Handle("/api/admin/users", adminResource("users", UsersHandler))
	mux.Handle("/api/admin/users/{id}", adminResource("users", UserDetailHandler))
	mux.Handle("/api/admin/roles", adminResource("roles", RolesHandler))
	mux.Handle("/api/admin/roles/{id}", adminResource("roles", RoleDetailHandler))
	mux.Handle("/api/admin/permissions", adminResource("permissions", PermissionsHandler))
	mux.Handle("/api/admin/permissions/{id}", adminResource("permissions", PermissionDetailHandler))

	return mux
}

func actionForMethod(method string) string {
	switch method {
	case http.MethodPost:
		return "create"
	case http.MethodPut:
		return "update"
	case http.MethodDelete:
		return "delete"
	default:
		return "read"
	}
}
