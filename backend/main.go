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
	Name     string
	Platform int
}

type Timetable struct {
	Trains   []Train
	Stations []Station
}

const (
	// Arrival time: {trains, station, 0}
	varA int = iota
	// Departure time: {train, station, 0}
	varD
	// Platform: {train, station, platform}
	varP
	// Order: {train1, train2, track}
	varO
)

type Variable struct {
	// not all of these fields are used all the time
	name     int
	train    int
	station  int
	platform int
}

const BigM = 1 << 63

func Plan(input Timetable) Timetable {
	// variable -> column id
	variables := make(map[Variable]int)

	for train_id, train := range input.Trains {
		for _, station_id := range train.Stations {
			variables[Variable{varA, train_id, station_id, 0}] = len(variables)
			variables[Variable{varD, train_id, station_id, 0}] = len(variables)
			platform_count := input.Stations[station_id].Platform
			for i := 0; i < platform_count; i++ {
				variables[Variable{varP, train_id, station_id, i}] = len(variables)
			}
		}
	}

	for train1_id, _ := range input.Trains {
		for train2_id, _ := range input.Trains {
			variables[Variable{varO, train1_id, train2_id, 0}] = len(variables)
		}
	}

	lp := golp.NewLP(0, len(variables))
	_ = lp

	// make the platform and order variables into binary variables
	for variable, index := range variables {
		if variable.name == varP || variable.name == varO {
			lp.SetBinary(index, true)
		}
	}

	// -----------------------
	// Assign names to columns
	// -----------------------
	for variable, index := range variables {
		var name string

		switch variable.name{
		case varA:
			train_name := input.Trains[variable.train].Name
			station_name := input.Stations[variable.station].Name
			name = strings.Join([]string{"a", train_name, station_name}, "_")
		case varD:
			train_name := input.Trains[variable.train].Name
			station_name := input.Stations[variable.station].Name
			name = strings.Join([]string{"d", train_name, station_name}, "_")
		case varP:
			train_name := input.Trains[variable.train].Name
			station_name := input.Stations[variable.station].Name
			platform_number := strconv.FormatInt(int64(variable.platform), 10)
			name = strings.Join([]string{"p", train_name, station_name, platform_number}, "_")
		case varO:
			train1_name := input.Trains[variable.train].Name
			train2_name := input.Trains[variable.train].Name
			name = strings.Join([]string{"o", train1_name, train2_name}, "_")
		}

		lp.SetColName(index, name)
	}

	for train_id, train := range input.Trains {
		for i, station_id := range train.Stations {
			arrive_variable := variables[Variable{varA, train_id, station_id, 0}]
			depart_variable := variables[Variable{varD, train_id, station_id, 0}]

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
			// Constraint 2: Don't arrive earlier than advertised
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

			depart_variable := variables[Variable{varD, train_id, current_station, 0}]
			arrive_variable := variables[Variable{varA, train_id, next_station, 0}]
			travel_time := train.Travel[i]

			lp.AddConstraintSparse([]golp.Entry{
				{depart_variable, -1},
				{arrive_variable, 1},
			}, golp.GE, float64(travel_time))
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

	objective := make([]float64, lp.NumCols())

	for train_id, train := range input.Trains {
		for _, station_id := range train.Stations {
			arrive_variable := variables[Variable{varA, train_id, station_id, 0}]
			objective[arrive_variable] = 1
		}
	}
	lp.SetObjFn(objective)
	lp.SetVerboseLevel(6)

	lp.WriteToStdout()
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
				Name:     "Northfield",
				Platform: 2,
			},
			{
				Name:     "Riverside",
				Platform: 3,
			},
			{
				Name:     "Central",
				Platform: 2,
			},
			{
				Name:     "Oak Junction",
				Platform: 4,
			},
			{
				Name:     "Southport",
				Platform: 1,
			},
		},

		Trains: []Train{
			{
				Name:      "N1",
				Stations:  []int{0, 1, 2, 3, 4},
				Arrival:   []Time{480, 493, 509, 524, 540},
				MinDwell:  []Time{1, 1, 2, 1, 0},
				Departure: []Time{480, 494, 511, 525, 540},
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
