package main

import (
	"encoding/json/v2"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type ApiHealth struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
	Uptime    int    `json:"uptime"`
}

func main() {
	start := time.Now()

	mux := http.NewServeMux()

	mux.HandleFunc("/api/health", func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(200)
		json.MarshalWrite(w, ApiHealth{
			Status:    "ok",
			Timestamp: time.Now().Format(time.RFC3339),
			Uptime:    int(time.Since(start).Seconds()),
		})
	})

	mux.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(404)
		io.WriteString(w, "unknown!\n")
	})

	fmt.Println("Railway backend is running on port 8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
