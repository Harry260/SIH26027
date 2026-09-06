package main

import (
	"encoding/csv"
	"encoding/json/v2"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

type ApiHealth struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
	Uptime    int    `json:"uptime"`
}

var INDIAN_RAILWAY_STATIONS []Station

func main() {
	start := time.Now()

	file, err := os.Open("data/railway_stations.csv")
	if err != nil {
		log.Fatal("Failed to open file data/railway_stations.csv", err)
	}

	reader := csv.NewReader(file)
	reader.Comment = '#'
	_, _ = reader.Read()
	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil || len(row) < 8 {
			log.Fatal("Failed to load INDIAN_RAILWAY_STATIONS", err)
		}
		lat, _ := strconv.ParseFloat(row[5], 10)
		lng, _ := strconv.ParseFloat(row[6], 10)
		isHub, _ := strconv.ParseBool(row[7])
		INDIAN_RAILWAY_STATIONS = append(INDIAN_RAILWAY_STATIONS, Station{Code: row[0], Name: row[1], Division: row[2], State: row[3], Zone: row[4], Lat: lat, Lng: lng, IsHub: isHub})
	}
	for _, station := range INDIAN_RAILWAY_STATIONS {
		fmt.Println(station)
	}

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
