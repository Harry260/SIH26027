package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"reflect"
	"strconv"
	"time"
)
import "github.com/draffensperger/golp"

type TimetableEntry struct {
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
	for _, value := range *dest {
		fmt.Println(value)

	}
	return nil
}

func main() {
	lp := golp.NewLP(0, 2)
	lp.AddConstraint([]float64{110.0, 30.0}, golp.LE, 4000.0)
	lp.AddConstraint([]float64{1.0, 1.0}, golp.LE, 75.0)
	lp.SetObjFn([]float64{143.0, 60.0})
	lp.SetMaximize()

	lp.Solve()
	vars := lp.Variables()
	fmt.Printf("Plant %.3f acres of barley\n", vars[0])
	fmt.Printf("And  %.3f acres of wheat\n", vars[1])
	fmt.Printf("For optimal profit of $%.2f\n", lp.Objective())

	fmt.Println("Hello world")
}
