package utils

import (
	"encoding/json"
	"net/http"
	"strings"
)

// SendResponse mengirim JSON response.
// Jika parameter "fields" di URL diisi (contoh: ?fields=id,name), maka hanya field tersebut yang dikembalikan.
func SendResponse(w http.ResponseWriter, r *http.Request, data interface{}) {
	w.Header().Set("Content-Type", "application/json")

	fieldsQuery := r.URL.Query().Get("fields")
	if fieldsQuery == "" {
		// Jika tidak ada filter, return semua data
		json.NewEncoder(w).Encode(data)
		return
	}

	// Parsing requested fields
	fields := strings.Split(fieldsQuery, ",")
	fieldMap := make(map[string]bool)
	for _, f := range fields {
		fieldMap[strings.TrimSpace(f)] = true
	}

	// Ubah data menjadi map[string]interface{} via JSON marshal & unmarshal
	// Ini trik paling reusable tanpa harus pakai reflect kompleks
	rawJson, err := json.Marshal(data)
	if err != nil {
		http.Error(w, `{"error": "Failed to process data"}`, http.StatusInternalServerError)
		return
	}

	// Handle array vs single object
	if string(rawJson[0]) == "[" {
		var list []map[string]interface{}
		json.Unmarshal(rawJson, &list)
		
		var filteredList []map[string]interface{}
		for _, item := range list {
			filteredList = append(filteredList, filterMap(item, fieldMap))
		}
		json.NewEncoder(w).Encode(filteredList)
	} else {
		var obj map[string]interface{}
		json.Unmarshal(rawJson, &obj)
		json.NewEncoder(w).Encode(filterMap(obj, fieldMap))
	}
}

func filterMap(obj map[string]interface{}, allowedFields map[string]bool) map[string]interface{} {
	filtered := make(map[string]interface{})
	for k, v := range obj {
		if allowedFields[k] {
			filtered[k] = v
		}
	}
	return filtered
}
