package middlewares

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
	"terabe/internal/db"
)

type contextKey string

const (
	UserIDKey   contextKey = "user_id"
	AuthUserKey contextKey = "auth_user"
	RoleKey     contextKey = "role"
	AccessKey   contextKey = "access"
)

type AuthUser struct {
	ID        string
	Email     string
	FullName  string
	AvatarURL string
}

type AccessControl struct {
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
}

func (access AccessControl) HasRole(role string) bool {
	return contains(access.Roles, role)
}

func (access AccessControl) HasPermission(permission string) bool {
	return contains(access.Permissions, permission)
}

func contains(values []string, wanted string) bool {
	for _, value := range values {
		if value == wanted {
			return true
		}
	}
	return false
}

var (
	jwks        keyfunc.Keyfunc
	jwksOnce    sync.Once
	jwksInitErr error
)

func getJWKS() (keyfunc.Keyfunc, error) {
	jwksOnce.Do(func() {
		supabaseURL := os.Getenv("SUPABASE_URL")
		if supabaseURL == "" {
			jwksInitErr = fmt.Errorf("SUPABASE_URL is not set for JWKS")
			return
		}

		supabaseURL = strings.TrimSuffix(supabaseURL, "/")
		jwksURL := supabaseURL + "/auth/v1/.well-known/jwks.json"
		jwks, jwksInitErr = keyfunc.NewDefault([]string{jwksURL})
	})
	return jwks, jwksInitErr
}

// SupabaseAuthMiddleware memverifikasi JWT dari Supabase
func SupabaseAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := ""
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			// Fallback: cari dari Cookie jika Authorization header tidak ada
			cookie, err := r.Cookie("access_token")
			if err == nil {
				tokenString = cookie.Value
			}
		}

		if tokenString == "" {
			http.Error(w, `{"error": "Authorization token is missing"}`, http.StatusUnauthorized)
			return
		}
		if tokenString == authHeader {
			http.Error(w, `{"error": "Invalid token format"}`, http.StatusUnauthorized)
			return
		}

		// Validasi dan parsing token secara dinamis (Mendukung HS256 & ES256)
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			switch token.Method.(type) {
			case *jwt.SigningMethodHMAC:
				secret := os.Getenv("SUPABASE_JWT_SECRET")
				if secret == "" {
					return nil, fmt.Errorf("SUPABASE_JWT_SECRET is missing for HMAC token")
				}
				return []byte(secret), nil
			default:
				// Gunakan JWKS untuk Asymmetric keys (seperti ES256)
				k, err := getJWKS()
				if err != nil {
					return nil, err
				}
				return k.Keyfunc(token)
			}
		})

		if err != nil || !token.Valid {
			http.Error(w, fmt.Sprintf(`{"error": "Invalid token: %v"}`, err), http.StatusUnauthorized)
			return
		}

		// Ambil identitas user dari claims satu kali untuk semua handler berikutnya.
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if sub, ok := claims["sub"].(string); ok {
				ctx := context.WithValue(r.Context(), UserIDKey, sub)
				ctx = context.WithValue(ctx, AuthUserKey, AuthUser{
					ID:        sub,
					Email:     stringClaim(claims, "email"),
					FullName:  metadataClaim(claims, "full_name", "name"),
					AvatarURL: metadataClaim(claims, "avatar_url", "picture"),
				})
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
		}

		http.Error(w, `{"error": "Invalid token claims"}`, http.StatusUnauthorized)
	})
}

func stringClaim(claims jwt.MapClaims, key string) string {
	value, _ := claims[key].(string)
	return strings.TrimSpace(value)
}

func metadataClaim(claims jwt.MapClaims, keys ...string) string {
	metadata, _ := claims["user_metadata"].(map[string]interface{})
	for _, key := range keys {
		if value, ok := metadata[key].(string); ok && strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

// LoadAccessMiddleware loads all roles and effective permissions in one query.
// Downstream role and permission checks are in-memory, so chained checks never
// add database round trips or create N+1 behavior.
func LoadAccessMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(UserIDKey).(string)
		if !ok || userID == "" {
			http.Error(w, `{"error": "Unauthorized access"}`, http.StatusUnauthorized)
			return
		}

		query := `
			SELECT
				COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]),
				COALESCE(array_agg(DISTINCT p.key) FILTER (WHERE p.key IS NOT NULL), ARRAY[]::text[])
			FROM user_roles ur
			JOIN roles r ON r.id = ur.role_id
			LEFT JOIN role_permissions rp ON rp.role_id = r.id
			LEFT JOIN permissions p ON p.id = rp.permission_id
			WHERE ur.user_id = $1
		`
		var access AccessControl
		if err := db.GetConnection().QueryRow(r.Context(), query, userID).Scan(&access.Roles, &access.Permissions); err != nil {
			http.Error(w, `{"error": "Failed to resolve access"}`, http.StatusInternalServerError)
			return
		}
		ctx := context.WithValue(r.Context(), AccessKey, access)
		if len(access.Roles) > 0 {
			ctx = context.WithValue(ctx, RoleKey, access.Roles[0])
		}
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func AccessFromContext(ctx context.Context) (AccessControl, bool) {
	access, ok := ctx.Value(AccessKey).(AccessControl)
	return access, ok
}

func RequireRoleMiddleware(requiredRole string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		access, ok := AccessFromContext(r.Context())
		if !ok || !access.HasRole(requiredRole) {
			http.Error(w, fmt.Sprintf(`{"error": "Forbidden: Requires %s role"}`, requiredRole), http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func RequirePermissionMiddleware(permission string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		access, ok := AccessFromContext(r.Context())
		if !ok || !access.HasPermission(permission) {
			http.Error(w, fmt.Sprintf(`{"error": "Forbidden: Requires %s permission"}`, permission), http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
