package httpapi

import (
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"terabe/internal/middlewares"
	"terabe/internal/models"
	"terabe/internal/repositories"
)

var (
	roleNamePattern      = regexp.MustCompile(`^[a-z][a-z0-9_]*$`)
	permissionKeyPattern = regexp.MustCompile(`^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$`)
)

func UsersHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		serveCollection(w, r, "users", func(params CollectionParams) ([]models.UserSummary, int, error) {
			return repositories.GetUsers(params.Search, params.Page, params.Limit)
		})
	case http.MethodPost:
		createUser(w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
	}
}

func UserDetailHandler(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "id is required"})
		return
	}
	switch r.Method {
	case http.MethodGet:
		item, err := repositories.GetUser(r.Context(), id)
		writeAccessDetail(w, "User", item, err)
	case http.MethodPut:
		updateUser(w, r, id)
	case http.MethodDelete:
		deleteUser(w, r, id)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
	}
}

func RolesHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		serveCollection(w, r, "roles", func(params CollectionParams) ([]models.RoleSummary, int, error) {
			return repositories.GetRoles(params.Search, params.Page, params.Limit)
		})
	case http.MethodPost:
		var item models.RoleMutation
		if !decode(w, r, &item) || !validateRole(w, &item) {
			return
		}
		id, err := repositories.InsertRole(r.Context(), actorID(r), &item)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to create role"})
			return
		}
		created, err := repositories.GetRole(strconv.Itoa(int(id)))
		writeAccessDetail(w, "Role", created, err, http.StatusCreated)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
	}
}

func RoleDetailHandler(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	switch r.Method {
	case http.MethodGet:
		item, err := repositories.GetRole(id)
		writeAccessDetail(w, "Role", item, err)
	case http.MethodPut:
		numericID, err := strconv.Atoi(id)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid role id"})
			return
		}
		var item models.RoleMutation
		if !decode(w, r, &item) || !validateRole(w, &item) {
			return
		}
		err = repositories.UpdateRole(r.Context(), int32(numericID), actorID(r), item)
		if writeAccessMutationError(w, "Role", err) {
			updated, loadErr := repositories.GetRole(id)
			writeAccessDetail(w, "Role", updated, loadErr)
		}
	case http.MethodDelete:
		if writeAccessMutationError(w, "Role", repositories.DeleteRole(r.Context(), id)) {
			writeJSON(w, http.StatusOK, map[string]string{"message": "Role deleted"})
		}
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
	}
}

func PermissionsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		serveCollection(w, r, "permissions", func(params CollectionParams) ([]models.Permission, int, error) {
			return repositories.GetPermissions(params.Search, params.Page, params.Limit)
		})
	case http.MethodPost:
		var item models.PermissionMutation
		if !decode(w, r, &item) || !validatePermission(w, &item) {
			return
		}
		id, err := repositories.InsertPermission(r.Context(), &item)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to create permission"})
			return
		}
		created, err := repositories.GetPermission(strconv.Itoa(int(id)))
		writeAccessDetail(w, "Permission", created, err, http.StatusCreated)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
	}
}

func PermissionDetailHandler(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	switch r.Method {
	case http.MethodGet:
		item, err := repositories.GetPermission(id)
		writeAccessDetail(w, "Permission", item, err)
	case http.MethodPut:
		var item models.PermissionMutation
		if !decode(w, r, &item) || !validatePermission(w, &item) {
			return
		}
		if writeAccessMutationError(w, "Permission", repositories.UpdatePermission(r.Context(), id, item)) {
			updated, err := repositories.GetPermission(id)
			writeAccessDetail(w, "Permission", updated, err)
		}
	case http.MethodDelete:
		if writeAccessMutationError(w, "Permission", repositories.DeletePermission(r.Context(), id)) {
			writeJSON(w, http.StatusOK, map[string]string{"message": "Permission deleted"})
		}
	default:
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
	}
}

func actorID(r *http.Request) string {
	id, _ := r.Context().Value(middlewares.UserIDKey).(string)
	return id
}

func validateRole(w http.ResponseWriter, item *models.RoleMutation) bool {
	item.Name = strings.ToLower(strings.TrimSpace(item.Name))
	item.Description = strings.TrimSpace(item.Description)
	if !roleNamePattern.MatchString(item.Name) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Role name must be a lowercase identifier"})
		return false
	}
	return true
}

func validatePermission(w http.ResponseWriter, item *models.PermissionMutation) bool {
	item.Key = strings.ToLower(strings.TrimSpace(item.Key))
	item.Description = strings.TrimSpace(item.Description)
	if !permissionKeyPattern.MatchString(item.Key) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Permission key must use module.action"})
		return false
	}
	return true
}

func writeAccessDetail[T any](w http.ResponseWriter, label string, item T, err error, status ...int) {
	if errors.Is(err, repositories.ErrContentNotFound) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": label + " not found"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch " + strings.ToLower(label)})
		return
	}
	code := http.StatusOK
	if len(status) > 0 {
		code = status[0]
	}
	writeJSON(w, code, item)
}

func writeAccessMutationError(w http.ResponseWriter, label string, err error) bool {
	switch {
	case err == nil:
		return true
	case errors.Is(err, repositories.ErrContentNotFound):
		writeJSON(w, http.StatusNotFound, map[string]string{"error": label + " not found"})
	case errors.Is(err, repositories.ErrProtectedRole), errors.Is(err, repositories.ErrProtectedPermission), errors.Is(err, repositories.ErrLastAdmin):
		writeJSON(w, http.StatusConflict, map[string]string{"error": err.Error()})
	case errors.Is(err, repositories.ErrInvalidRole):
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
	default:
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to update " + strings.ToLower(label)})
	}
	return false
}
