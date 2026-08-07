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

const UserIDKey contextKey = "user_id"

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
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error": "Authorization header is missing"}`, http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
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

		// Ambil User ID (sub) dari Claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if sub, ok := claims["sub"].(string); ok {
				// Masukkan User ID ke dalam context agar bisa dipakai di layer Handler
				ctx := context.WithValue(r.Context(), UserIDKey, sub)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
		}

		http.Error(w, `{"error": "Invalid token claims"}`, http.StatusUnauthorized)
	})
}

// RequireRoleMiddleware memverifikasi bahwa User ID memiliki Role spesifik di database
func RequireRoleMiddleware(requiredRole string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(UserIDKey).(string)
		if !ok || userID == "" {
			http.Error(w, `{"error": "Unauthorized access"}`, http.StatusUnauthorized)
			return
		}

		pool := db.GetConnection()

		// Cek role user di database relasional kita
		query := `
			SELECT r.name 
			FROM user_roles ur 
			JOIN roles r ON ur.role_id = r.id 
			WHERE ur.user_id = $1 AND r.name = $2
		`
		var roleName string
		err := pool.QueryRow(r.Context(), query, userID, requiredRole).Scan(&roleName)
		if err != nil || roleName == "" {
			http.Error(w, fmt.Sprintf(`{"error": "Forbidden: Requires %s role"}`, requiredRole), http.StatusForbidden)
			return
		}

		// Lolos verifikasi Role, teruskan request
		next.ServeHTTP(w, r)
	})
}
