package httpapi

import (
	"errors"
	"net/http"

	"terabe/internal/repositories"
)

func serveContentCreate[T any](
	w http.ResponseWriter,
	r *http.Request,
	label string,
	insert func(*T) error,
) {
	var item T
	if !decode(w, r, &item) {
		return
	}
	if err := insert(&item); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to create " + label,
		})
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func serveContentMutation[T any](
	w http.ResponseWriter,
	r *http.Request,
	label string,
	update func(string, *T) error,
	remove func(string) error,
) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "id is required"})
		return
	}

	if r.Method == http.MethodDelete {
		writeMutationResult(w, label, "delete", remove(id))
		return
	}
	if r.Method != http.MethodPut {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "Method not allowed"})
		return
	}

	var item T
	if !decode(w, r, &item) {
		return
	}
	if writeMutationResult(w, label, "update", update(id, &item)) {
		writeJSON(w, http.StatusOK, item)
	}
}

func writeMutationResult(w http.ResponseWriter, label, operation string, err error) bool {
	if errors.Is(err, repositories.ErrContentNotFound) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": label + " not found"})
		return false
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to " + operation + " " + label,
		})
		return false
	}
	if operation == "delete" {
		writeJSON(w, http.StatusOK, map[string]string{"message": label + " deleted"})
	}
	return true
}
