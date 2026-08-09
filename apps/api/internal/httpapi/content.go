package httpapi

import (
	"encoding/json"
	"net/http"
	"terabe/internal/models"
	"terabe/internal/repositories"
)

func writeJSON(w http.ResponseWriter, status int, value interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func FAQsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		serveCollection(w, r, "faqs", func(params CollectionParams) ([]models.FAQSummary, int, error) {
			return repositories.GetFAQs(r.URL.Query().Get("category"), params.Search, params.Page, params.Limit)
		})
		return
	}
	if r.Method == http.MethodPost {
		serveContentCreate(w, r, "FAQ", repositories.InsertFAQ)
		return
	}
	serveContentMutation(w, r, "FAQ", repositories.UpdateFAQ, repositories.DeleteFAQ)
}

func FAQDetailHandler(w http.ResponseWriter, r *http.Request) {
	serveContentDetail(w, r, "faq", repositories.GetFAQ)
}

func PricingHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		serveCollection(w, r, "pricing", func(params CollectionParams) ([]models.PricingTierSummary, int, error) {
			return repositories.GetPricingTiers(params.Search, params.Page, params.Limit)
		})
		return
	}
	if r.Method == http.MethodPost {
		serveContentCreate(w, r, "Pricing tier", repositories.InsertPricingTier)
		return
	}
	serveContentMutation(w, r, "Pricing tier", repositories.UpdatePricingTier, repositories.DeletePricingTier)
}

func PricingDetailHandler(w http.ResponseWriter, r *http.Request) {
	serveContentDetail(w, r, "pricing", repositories.GetPricingTier)
}

func ContentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		serveCollection(w, r, "content", func(params CollectionParams) ([]models.SiteSettingSummary, int, error) {
			return repositories.GetSiteSettings(r.URL.Query().Get("key"), params.Search, params.Page, params.Limit)
		})
		return
	}
	if r.Method == http.MethodDelete {
		key := r.URL.Query().Get("id")
		if key == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "id is required"})
			return
		}
		writeMutationResult(w, "Site setting", "delete", repositories.DeleteSiteSetting(key))
		return
	}
	if r.Method != http.MethodPut {
		http.Error(w, `{"error":"Method not allowed"}`, 405)
		return
	}
	var item models.SiteSetting
	if !decode(w, r, &item) {
		return
	}
	if item.Key == "" {
		http.Error(w, `{"error":"key is required"}`, 400)
		return
	}
	if err := repositories.UpsertSiteSetting(&item); err != nil {
		http.Error(w, `{"error":"Failed to update content"}`, 500)
		return
	}
	writeJSON(w, 200, item)
}

func SiteSettingDetailHandler(w http.ResponseWriter, r *http.Request) {
	serveContentDetail(w, r, "site setting", repositories.GetSiteSetting)
}

func decode(w http.ResponseWriter, r *http.Request, value interface{}) bool {
	if err := json.NewDecoder(r.Body).Decode(value); err != nil {
		http.Error(w, `{"error":"Invalid request payload"}`, 400)
		return false
	}
	return true
}
