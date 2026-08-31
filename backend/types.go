package main

type IssueType string

const (
	IssueTypeObstruction      IssueType = "obstruction"
	IssueTypeSignalFault      IssueType = "signal_fault"
	IssueTypeSpeedRestriction IssueType = "speed_restriction"
	IssueTypeMaintenance      IssueType = "maintenance"
	IssueTypeOther            IssueType = "other"
)

type IssueSeverity string

const (
	IssueSeverityLow    IssueSeverity = "low"
	IssueSeverityMedium IssueSeverity = "medium"
	IssueSeverityHigh   IssueSeverity = "high"
)

type BlockIssue struct {
	IssueID     string        `json:"issue_id"`
	IssueType   IssueType     `json:"issue_type"`
	Description string        `json:"description"`
	Severity    IssueSeverity `json:"severity"`
	ReportedBy  string        `json:"reported_by"`
	Timestamp   string        `json:"timestamp"`
}

type DerivedStatus string

const (
	DerivedStatusFree     DerivedStatus = "free"
	DerivedStatusOccupied DerivedStatus = "occupied"
	DerivedStatusReserved DerivedStatus = "reserved"
	DerivedStatusDegraded DerivedStatus = "degraded"
	DerivedStatusFault    DerivedStatus = "fault"
)

type BaseOccupancy string

const (
	BaseOccupancyFree     BaseOccupancy = "free"
	BaseOccupancyOccupied BaseOccupancy = "occupied"
	BaseOccupancyReserved BaseOccupancy = "reserved"
)

type BlockProperties struct {
	BlockID     string        `json:"block_id"`
	Sequence    int           `json:"sequence"`
	StartSignal string        `json:"start_signal"`
	EndSignal   string        `json:"end_signal"`
	Occupancy   BaseOccupancy `json:"occupancy"`
	Issues      []BlockIssue  `json:"issues"`
	TrainID     *string       `json:"train_id,omitempty"`
	TrainName   *string       `json:"train_name,omitempty"`
	LengthM     float64       `json:"length_m"`
	MaxSpeedKmh *float64      `json:"max_speed_kmh,omitempty"`
	Gradient    *string       `json:"gradient,omitempty"`
}

type BlockFeature struct {
	Type     string `json:"type"`
	Geometry struct {
		Type        string       `json:"type"`
		Coordinates [][2]float64 `json:"coordinates"`
	} `json:"geometry"`
	Properties BlockProperties `json:"properties"`
}

type BlockFeatureCollection struct {
	Type     string         `json:"type"`
	Features []BlockFeature `json:"features"`
}

type Station struct {
	Code     string  `json:"code"`
	Name     string  `json:"name"`
	Division *string `json:"division,omitempty"`
	State    string  `json:"state"`
	Zone     string  `json:"zone"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`
	IsHub    *bool   `json:"isHub,omitempty"`
}

type RouteCorridor struct {
	FromCode    string  `json:"fromCode"`
	ToCode      string  `json:"toCode"`
	Name        string  `json:"name"`
	Zone        string  `json:"zone"`
	DistanceKm  float64 `json:"distance_km"`
	TotalBlocks int     `json:"total_blocks"`
	Description string  `json:"description"`
}

type AiPlanBlock struct {
	BlockID         string   `json:"block_id"`
	TrainID         string   `json:"train_id"`
	TrainName       *string  `json:"train_name,omitempty"`
	EntryTime       string   `json:"entry_time"`
	ExitTime        string   `json:"exit_time"`
	PlannedSpeedKmh *float64 `json:"planned_speed_kmh,omitempty"`
	HeadwaySeconds  *float64 `json:"headway_seconds,omitempty"`
	PriorityTier    *string  `json:"priority_tier,omitempty"`
}

type AssetBlock struct {
	BlockID     string  `json:"block_id"`
	IdleMinutes float64 `json:"idle_minutes"`
	AssetID     string  `json:"asset_id"`
	AssetType   *string `json:"asset_type,omitempty"`
	AssetStatus *string `json:"asset_status,omitempty"`
}

type AppMode string

const (
	AppModeReport AppMode = "report"
	AppModeAIPlan AppMode = "ai-plan"
	AppModeAsset  AppMode = "asset"
)

type SubmitIssuePayload struct {
	BlockID     string        `json:"block_id"`
	IssueType   string        `json:"issue_type"`
	Description string        `json:"description"`
	Severity    IssueSeverity `json:"severity"`
	ReportedBy  string        `json:"reported_by"`
	Timestamp   string        `json:"timestamp"`
	FromCode    *string       `json:"fromCode,omitempty"`
	ToCode      *string       `json:"toCode,omitempty"`
}
