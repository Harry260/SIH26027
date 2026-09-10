package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"reflect"
	"strconv"
	"strings"
	"time"
)
import "github.com/draffensperger/golp"

// We represent time as an integer in the range 0-1440
type Time int

type Train struct {
	Name      string
	Stations  []int
	Arrival   []Time
	MinDwell  []Time
	Departure []Time
	Travel    []int
}

type Station struct {
	Name          string
	PlatformCount int
}

type Timetable struct {
	Trains   []Train
	Stations []Station
}

// variable types for the LP
const (
	Entry int = iota
	Exit
	PlatformUse
	Order
)

const BigM = 24 * 60 * 100

func Plan(input Timetable) Timetable {
	// variable -> column id
	variables := make(map[[4]int]int)
	resources := make(map[[2]int]int)

	// entry, exit, platform
	for train_id, train := range input.Trains {
		for _, station_id := range train.Stations {
			variables[[4]int{Entry, train_id, station_id, 0}] = len(variables)
			variables[[4]int{Exit, train_id, station_id, 0}] = len(variables)
			platform_count := input.Stations[station_id].PlatformCount
			for i := 0; i < platform_count; i++ {
				variables[[4]int{PlatformUse, train_id, station_id, i}] = len(variables)
			}
		}
	}

	// order
	for train1_id, _ := range input.Trains {
		for train2_id, _ := range input.Trains {
			for station_id, station := range input.Stations {
				for i := 0; i < station.PlatformCount; i++ {
					next_resource := len(resources)
					resources[[2]int{station_id, i}] = next_resource
					variables[[4]int{Order, train1_id, train2_id, next_resource}] = len(variables)
				}
			}
		}
	}

	lp := golp.NewLP(0, len(variables))
	_ = lp

	// make the platform and order variables into binary variables
	for variable, index := range variables {
		if variable[0] == PlatformUse || variable[0] == Order {
			lp.SetBinary(index, true)
		}
	}

	// -----------------------
	// Assign names to columns
	// -----------------------
	for variable, index := range variables {
		var name string

		switch variable[0] {
		case Entry:
			train_name := input.Trains[variable[1]].Name
			station_name := input.Stations[variable[2]].Name
			name = strings.Join([]string{"a", train_name, station_name}, "_")
		case Exit:
			train_name := input.Trains[variable[1]].Name
			station_name := input.Stations[variable[2]].Name
			name = strings.Join([]string{"d", train_name, station_name}, "_")
		case PlatformUse:
			train_name := input.Trains[variable[1]].Name
			station_name := input.Stations[variable[2]].Name
			platform_number := strconv.FormatInt(int64(variable[3]), 10)
			name = strings.Join([]string{"p", train_name, station_name, platform_number}, "_")
		case Order:
			train1_name := input.Trains[variable[1]].Name
			train2_name := input.Trains[variable[2]].Name
			name = strings.Join([]string{"o", train1_name, train2_name}, "_")
		}

		lp.SetColName(index, name)
	}

	for train_id, train := range input.Trains {
		for i, station_id := range train.Stations {
			arrive_variable := variables[[4]int{Entry, train_id, station_id, 0}]
			depart_variable := variables[[4]int{Exit, train_id, station_id, 0}]

			// ---------------------------------------------------------------------
			// Constraint 1: All our variables are positive
			// ---------------------------------------------------------------------
			lp.AddConstraintSparse([]golp.Entry{
				{arrive_variable, 1},
			}, golp.GE, 0)
			lp.AddConstraintSparse([]golp.Entry{
				{depart_variable, 1},
			}, golp.GE, 0)

			// ---------------------------------------------------------------------
			// Constraint 2: Don't arrive earlier than physically possible
			// ---------------------------------------------------------------------
			lp.AddConstraintSparse([]golp.Entry{
				{arrive_variable, 1},
			}, golp.GE, float64(train.Arrival[i]))

			// ---------------------------------------------------------------------
			// Constraint 3: At each station departure time must be after arrival time,
			// with a minimum of MinDwell between
			// ---------------------------------------------------------------------
			lp.AddConstraintSparse([]golp.Entry{
				{depart_variable, 1},
				{arrive_variable, -1},
			}, golp.GE, float64(train.MinDwell[i]))
		}
	}

	// ---------------------------------------------------------------------
	// Constraint 4: After departing from one station, it should travel for
	// at least train.Travel[i]
	// ---------------------------------------------------------------------

	for train_id, train := range input.Trains {
		for i := 0; i < len(train.Stations)-1; i++ {
			current_station := train.Stations[i]
			next_station := train.Stations[i+1]

			depart_variable := variables[[4]int{Exit, train_id, current_station}]
			arrive_variable := variables[[4]int{Entry, train_id, next_station}]
			travel_time := train.Travel[i]

			lp.AddConstraintSparse([]golp.Entry{
				{depart_variable, -1},
				{arrive_variable, 1},
			}, golp.GE, float64(travel_time))
		}
	}
	// ---------------------------------------------------------------------
	// Constraint 5: Each train enters exactly one platform of each station
	// along its path
	// ---------------------------------------------------------------------
	for train_id, train := range input.Trains {
		for _, station_id := range train.Stations {
			station := input.Stations[station_id]
			var constraint []golp.Entry

			for i := 0; i < station.PlatformCount; i++ {
				platform_variable := variables[[4]int{PlatformUse, train_id, station_id, i}]
				constraint = append(constraint, golp.Entry{platform_variable, 1})
			}
			lp.AddConstraintSparse(constraint, golp.EQ, 1)

		}
	}

	// ---------------------------------------------------------------------
	// Constraint 6: VarO represents the order in which trains use a resource
	// (which could be a station, a track, a junction, etc.)
	// Furthermore, only one train may use it at a time
	// ---------------------------------------------------------------------
	for train1_id, _ := range input.Trains {
		for train2_id, _ := range input.Trains {
			if train1_id == train2_id {
				continue
			}
			for resource_info, resource := range resources {
				station_id := resource_info[0]
				platform := resource_info[1]

				order_variable := variables[[4]int{Order, train1_id, train2_id, resource}]
				arrive1 := variables[[4]int{Entry, train1_id, station_id, 0}]
				arrive2 := variables[[4]int{Entry, train2_id, station_id, 0}]
				depart1 := variables[[4]int{Exit, train1_id, station_id, 0}]
				depart2 := variables[[4]int{Exit, train2_id, station_id, 0}]

				train1_platform := variables[[4]int{PlatformUse, train1_id, station_id, platform}]
				train2_platform := variables[[4]int{PlatformUse, train2_id, station_id, platform}]

				// explanation of M(2 - P1 - P2)
				// If the trains use different stations, then we don't need to worry about conflicts,
				// so this will effectively disable this constraint

				// exit1 ≤ entry2 + M(1 - O) + M(2 - P1 - P2)
				// exit1 - entry2 + O M + P1 M + P2 M ≤ 3 M
				lp.AddConstraintSparse([]golp.Entry{
					{depart1, 1},
					{arrive2, -1},
					{order_variable, BigM},
					{train1_platform, BigM},
					{train2_platform, BigM},
				}, golp.LE, 3*BigM)

				// exit2 ≤ entry1 + M O + M (2 - P1 P2)
				// exit2 - entry1 - M O + M P1 + M P 2 + ≤ 2 M
				lp.AddConstraintSparse([]golp.Entry{
					{depart2, 1},
					{arrive1, -1},
					{order_variable, -BigM},
					{train1_platform, BigM},
					{train2_platform, BigM},
				}, golp.LE, 2*BigM)
			}
		}
	}

	// -------------------------------------------------------------------
	// Objective function: Minimize two things
	// 1. Stretch: More time spent on train than necessary
	// 2. Delay: Arrived later than the plan
	//
	// We must try to minimize both factors
	// a' indicates optimal arrival time
	// S  indicates weight for stretch
	// D  indicates weight for delay
	//
	// # Stretch
	//      (a[s+1;t] - d[s;t]) - (travel[s; t])
	// # Delay
	//      a[s;t] - a'[s;t]
	// # Objective function
	//      Z = S * total stretch + D * total delay
	//
	// Eliminating all the constants(since they do not influence optimization),
	// We obtain that this is equivalent to minimizing arrival time at each station
	// -------------------------------------------------------------------
	// TODO: Calculate delay and stretch properly instead and minimize that.

	objective := make([]float64, lp.NumCols())

	for train_id, train := range input.Trains {
		for _, station_id := range train.Stations {
			arrive_variable := variables[[4]int{Entry, train_id, station_id}]
			objective[arrive_variable] = 1
		}
	}
	lp.SetObjFn(objective)
	lp.SetVerboseLevel(6)

	lp.Solve()

	return input
}

/*
type TimetableCSV struct {
	TrainNo                int
	TrainName              string
	SEQ                    int
	StationCode            string
	StationName            string
	ArrivalTime            time.Time
	DepartureTime          time.Time
	Distance               int
	SourceStationCode      string
	SourceStationName      string
	DestinationStationCode string
	DestinationStationName string
}
*/

func readRowsFromCsv[T any](path string, dest *[]T) error {
	file, open_err := os.Open(path)
	if open_err != nil {
		return open_err
	}

	reader := csv.NewReader(file)

	_, _ = reader.Read()
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		var row T
		row_value := reflect.ValueOf(&row).Elem()

		for i, field := range reflect.VisibleFields(reflect.TypeOf(row)) {
			field_value := row_value.FieldByName(field.Name)
			if !field_value.IsValid() {
				log.Panic("Failed to read field", field.Name)
			}

			switch field_value.Kind() {
			case reflect.Int:
				int_value, parse_err := strconv.ParseInt(record[i], 10, 64)
				if parse_err != nil {
					field_value.SetInt(-1)
				} else {
					field_value.SetInt(int_value)
				}
			case reflect.String:
				field_value.SetString(record[i])
			default:
				var zerotime time.Time
				if field_value.Type() == reflect.TypeOf(zerotime) {
					time_value, parse_err := time.Parse("15:04:05", record[i])
					if parse_err != nil {
						log.Print("Failed to parse ", record[i], " as time")
						field_value.Set(reflect.ValueOf(zerotime))
					} else {
						field_value.Set(reflect.ValueOf(time_value))
					}

				}
			}
		}
		*dest = append(*dest, row)
	}

	return nil
}

func main() {

	table := Timetable{
		Stations: []Station{
			{
				Name:          "Northfield",
				PlatformCount: 2,
			},
			{
				Name:          "Riverside",
				PlatformCount: 3,
			},
			{
				Name:          "Central",
				PlatformCount: 2,
			},
			{
				Name:          "Oak Junction",
				PlatformCount: 4,
			},
			{
				Name:          "Southport",
				PlatformCount: 1,
			},
		},

		Trains: []Train{
			{
				Name:      "N1",
				Stations:  []int{0, 1, 2, 3, 4},
				Arrival:   []Time{480, 493, 516, 524, 540},
				MinDwell:  []Time{1, 1, 2, 1, 0},
				Departure: []Time{480, 494, 520, 525, 540},
				Travel:    []int{13, 15, 13, 15},
			},
			{
				Name:      "S1",
				Stations:  []int{4, 3, 2, 1, 0},
				Arrival:   []Time{485, 501, 516, 532, 546},
				MinDwell:  []Time{0, 1, 2, 1, 0},
				Departure: []Time{485, 502, 518, 533, 546},
				Travel:    []int{16, 14, 14, 13},
			},
			{
				Name:      "N2",
				Stations:  []int{0, 1, 2, 3, 4},
				Arrival:   []Time{570, 583, 599, 614, 630},
				MinDwell:  []Time{1, 1, 2, 1, 0},
				Departure: []Time{570, 584, 601, 615, 630},
				Travel:    []int{13, 15, 13, 15},
			},
			{
				Name:      "S2",
				Stations:  []int{4, 3, 2, 1, 0},
				Arrival:   []Time{575, 591, 606, 622, 636},
				MinDwell:  []Time{0, 1, 2, 1, 0},
				Departure: []Time{575, 592, 608, 623, 636},
				Travel:    []int{16, 14, 14, 13},
			},
		},
	}

	for train_id := range table.Trains {
		train := &table.Trains[train_id]
		train.Departure = make([]Time, len(train.Arrival))
		for i := range train.Departure {
			train.Departure[i] = train.Arrival[i] + train.MinDwell[i]
		}
	}
	_ = Plan(table)

	fmt.Println("Hello world")
}
