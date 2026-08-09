package db

import (
	"context"
	"log"
	"os"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	pool *pgxpool.Pool
	once sync.Once
)

// GetConnection mengembalikan instance pool database (Singleton)
// Sangat penting untuk Vercel Serverless agar koneksi tidak terus-menerus dibuka-tutup
func GetConnection() *pgxpool.Pool {
	once.Do(func() {
		dbUrl := os.Getenv("DATABASE_URL")
		if dbUrl == "" {
			log.Fatal("DATABASE_URL is not set")
		}

		var err error
		config, err := pgxpool.ParseConfig(dbUrl)
		if err != nil {
			log.Fatalf("Unable to parse database URL: %v\n", err)
		}

		// Session and transaction poolers accept the simple protocol. Keep each
		// serverless instance's pool deliberately small to bound connection use.
		config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
		config.MaxConns = 4
		config.MinConns = 0
		config.MaxConnIdleTime = 5 * time.Minute
		config.MaxConnLifetime = 30 * time.Minute

		pool, err = pgxpool.NewWithConfig(context.Background(), config)
		if err != nil {
			log.Fatalf("Unable to connect to database: %v\n", err)
		}
	})

	return pool
}
