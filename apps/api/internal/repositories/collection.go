package repositories

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"terabe/internal/db"
)

type collectionQuery struct {
	listSQL  string
	countSQL string
	args     []interface{}
	page     int
	limit    int
}

func queryCollection[T any](query collectionQuery, scan func(pgx.CollectableRow) (T, error)) ([]T, int, error) {
	pool := db.GetConnection()
	listArgs := append(append([]interface{}{}, query.args...), query.limit, (query.page-1)*query.limit)
	rows, err := pool.Query(context.Background(), query.listSQL, listArgs...)
	if err != nil {
		return nil, 0, err
	}
	items, err := pgx.CollectRows(rows, scan)
	if err != nil {
		return nil, 0, err
	}
	var total int
	if err := pool.QueryRow(context.Background(), query.countSQL, query.args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	if items == nil {
		items = []T{}
	}
	return items, total, nil
}

func queryContentDetail[T any](query string, id string, scan func(pgx.Row) (T, error)) (T, error) {
	item, err := scan(db.GetConnection().QueryRow(context.Background(), query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return item, ErrContentNotFound
	}
	return item, err
}
