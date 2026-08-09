package repositories

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"terabe/internal/db"
	"terabe/internal/models"
)

var (
	ErrProtectedRole       = errors.New("system role is protected")
	ErrProtectedPermission = errors.New("system permission is protected")
	ErrLastAdmin           = errors.New("at least one admin must remain")
	ErrInvalidRole         = errors.New("one or more roles do not exist")
)

func GetUsers(search string, page, limit int) ([]models.UserSummary, int, error) {
	where := `WHERE ($1 = '' OR p.email ILIKE '%' || $1 || '%' OR COALESCE(p.full_name, '') ILIKE '%' || $1 || '%')`
	return queryCollection(collectionQuery{
		listSQL: `SELECT p.id, p.email, COALESCE(NULLIF(p.full_name, ''), split_part(p.email, '@', 1)),
			COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[])
			FROM profiles p LEFT JOIN user_roles ur ON ur.user_id=p.id LEFT JOIN roles r ON r.id=ur.role_id ` + where + `
			GROUP BY p.id ORDER BY p.created_at DESC, p.id LIMIT $2 OFFSET $3`,
		countSQL: `SELECT COUNT(*) FROM profiles p ` + where,
		args:     []interface{}{search}, page: page, limit: limit,
	}, func(row pgx.CollectableRow) (models.UserSummary, error) {
		var item models.UserSummary
		err := row.Scan(&item.ID, &item.Email, &item.DisplayName, &item.Roles)
		return item, err
	})
}

func GetUser(_ context.Context, id string) (models.User, error) {
	return queryContentDetail(`SELECT p.id, p.email, COALESCE(p.full_name,''), COALESCE(p.avatar_url,''),
		COALESCE(array_agg(DISTINCT r.id) FILTER (WHERE r.id IS NOT NULL), ARRAY[]::int4[]),
		COALESCE(array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]),
		p.created_at, p.updated_at
		FROM profiles p LEFT JOIN user_roles ur ON ur.user_id=p.id LEFT JOIN roles r ON r.id=ur.role_id
		WHERE p.id=$1 GROUP BY p.id`, id, func(row pgx.Row) (models.User, error) {
		var item models.User
		err := row.Scan(&item.ID, &item.Email, &item.FullName, &item.AvatarURL, &item.RoleIDs, &item.Roles, &item.CreatedAt, &item.UpdatedAt)
		return item, err
	})
}

func InsertUserProfile(ctx context.Context, id, assignedBy string, item models.UserCreate) error {
	tx, err := db.GetConnection().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, `INSERT INTO profiles (id,email,full_name,avatar_url) VALUES ($1,$2,NULLIF($3,''),NULLIF($4,''))
		ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,full_name=EXCLUDED.full_name,avatar_url=EXCLUDED.avatar_url`, id, item.Email, item.FullName, item.AvatarURL); err != nil {
		return err
	}
	if err = replaceUserRoles(ctx, tx, id, assignedBy, item.RoleIDs); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func UpdateUser(ctx context.Context, id, assignedBy string, item models.UserUpdate) error {
	tx, err := db.GetConnection().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	result, err := tx.Exec(ctx, `UPDATE profiles SET email=$1,full_name=NULLIF($2,''),avatar_url=NULLIF($3,'') WHERE id=$4`, item.Email, item.FullName, item.AvatarURL, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrContentNotFound
	}
	if err = replaceUserRoles(ctx, tx, id, assignedBy, item.RoleIDs); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func replaceUserRoles(ctx context.Context, tx pgx.Tx, userID, assignedBy string, roleIDs []int32) error {
	if _, err := tx.Exec(ctx, `DELETE FROM user_roles WHERE user_id=$1`, userID); err != nil {
		return err
	}
	if len(roleIDs) == 0 {
		return nil
	}
	_, err := tx.Exec(ctx, `INSERT INTO user_roles (user_id,role_id,assigned_by)
		SELECT $1, role_id, $2 FROM (SELECT DISTINCT unnest($3::int4[]) role_id) roles`, userID, assignedBy, roleIDs)
	return err
}

func CanRemoveUser(ctx context.Context, id string) error {
	var isAdmin bool
	var adminCount int
	err := db.GetConnection().QueryRow(ctx, `SELECT
		EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=$1 AND r.name='admin'),
		(SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.name='admin')`, id).Scan(&isAdmin, &adminCount)
	if err != nil {
		return err
	}
	if isAdmin && adminCount <= 1 {
		return ErrLastAdmin
	}
	return nil
}

func EnsureAdminRemains(ctx context.Context, id string, nextRoleIDs []int32) error {
	var currentAdmin, nextAdmin bool
	var adminCount, matchedRoles int
	err := db.GetConnection().QueryRow(ctx, `SELECT
		EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=$1 AND r.name='admin'),
		EXISTS(SELECT 1 FROM roles r WHERE r.name='admin' AND r.id=ANY($2::int4[])),
		(SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE r.name='admin'),
		(SELECT COUNT(DISTINCT r.id) FROM roles r WHERE r.id=ANY($2::int4[]))`, id, nextRoleIDs).Scan(&currentAdmin, &nextAdmin, &adminCount, &matchedRoles)
	if err != nil {
		return err
	}
	if currentAdmin && !nextAdmin && adminCount <= 1 {
		return ErrLastAdmin
	}
	if matchedRoles != uniqueInt32Count(nextRoleIDs) {
		return ErrInvalidRole
	}
	return nil
}

func ValidateRoleIDs(ctx context.Context, ids []int32) error {
	var count int
	if err := db.GetConnection().QueryRow(ctx, `SELECT COUNT(DISTINCT id) FROM roles WHERE id=ANY($1::int4[])`, ids).Scan(&count); err != nil {
		return err
	}
	if count != uniqueInt32Count(ids) {
		return ErrInvalidRole
	}
	return nil
}

func uniqueInt32Count(values []int32) int {
	seen := make(map[int32]struct{}, len(values))
	for _, value := range values {
		seen[value] = struct{}{}
	}
	return len(seen)
}

func GetRoles(search string, page, limit int) ([]models.RoleSummary, int, error) {
	where := `WHERE ($1 = '' OR r.name ILIKE '%' || $1 || '%' OR COALESCE(r.description,'') ILIKE '%' || $1 || '%')`
	return queryCollection(collectionQuery{
		listSQL:  `SELECT r.id,r.name,COUNT(rp.permission_id)::int4,r.is_system FROM roles r LEFT JOIN role_permissions rp ON rp.role_id=r.id ` + where + ` GROUP BY r.id ORDER BY r.name LIMIT $2 OFFSET $3`,
		countSQL: `SELECT COUNT(*) FROM roles r ` + where,
		args:     []interface{}{search}, page: page, limit: limit,
	}, func(row pgx.CollectableRow) (models.RoleSummary, error) {
		var item models.RoleSummary
		err := row.Scan(&item.ID, &item.Name, &item.PermissionCount, &item.IsSystem)
		return item, err
	})
}

func GetRole(id string) (models.Role, error) {
	return queryContentDetail(`SELECT r.id,r.name,COALESCE(r.description,''),r.is_system,
		COALESCE(array_agg(DISTINCT rp.permission_id) FILTER (WHERE rp.permission_id IS NOT NULL), ARRAY[]::int4[]),r.created_at,r.updated_at
		FROM roles r LEFT JOIN role_permissions rp ON rp.role_id=r.id WHERE r.id=$1 GROUP BY r.id`, id, func(row pgx.Row) (models.Role, error) {
		var item models.Role
		err := row.Scan(&item.ID, &item.Name, &item.Description, &item.IsSystem, &item.PermissionIDs, &item.CreatedAt, &item.UpdatedAt)
		return item, err
	})
}

func InsertRole(ctx context.Context, actor string, item *models.RoleMutation) (int32, error) {
	tx, err := db.GetConnection().Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)
	var id int32
	if err = tx.QueryRow(ctx, `INSERT INTO roles (name,description) VALUES ($1,NULLIF($2,'')) RETURNING id`, item.Name, item.Description).Scan(&id); err != nil {
		return 0, err
	}
	if err = replaceRolePermissions(ctx, tx, id, actor, item.PermissionIDs); err != nil {
		return 0, err
	}
	return id, tx.Commit(ctx)
}

func UpdateRole(ctx context.Context, id int32, actor string, item models.RoleMutation) error {
	tx, err := db.GetConnection().Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var system bool
	var roleName string
	if err = tx.QueryRow(ctx, `SELECT is_system,name FROM roles WHERE id=$1 FOR UPDATE`, id).Scan(&system, &roleName); errors.Is(err, pgx.ErrNoRows) {
		return ErrContentNotFound
	} else if err != nil {
		return err
	}
	if system {
		if _, err = tx.Exec(ctx, `UPDATE roles SET description=NULLIF($1,'') WHERE id=$2`, item.Description, id); err != nil {
			return err
		}
	} else if _, err = tx.Exec(ctx, `UPDATE roles SET name=$1,description=NULLIF($2,'') WHERE id=$3`, item.Name, item.Description, id); err != nil {
		return err
	}
	permissionIDs := item.PermissionIDs
	if roleName == "admin" {
		rows, queryErr := tx.Query(ctx, `SELECT id FROM permissions ORDER BY id`)
		if queryErr != nil {
			return queryErr
		}
		permissionIDs, err = pgx.CollectRows(rows, pgx.RowTo[int32])
		if err != nil {
			return err
		}
	}
	if err = replaceRolePermissions(ctx, tx, id, actor, permissionIDs); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func replaceRolePermissions(ctx context.Context, tx pgx.Tx, roleID int32, actor string, ids []int32) error {
	if _, err := tx.Exec(ctx, `DELETE FROM role_permissions WHERE role_id=$1`, roleID); err != nil {
		return err
	}
	if len(ids) == 0 {
		return nil
	}
	_, err := tx.Exec(ctx, `INSERT INTO role_permissions (role_id,permission_id,granted_by)
		SELECT $1, permission_id, $2 FROM (SELECT DISTINCT unnest($3::int4[]) permission_id) permissions`, roleID, actor, ids)
	return err
}

func DeleteRole(ctx context.Context, id string) error {
	result, err := db.GetConnection().Exec(ctx, `DELETE FROM roles WHERE id=$1 AND is_system=false`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		var exists bool
		if err = db.GetConnection().QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM roles WHERE id=$1)`, id).Scan(&exists); err != nil {
			return err
		}
		if exists {
			return ErrProtectedRole
		}
		return ErrContentNotFound
	}
	return nil
}

func GetPermissions(search string, page, limit int) ([]models.Permission, int, error) {
	where := `WHERE ($1 = '' OR key ILIKE '%' || $1 || '%' OR COALESCE(description,'') ILIKE '%' || $1 || '%')`
	return queryCollection(collectionQuery{
		listSQL:  `SELECT id,key,module,action,COALESCE(description,''),is_system,created_at,updated_at FROM permissions ` + where + ` ORDER BY module,action LIMIT $2 OFFSET $3`,
		countSQL: `SELECT COUNT(*) FROM permissions ` + where,
		args:     []interface{}{search}, page: page, limit: limit,
	}, func(row pgx.CollectableRow) (models.Permission, error) {
		var item models.Permission
		err := row.Scan(&item.ID, &item.Key, &item.Module, &item.Action, &item.Description, &item.IsSystem, &item.CreatedAt, &item.UpdatedAt)
		return item, err
	})
}

func GetPermission(id string) (models.Permission, error) {
	return queryContentDetail(`SELECT id,key,module,action,COALESCE(description,''),is_system,created_at,updated_at FROM permissions WHERE id=$1`, id, func(row pgx.Row) (models.Permission, error) {
		var item models.Permission
		err := row.Scan(&item.ID, &item.Key, &item.Module, &item.Action, &item.Description, &item.IsSystem, &item.CreatedAt, &item.UpdatedAt)
		return item, err
	})
}

func permissionParts(key string) (string, string, bool) {
	parts := strings.Split(key, ".")
	return parts[0], func() string {
		if len(parts) == 2 {
			return parts[1]
		}
		return ""
	}(), len(parts) == 2 && parts[0] != "" && parts[1] != ""
}

func InsertPermission(ctx context.Context, item *models.PermissionMutation) (int32, error) {
	module, action, ok := permissionParts(item.Key)
	if !ok {
		return 0, errors.New("invalid permission key")
	}
	var id int32
	err := db.GetConnection().QueryRow(ctx, `INSERT INTO permissions (key,module,action,description) VALUES ($1,$2,$3,NULLIF($4,'')) RETURNING id`, item.Key, module, action, item.Description).Scan(&id)
	return id, err
}

func UpdatePermission(ctx context.Context, id string, item models.PermissionMutation) error {
	module, action, ok := permissionParts(item.Key)
	if !ok {
		return errors.New("invalid permission key")
	}
	result, err := db.GetConnection().Exec(ctx, `UPDATE permissions SET
		key=CASE WHEN is_system THEN key ELSE $1 END,
		module=CASE WHEN is_system THEN module ELSE $2 END,
		action=CASE WHEN is_system THEN action ELSE $3 END,
		description=NULLIF($4,'') WHERE id=$5`, item.Key, module, action, item.Description, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrContentNotFound
	}
	return nil
}

func DeletePermission(ctx context.Context, id string) error {
	result, err := db.GetConnection().Exec(ctx, `DELETE FROM permissions WHERE id=$1 AND is_system=false`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		var exists bool
		if err = db.GetConnection().QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM permissions WHERE id=$1)`, id).Scan(&exists); err != nil {
			return err
		}
		if exists {
			return ErrProtectedPermission
		}
		return ErrContentNotFound
	}
	return nil
}
