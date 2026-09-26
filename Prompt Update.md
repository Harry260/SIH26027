# API schema

It's a simple JSON-RPC API

Each response is of the form

```json
{
    "status": "ok",
    "data": {...}
}
```

or

```
{
    "status": "error",
    "data": {...}
}
```

HTTP response codes are always 200 OK(unless an API endpoint doesn't exist which gives 404)

There's a few objects of interest

## Train

```
type TrainId = number
type Train = struct {
    id: TrainId,
    name: string,
}
```

## Trip

Due to quirks of how planning works, each trip of a train is treated as if it were a separate entity.

```
type TripId = number
type Trip = struct {
    id:TripId,
    train: TrainId,
    start_time: string, // ISO
    stations
}
```

## Resource

A resource represents a track, a platform, or a junction

```
type ResourceId = number
type Resource = struct {
    id: ResourceId,
    kind: string,
    lane_count: number,
}

type ResourceInfo = struct {
    resource:
    name: string,
    location: [2]number,
}
```

## Repairs

```
type RepairRequest = struct {
	ResourceId: ResourceId,
	time_start:     Time,
	time_end:     Time,
}
```

# Endpoints

```
// ... is whatever information you need
GET /api/corridors/:corridor -> {
    trains: []Train,
    resources: []{
       resource: Resource,
       ...
    },
}
```

```
type TimetableInput = struct {
	trips:     []Trip,
	resources: []Resource,
	repairs:   []RepairRequest,
}
```
->
POST /api/plan
->
```
type TimetableOutput = struct {
	trips:    []Trip,
}
```

```
export type IssueType =
  | "obstruction"
  | "signal_fault"
  | "speed_restriction"
  | "maintenance"
  | "other";

export type IssueSeverity = "low" | "medium" | "high";

type IssueId = number;

export interface BlockIssue {
  issue_id: IssueId;
  issue_type: IssueType;
  description: string;
  severity: IssueSeverity;
  reported_by: string;
  timestamp: string; // ISO
}
```

```
GET /api/train/:trainid -> Train
GET /api/resource/:resourceid -> Train

// Current known block issues
GET /api/resource/:resourceid/issue -> []BlockIssue

// there's an issue in this resource
BlockIssue -> POST /api/resource/:resourceid/issue -> IssueId

export type ResourceBlock = struct {
    resource_id: ResourceId,
    start: Time,
    end: Time,
}

// Block this resource for the given time
ResourceBlock -> POST /api/resource/:resourceid/block
```