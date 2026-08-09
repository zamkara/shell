package models

type FAQ struct {
	ID         string `json:"id"`
	Category   string `json:"category"`
	Question   string `json:"question"`
	Answer     string `json:"answer"`
	OrderIndex int32  `json:"order_index"`
}

type FAQSummary struct {
	ID       string `json:"id"`
	Question string `json:"question"`
}

type PricingTier struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Basis      string   `json:"basis"`
	ForDesc    string   `json:"for_desc"`
	Items      []string `json:"items"`
	OrderIndex int32    `json:"order_index"`
}

type PricingTierSummary struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type SiteSetting struct {
	Key   string      `json:"key"`
	Value interface{} `json:"value"`
}

type SiteSettingSummary struct {
	Key string `json:"key"`
}
