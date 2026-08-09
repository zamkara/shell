package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"terabe/httpapi"
)

func main() {
	_ = godotenv.Load(".env.local")
	_ = godotenv.Load(".env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           httpapi.NewHandler(),
		ReadHeaderTimeout: 10 * time.Second,
	}

	log.Printf("Server listening on port %s", port)
	log.Fatal(server.ListenAndServe())
}
