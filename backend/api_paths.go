package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
	"errors"
	"strconv"
	"maps"

	"github.com/lib/pq"
)

type APIHealthResponse struct {
	Uptime    float64 `json:"uptime"`
	Timestamp string  `json:"timestamp"`
	// MemoryUsage MemoryUsage `json:"memoryUsage"`
}

/*
type MemoryUsage struct {
	RSS       int64 `json:"rss"`
	HeapTotal int64 `json:"heapTotal"`
	HeapUsed  int64 `json:"heapUsed"`
}
*/

func APIGetHealth(w http.ResponseWriter, _ *http.Request) {
	var res APIResponse[APIHealthResponse]
	uptime := time.Since(applicationStartTime).Minutes()
	res.Status = StatusOK
	res.Data = APIHealthResponse{
		Uptime:    uptime,
		Timestamp: time.Now().Format(time.RFC3339),
	}
	json.NewEncoder(w).Encode(res)
}

func APIGetStations(w http.ResponseWriter, r *http.Request) {
	rows, err := db.QueryContext(r.Context(), `
		SELECT
			code,
			name,
			division,
			state,
			zone,
			lat,
			lng,
			ishub
		FROM stations
		ORDER BY code
	`)
	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	stations := make([]APIStation, 0)

	for rows.Next() {
		var (
			code     string
			name     string
			division sql.NullString
			state    string
			zone     string
			lat      sql.NullFloat64
			lng      sql.NullFloat64
			isHub    sql.NullBool
		)

		if err := rows.Scan(
			&code,
			&name,
			&division,
			&state,
			&zone,
			&lat,
			&lng,
			&isHub,
		); err != nil {
			http.Error(w, "database error", http.StatusInternalServerError)
			return
		}

		// The schema has no integer station ID, so generate one.
		id := StationId(len(stations) + 1)

		stations = append(stations, APIStation{
			ID:       id,
			Code:     code,
			Name:     name,
			Division: division.String,
			State:    state,
			Zone:     zone,
			Lat:      lat.Float64,
			Lng:      lng.Float64,
			IsHub:    isHub.Bool,
		})
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	res := APIResponse[[]APIStation]{
		Status: StatusOK,
		Data: stations,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(res); err != nil {
		return
	}
}

func APIGetCorridoors(w http.ResponseWriter, r *http.Request) {
	rows, err := db.QueryContext(r.Context(), `
		SELECT
			t.train_no,
			MIN(tt.station) FILTER (WHERE tt.seq = first_seq) AS from_code,
			MIN(tt.station) FILTER (WHERE tt.seq = last_seq) AS to_code,
			MIN(tn.train_name),
			MIN(fs.zone),
			MAX(tt.distance) - MIN(tt.distance) AS distance,
			COUNT(*) AS total_blocks
		FROM trip t
		JOIN trains tn ON tn.train_no = t.train_no
		JOIN (
			SELECT
				trip_no,
				MIN(seq) AS first_seq,
				MAX(seq) AS last_seq
			FROM time_table
			GROUP BY trip_no
		) bounds ON bounds.trip_no = t.trip_no
		JOIN time_table tt ON tt.trip_no = t.trip_no
		JOIN stations fs ON fs.code = (
			SELECT station
			FROM time_table
			WHERE trip_no = t.trip_no
			ORDER BY seq
			LIMIT 1
		)
		GROUP BY t.train_no, t.trip_no
		ORDER BY t.train_no
	`)
	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	corridors := make([]APIRouteCorridor, 0)

	for rows.Next() {
		var (
			trainNo     string
			fromCode    string
			toCode      string
			name        sql.NullString
			zone        sql.NullString
			distance    sql.NullFloat64
			totalBlocks int
		)

		if err := rows.Scan(
			&trainNo,
			&fromCode,
			&toCode,
			&name,
			&zone,
			&distance,
			&totalBlocks,
		); err != nil {
			http.Error(w, "database error", http.StatusInternalServerError)
			return
		}

		corridors = append(corridors, APIRouteCorridor{
			ID:          CorridorId(len(corridors) + 1),
			Code:        trainNo,
			FromCode:    fromCode,
			ToCode:      toCode,
			Name:        name.String,
			Zone:        zone.String,
			DistanceKm:  distance.Float64,
			TotalBlocks: totalBlocks,
			Description: name.String + " (" + fromCode + " - " + toCode + ")",
		})
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	res := APIResponse[[]APIRouteCorridor]{
		Data: corridors,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(res); err != nil {
		return
	}

	_ = r
}

type APICoridoorData struct {
	Coridoor  string           `json:corridoor`
	Meta      APIRouteCorridor `json:meta`
	Trains    []APITrain       `json:trains`
	Resources []APIResource    `json:resources`
}

func APIGetCorridoorsCorridoor(w http.ResponseWriter, r *http.Request) {
	corridor := r.PathValue("corridoor")
	if corridor == "" {
		corridor = r.URL.Query().Get("corridoor")
	}

	var (
		meta APIRouteCorridor
	)

	err := db.QueryRowContext(r.Context(), `
		SELECT
			t.train_no,
			MIN(tt.station) FILTER (WHERE tt.seq = bounds.first_seq),
			MIN(tt.station) FILTER (WHERE tt.seq = bounds.last_seq),
			COALESCE(tr.train_name, ''),
			COALESCE(s.zone, ''),
			COALESCE(MAX(tt.distance) - MIN(tt.distance), 0),
			COUNT(*) - 1
		FROM trip t
		JOIN trains tr ON tr.train_no = t.train_no
		JOIN (
			SELECT
				trip_no,
				MIN(seq) AS first_seq,
				MAX(seq) AS last_seq
			FROM time_table
			GROUP BY trip_no
		) bounds ON bounds.trip_no = t.trip_no
		JOIN time_table tt ON tt.trip_no = t.trip_no
		JOIN stations s ON s.code = (
			SELECT station
			FROM time_table
			WHERE trip_no = t.trip_no
			ORDER BY seq
			LIMIT 1
		)
		WHERE t.train_no = ?
		GROUP BY t.train_no, tr.train_name, s.zone
		ORDER BY t.trip_no
		LIMIT 1
	`, corridor).Scan(
		&meta.Code,
		&meta.FromCode,
		&meta.ToCode,
		&meta.Name,
		&meta.Zone,
		&meta.DistanceKm,
		&meta.TotalBlocks,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			res := APIResponse[APICoridoorData]{
				Data: APICoridoorData{
					Coridoor: corridor,
				},
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(res)
			return
		}

		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	var trainRows []APITrain

	rows, err := db.QueryContext(r.Context(), `
		SELECT DISTINCT
			tr.train_no,
			COALESCE(tr.train_name, '')
		FROM trip t
		JOIN trains tr ON tr.train_no = t.train_no
		WHERE t.train_no = ?
		ORDER BY tr.train_no
	`, corridor)
	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var (
			trainNo string
			name    string
		)

		if err := rows.Scan(&trainNo, &name); err != nil {
			http.Error(w, "database error", http.StatusInternalServerError)
			return
		}

		trainRows = append(trainRows, APITrain{
			ID:   TrainId(len(trainRows) + 1),
			Name: name,
		})
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	if trainRows == nil {
		trainRows = []APITrain{}
	}

	res := APIResponse[APICoridoorData]{
		Data: APICoridoorData{
			Coridoor:  corridor,
			Meta:      meta,
			Trains:    trainRows,
			Resources: []APIResource{},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(res); err != nil {
		return
	}
}

func APIGetResourceResourceID(w http.ResponseWriter, r *http.Request) {
	resourceID := r.PathValue("resourceid")

	var resource APIResource

	// Resources are not represented by a dedicated table in the supplied schema.
	// Derive resources from the station infrastructure available in stations.
	var stationCode string
	var isHub bool

	err := db.QueryRowContext(r.Context(), `
		SELECT code, ishub
		FROM stations
		ORDER BY code
		LIMIT 1 OFFSET ?
	`, resourceID).Scan(&stationCode, &isHub)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "resource not found", http.StatusNotFound)
			return
		}
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	id, err := strconv.Atoi(resourceID)
	if err != nil {
		http.Error(w, "invalid resource id", http.StatusBadRequest)
		return
	}

	resource = APIResource{
		ID:        ResourceId(id),
		Kind:      ResourceKindPlatform,
		LaneCount: 1,
	}

	if isHub {
		resource.LaneCount = 2
	}

	res := APIResponse[APIResource]{
		Data: resource,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(res); err != nil {
		return
	}

	_ = stationCode
}

func APIGetResourceResourceIDIssue(w http.ResponseWriter, r *http.Request) {
	resourceID := r.PathValue("resourceid")

	var (
		issueID     int
		issueType   string
		description string
		severity    string
		reportedBy  string
		timestamp   string
	)

	err := db.QueryRowContext(r.Context(), `
		SELECT
			issue_id,
			issue_type,
			description,
			severity,
			reported_by,
			timestamp
		FROM resource_issues
		WHERE resource_id = ?
		ORDER BY timestamp DESC
		LIMIT 1
	`, resourceID).Scan(
		&issueID,
		&issueType,
		&description,
		&severity,
		&reportedBy,
		&timestamp,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "issue not found", http.StatusNotFound)
			return
		}
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	res := APIResponse[APIBlockIssue]{
		Data: APIBlockIssue{
			IssueID:     IssueId(issueID),
			IssueType:   APIIssueType(issueType),
			Description: description,
			Severity:    APIIssueSeverity(severity),
			ReportedBy:  reportedBy,
			Timestamp:   timestamp,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(res); err != nil {
		return
	}
}

func APIPostResourceResourceIDIssue(w http.ResponseWriter, r *http.Request) {
	resourceID := r.PathValue("resourceid")

	var req APISubmitIssueBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	var resourceExists int
	if err := db.QueryRowContext(r.Context(), `
		SELECT 1
		FROM stations
		ORDER BY code
		LIMIT 1 OFFSET ?
	`, resourceID).Scan(&resourceExists); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "resource not found", http.StatusNotFound)
			return
		}
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	var issueID int64
	err := db.QueryRowContext(r.Context(), `
		INSERT INTO resource_issues (
			resource_id,
			issue_type,
			description,
			severity,
			reported_by,
			timestamp
		)
		VALUES (?, ?, ?, ?, ?, COALESCE(NULLIF(?, ''), CURRENT_TIMESTAMP))
		RETURNING issue_id
	`,
		resourceID,
		req.IssueType,
		req.Description,
		IssueSeverityLow,
		req.ReportedBy,
		req.Timestamp,
	).Scan(&issueID)
	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	timestamp := req.Timestamp
	if timestamp == "" {
		if err := db.QueryRowContext(r.Context(), `
			SELECT timestamp
			FROM resource_issues
			WHERE issue_id = ?
		`, issueID).Scan(&timestamp); err != nil {
			http.Error(w, "database error", http.StatusInternalServerError)
			return
		}
	}

	res := APIResponse[APIBlockIssue]{
		Data: APIBlockIssue{
			IssueID:     IssueId(issueID),
			IssueType:   req.IssueType,
			Description: req.Description,
			Severity:    IssueSeverityLow,
			ReportedBy:  req.ReportedBy,
			Timestamp:   timestamp,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(res); err != nil {
		return
	}
}

type APIResolveResult struct {
	Resolved bool `json:resolved`
}

func APIDeleteResourceResourceIDIssueIssueID(w http.ResponseWriter, r *http.Request) {
	resourceID := r.PathValue("resourceid")
	issueID := r.PathValue("issueid")

	result, err := db.ExecContext(r.Context(), `
		DELETE FROM resource_issues
		WHERE resource_id = ? AND issue_id = ?
	`, resourceID, issueID)
	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	res := APIResponse[APIResolveResult]{
		Data: APIResolveResult{
			Resolved: rowsAffected > 0,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(res); err != nil {
		return
	}
}

func APIPostResourceResourceIDBlock(w http.ResponseWriter, r *http.Request) {
	resourceID := r.PathValue("resourceid")

	var req struct {
		Start Time `json:"start"`
		End   Time `json:"end"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	var exists int
	err := db.QueryRowContext(r.Context(), `
		SELECT 1
		FROM stations
		ORDER BY code
		LIMIT 1 OFFSET ?
	`, resourceID).Scan(&exists)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "resource not found", http.StatusNotFound)
			return
		}
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	_, err = db.ExecContext(r.Context(), `
		INSERT INTO resource_blocks (resource_id, start_time, end_time)
		VALUES (?, ?, ?)
	`, resourceID, req.Start, req.End)
	if err != nil {
		http.Error(w, "database error", http.StatusInternalServerError)
		return
	}

	id, err := strconv.Atoi(resourceID)
	if err != nil {
		http.Error(w, "invalid resource id", http.StatusBadRequest)
		return
	}

	res := APIResponse[struct {
		ResourceID ResourceId `json:"resource_id"`
		Start      Time       `json:"start"`
		End        Time       `json:"end"`
	}]{
		Data: struct {
			ResourceID ResourceId `json:"resource_id"`
			Start      Time       `json:"start"`
			End        Time       `json:"end"`
		}{
			ResourceID: ResourceId(id),
			Start:      req.Start,
			End:        req.End,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(res)
}

func APIPostPlan(w http.ResponseWriter, r *http.Request) {
	var req APITimetableInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	var input Timetable

	// Load all stations referenced by the API input.
	stationCodes := make(map[string]struct{})

	for _, trip := range req.Trips {
		for _, stop := range trip.Stations {
			stationCodes[string(stop.StationID)] = struct{}{}
		}
	}

	if len(stationCodes) > 0 {
		rows, err := db.Query(`
			SELECT code, name
			FROM stations
			WHERE code = ANY($1)
			ORDER BY code
		`, pq.Array(maps.Keys(stationCodes)))
		if err != nil {
			panic("error")
		}
		defer rows.Close()

		for rows.Next() {
			var (
				code string
				name string
			)

			if err := rows.Scan(&code, &name); err != nil {
				panic("error")
			}

			input.Stations = append(input.Stations, Station{
				Name: name,
			})
		}

		if err := rows.Err(); err != nil {
			panic("error")
		}
	}

	// Convert each API trip into a Train.
	input.Trains = make([]Train, 0, len(req.Trips))

	for _, trip := range req.Trips {
		name := string(trip.Train)
		if trip.TrainName != nil {
			name = *trip.TrainName
		}

		train := Train{
			Name:      name,
			Stations:  make([]int, 0, len(trip.Stations)),
			Arrival:   make([]Time, 0, len(trip.Stations)),
			MinDwell:  make([]Time, 0, len(trip.Stations)),
			Departure: make([]Time, 0, len(trip.Stations)),
			Travel:    make([]int, 0, max(0, len(trip.Stations)-1)),
		}

		for i, stop := range trip.Stations {
			train.Stations = append(train.Stations, int(stop.StationID))
			train.Arrival = append(train.Arrival, stop.Arrival)
			train.Departure = append(train.Departure, stop.Departure)

			// Minimum dwell is the difference between arrival and departure.
			train.MinDwell = append(
				train.MinDwell,
				stop.Departure-stop.Arrival,
			)

			if i > 0 {
				// Travel time between consecutive stations.
				previous := trip.Stations[i-1]
				train.Travel = append(
					train.Travel,
					int(stop.Arrival-previous.Departure),
				)
			}
		}

		input.Trains = append(input.Trains, train)
	}

	// output := Plan(input)

	res := APIResponse[APITimetableOutput]{
		Data: APITimetableOutput{
			Trips: req.Trips,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

func APIGetPlan(w http.ResponseWriter, r *http.Request) {
	out := APITimetableOutput{
		Trips: make([]APITrip, 0, len(t.Trains)),
	}

	for i, train := range t.Trains {
		trip := APITrip{
			ID:       TripId(i),
			Train:    TrainId(train.Name),
			Stations: make([]APITripStationStop, len(train.Stations)),
		}

		// Resolve station IDs to station codes from the database.
		for j, stationID := range train.Stations {
			var code string

			err := db.QueryRow(`
				SELECT code
				FROM stations
				ORDER BY code
				LIMIT 1 OFFSET ?
			`, stationID).Scan(&code)
			if err != nil {
				panic("error")
			}

			trip.Stations[j] = APITripStationStop{
				StationID: ResourceId(code),
				Arrival:   train.Arrival[j],
				Departure: train.Departure[j],
			}
		}

		// Fill in the trip number and train name from the database.
		err := db.QueryRow(`
			SELECT tr.trip_no, t.train_name
			FROM trip tr
			JOIN trains t ON t.train_no = ?
			ORDER BY tr.trip_no
			LIMIT 1 OFFSET ?
		`, train.Name, i).Scan(&trip.ID, &trip.TrainName)
		if err != nil {
			panic("error")
		}

		out.Trips = append(out.Trips, trip)
	}

	res := APIResponse[APITimetableOutput]{
		Data: out,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)

	_ = r
}
