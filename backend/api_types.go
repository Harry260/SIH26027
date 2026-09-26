package main

type APIStatus string

const (
	StatusOK    APIStatus = "ok"
	StatusError APIStatus = "error"
)

type APIResponse[T any] struct {
	Status APIStatus `json:"status"`
	Data   T         `json:"data"`
}

type TrainId int
type TripId int
type ResourceId int
type IssueId int
type StationId int
type CorridorId int

// ------------------------------------------
// Train & Trip Entities
// ------------------------------------------

type APIPriorityTier string

const (
	PriorityTierPremier APIPriorityTier = "Premier"
	PriorityTierExpress APIPriorityTier = "Express"
	PriorityTierFreight APIPriorityTier = "Freight"
)

type APITrain struct {
	ID           TrainId          `json:"id"`
	Name         string           `json:"name"`
	MaxSpeedKmh  *float64         `json:"max_speed_kmh,omitempty"`
	PriorityTier *APIPriorityTier `json:"priority_tier,omitempty"`
}

type APITripStationStop struct {
	StationID   StationId `json:"station_id"`
	StationCode string    `json:"station_code"`
	Arrival     Time      `json:"arrival"`   // Relative minutes (0..1440)
	Departure   Time      `json:"departure"` // Relative minutes (0..1440)
	MinDwell    Time      `json:"min_dwell"` // Minimum dwell time in minutes
}

type APIResourceAllocation struct {
	ResourceID      ResourceId `json:"resource_id"`
	EntryTime       Time       `json:"entry_time"`        // Relative minutes
	ExitTime        Time       `json:"exit_time"`         // Relative minutes
	PlannedSpeedKmh float64    `json:"planned_speed_kmh"` // Calculated traversal speed
	HeadwaySeconds  float64    `json:"headway_seconds"`   // Headway spacing to preceding train
}

type APITrip struct {
	ID                  TripId                  `json:"id"`
	Train               TrainId                 `json:"train"`
	TrainName           *string                 `json:"train_name,omitempty"`
	StartTime           string                  `json:"start_time"` // ISO8601 absolute timestamp
	Stations            []APITripStationStop    `json:"stations"`
	ResourceAllocations []APIResourceAllocation `json:"resource_allocations,omitempty"`
}

// ------------------------------------------
// Resource Entities (Tracks, Blocks, Platforms)
// ------------------------------------------

type APIResourceKind string

const (
	ResourceKindTrack        APIResourceKind = "track"
	ResourceKindPlatform     APIResourceKind = "platform"
	ResourceKindJunction     APIResourceKind = "junction"
	ResourceKindBlockSection APIResourceKind = "block_section"
)

type APIResource struct {
	ID        ResourceId      `json:"id"`
	Kind      APIResourceKind `json:"kind"`
	LaneCount int             `json:"lane_count"`
}

type APIOccupancy string

const (
	OccupancyFree     APIOccupancy = "free"
	OccupancyOccupied APIOccupancy = "occupied"
	OccupancyReserved APIOccupancy = "reserved"
)

type APIResourceInfo struct {
	Resource    APIResource     `json:"resource"`
	Name        string          `json:"name"`
	Sequence    int             `json:"sequence"`
	Location    [2]float64      `json:"location"`    // [lng, lat] centroid
	Coordinates [][2]float64    `json:"coordinates"` // [[lng, lat], ...] GeoJSON LineString
	LengthM     float64         `json:"length_m"`
	MaxSpeedKmh float64         `json:"max_speed_kmh"`
	Gradient    string          `json:"gradient,omitempty"`
	Occupancy   APIOccupancy    `json:"occupancy"`
	ActiveTrain *TrainId        `json:"active_train,omitempty"`
	TrainName   string          `json:"train_name,omitempty"`
	Issues      []APIBlockIssue `json:"issues"`
}

// ------------------------------------------
// Issue & Incident Telemetry
// ------------------------------------------

type APIIssueType string

const (
	IssueTypeObstruction      APIIssueType = "obstruction"
	IssueTypeSignalFault      APIIssueType = "signal_fault"
	IssueTypeSpeedRestriction APIIssueType = "speed_restriction"
	IssueTypeMaintenance      APIIssueType = "maintenance"
	IssueTypeOther            APIIssueType = "other"
)

type APIIssueSeverity string

const (
	IssueSeverityLow    APIIssueSeverity = "low"
	IssueSeverityMedium APIIssueSeverity = "medium"
	IssueSeverityHigh   APIIssueSeverity = "high"
)

type APIBlockIssue struct {
	IssueID     IssueId          `json:"issue_id"`
	IssueType   APIIssueType     `json:"issue_type"API`
	Description string           `json:"description"`
	Severity    APIIssueSeverity `json:"severity"`
	ReportedBy  string           `json:"reported_by"`
	Timestamp   string           `json:"timestamp"` // ISO8601
}

type APISubmitIssueBody struct {
	IssueType   APIIssueType     `json:"issue_type"API`
	Description string           `json:"description"`
	Severity    APIIssueSeverity `json:"severity,omitempty"` // Optional: AI-predicted in backend if omitted
	ReportedBy  string           `json:"reported_by,omitempty"`
	Timestamp   string           `json:"timestamp,omitempty"`
}

// ------------------------------------------
// Maintenance & Resource Blocks
// ------------------------------------------

type APIRepairRequest struct {
	ResourceID ResourceId `json:"resource_id"`
	TimeStart  Time       `json:"time_start"` // Relative minutes
	TimeEnd    Time       `json:"time_end"`   // Relative minutes
}

type APIResourceBlock struct {
	ResourceID ResourceId `json:"resource_id"`
	Start      Time       `json:"start"` // Relative minutes
	End        Time       `json:"end"`   // Relative minutes
}

// ------------------------------------------
// Timetable Optimization (LP Solver Interface)
// ------------------------------------------

type APITimetableInput struct {
	Trips     []APITrip          `json:"trips"`
	Resources []APIResource      `json:"resources"`
	Repairs   []APIRepairRequest `json:"repairs"`
}

type APITimetableOutput struct {
	Trips []APITrip `json:"trips"`
}

// ------------------------------------------
// Station & Corridor Metadata
// ------------------------------------------

type APIStation struct {
	ID       StationId `json:"id"`
	Code     string    `json:"code"`
	Name     string    `json:"name"`
	Division string    `json:"division,omitempty"`
	State    string    `json:"state"`
	Zone     string    `json:"zone"`
	Lat      float64   `json:"lat"`
	Lng      float64   `json:"lng"`
	IsHub    bool      `json:"isHub,omitempty"`
}

type APIRouteCorridor struct {
	ID          CorridorId `json:"id"`
	Code        string     `json:"code"`
	FromCode    string     `json:"fromCode"`
	ToCode      string     `json:"toCode"`
	Name        string     `json:"name"`
	Zone        string     `json:"zone"`
	DistanceKm  float64    `json:"distance_km"`
	TotalBlocks int        `json:"total_blocks"`
	Description string     `json:"description"`
}

type APIDerivedStatus string

const (
	DerivedStatusFree     APIDerivedStatus = "free"
	DerivedStatusOccupied APIDerivedStatus = "occupied"
	DerivedStatusReserved APIDerivedStatus = "reserved"
	DerivedStatusDegraded APIDerivedStatus = "degraded"
	DerivedStatusFault    APIDerivedStatus = "fault"
)

type APIAppMode string

const (
	AppModeReport APIAppMode = "report"
	AppModeAIPlan APIAppMode = "ai-plan"
)
