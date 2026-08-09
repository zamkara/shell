package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"terabe/internal/db"
	"terabe/internal/models"
)

var ErrContentNotFound = errors.New("content not found")

func GetFAQs(category, search string, page, limit int) ([]models.FAQSummary, int, error) {
	where := `WHERE ($1 = '' OR category = $1) AND ($2 = '' OR question ILIKE '%' || $2 || '%' OR answer ILIKE '%' || $2 || '%' OR category ILIKE '%' || $2 || '%')`
	return queryCollection(collectionQuery{
		listSQL:  `SELECT id, question FROM faqs ` + where + ` ORDER BY order_index ASC, id ASC LIMIT $3 OFFSET $4`,
		countSQL: `SELECT COUNT(*) FROM faqs ` + where,
		args:     []interface{}{category, search}, page: page, limit: limit,
	}, func(row pgx.CollectableRow) (models.FAQSummary, error) {
		var item models.FAQSummary
		err := row.Scan(&item.ID, &item.Question)
		return item, err
	})
}

func GetFAQ(id string) (models.FAQ, error) {
	return queryContentDetail(`SELECT id, category, question, answer, order_index FROM faqs WHERE id=$1`, id, func(row pgx.Row) (models.FAQ, error) {
		var item models.FAQ
		err := row.Scan(&item.ID, &item.Category, &item.Question, &item.Answer, &item.OrderIndex)
		return item, err
	})
}

func InsertFAQ(item *models.FAQ) error {
	return db.GetConnection().QueryRow(context.Background(), `INSERT INTO faqs (category, question, answer, order_index) VALUES ($1, $2, $3, $4) RETURNING id`, item.Category, item.Question, item.Answer, item.OrderIndex).Scan(&item.ID)
}

func UpdateFAQ(id string, item *models.FAQ) error {
	result, err := db.GetConnection().Exec(context.Background(), `UPDATE faqs SET category=$1, question=$2, answer=$3, order_index=$4 WHERE id=$5`, item.Category, item.Question, item.Answer, item.OrderIndex, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrContentNotFound
	}
	return nil
}

func DeleteFAQ(id string) error { return deleteContent(`DELETE FROM faqs WHERE id=$1`, id) }

func GetPricingTiers(search string, page, limit int) ([]models.PricingTierSummary, int, error) {
	where := `WHERE ($1 = '' OR name ILIKE '%' || $1 || '%' OR basis ILIKE '%' || $1 || '%' OR for_desc ILIKE '%' || $1 || '%')`
	return queryCollection(collectionQuery{
		listSQL:  `SELECT id, name FROM pricing_tiers ` + where + ` ORDER BY order_index ASC, id ASC LIMIT $2 OFFSET $3`,
		countSQL: `SELECT COUNT(*) FROM pricing_tiers ` + where,
		args:     []interface{}{search}, page: page, limit: limit,
	}, func(row pgx.CollectableRow) (models.PricingTierSummary, error) {
		var item models.PricingTierSummary
		err := row.Scan(&item.ID, &item.Name)
		return item, err
	})
}

func GetPricingTier(id string) (models.PricingTier, error) {
	return queryContentDetail(`SELECT id, name, basis, for_desc, items, order_index FROM pricing_tiers WHERE id=$1`, id, func(row pgx.Row) (models.PricingTier, error) {
		var item models.PricingTier
		err := row.Scan(&item.ID, &item.Name, &item.Basis, &item.ForDesc, &item.Items, &item.OrderIndex)
		return item, err
	})
}

func InsertPricingTier(item *models.PricingTier) error {
	return db.GetConnection().QueryRow(context.Background(), `INSERT INTO pricing_tiers (name, basis, for_desc, items, order_index) VALUES ($1, $2, $3, $4::text[], $5) RETURNING id`, item.Name, item.Basis, item.ForDesc, item.Items, item.OrderIndex).Scan(&item.ID)
}

func UpdatePricingTier(id string, item *models.PricingTier) error {
	result, err := db.GetConnection().Exec(context.Background(), `UPDATE pricing_tiers SET name=$1, basis=$2, for_desc=$3, items=$4::text[], order_index=$5 WHERE id=$6`, item.Name, item.Basis, item.ForDesc, item.Items, item.OrderIndex, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrContentNotFound
	}
	return nil
}

func DeletePricingTier(id string) error {
	return deleteContent(`DELETE FROM pricing_tiers WHERE id=$1`, id)
}

func GetSiteSettings(key, search string, page, limit int) ([]models.SiteSettingSummary, int, error) {
	where := `WHERE ($1 = '' OR key = $1) AND ($2 = '' OR key ILIKE '%' || $2 || '%' OR value::text ILIKE '%' || $2 || '%')`
	return queryCollection(collectionQuery{
		listSQL:  `SELECT key FROM site_settings ` + where + ` ORDER BY key ASC LIMIT $3 OFFSET $4`,
		countSQL: `SELECT COUNT(*) FROM site_settings ` + where,
		args:     []interface{}{key, search}, page: page, limit: limit,
	}, func(row pgx.CollectableRow) (models.SiteSettingSummary, error) {
		var item models.SiteSettingSummary
		err := row.Scan(&item.Key)
		return item, err
	})
}

func GetSiteSetting(key string) (models.SiteSetting, error) {
	return queryContentDetail(`SELECT key, value FROM site_settings WHERE key=$1`, key, func(row pgx.Row) (models.SiteSetting, error) {
		var item models.SiteSetting
		var raw []byte
		if err := row.Scan(&item.Key, &raw); err != nil {
			return item, err
		}
		return item, json.Unmarshal(raw, &item.Value)
	})
}

func UpsertSiteSetting(item *models.SiteSetting) error {
	raw, err := json.Marshal(item.Value)
	if err != nil {
		return fmt.Errorf("marshal site setting: %w", err)
	}
	_, err = db.GetConnection().Exec(context.Background(), `INSERT INTO site_settings (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value`, item.Key, string(raw))
	return err
}

func DeleteSiteSetting(key string) error {
	return deleteContent(`DELETE FROM site_settings WHERE key=$1`, key)
}

func deleteContent(query, id string) error {
	result, err := db.GetConnection().Exec(context.Background(), query, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrContentNotFound
	}
	return nil
}
