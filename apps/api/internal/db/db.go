package db

import (
	"context"
	"log"
	"os"
	"sync"

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
		pool, err = pgxpool.New(context.Background(), dbUrl)
		if err != nil {
			log.Fatalf("Unable to connect to database: %v\n", err)
		}
	})
	
	return pool
}
