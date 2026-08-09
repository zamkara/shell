package httpapi

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	"terabe/internal/repositories"
)

const (
	defaultCollectionPage  = 1
	defaultCollectionLimit = 10
	maxCollectionLimit     = 100
)

type CollectionParams struct {
	Search      string
	Page, Limit int
}

func serveContentDetail[T any](w http.ResponseWriter, r *http.Request, name string, load func(string) (T, error)) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}
	item, err := load(r.PathValue("id"))
	if errors.Is(err, repositories.ErrContentNotFound) {
		http.Error(w, `{"error":"Content not found"}`, http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("%s detail: %v", name, err)
		http.Error(w, `{"error":"Failed to fetch content"}`, http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

type CollectionResponse struct {
	Items interface{} `json:"items"`
	Total int         `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

func collectionResponse(items interface{}, total int, params CollectionParams) CollectionResponse {
	return CollectionResponse{Items: items, Total: total, Page: params.Page, Limit: params.Limit}
}

func serveCollection[T any](w http.ResponseWriter, r *http.Request, name string, load func(CollectionParams) ([]T, int, error)) {
	params := collectionParams(r)
	items, total, err := load(params)
	if err != nil {
		log.Printf("%s list: %v", name, err)
		http.Error(w, `{"error":"Failed to fetch collection"}`, http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, collectionResponse(items, total, params))
}

func collectionParams(r *http.Request) CollectionParams {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = defaultCollectionPage
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 || limit > maxCollectionLimit {
		limit = defaultCollectionLimit
	}
	return CollectionParams{Search: q.Get("search"), Page: page, Limit: limit}
}
