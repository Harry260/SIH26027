import {
  Station,
  Train,
  Trip,
  ResourceId,
  Time,
  TimetableInput,
  TimetableOutput,
} from '../types/index.js';
import { SAMPLE_TRAINS } from './resourceGenerator.js';
import { SeededRandom } from '../utils/pseudoRandom.js';

let globalTripIdCounter = 501;

export function getNextTripId(): number {
  return globalTripIdCounter++;
}

/**
 * Generates initial Trains & Trips for a given corridor and list of resource IDs.
 */
export function generateTripsForCorridor(
  fromStation: Station,
  toStation: Station,
  resourceIds: ResourceId[],
  corridorKey = 'default'
): { trains: Train[]; trips: Trip[] } {
  const rng = new SeededRandom(`plan-${corridorKey}`);

  // Select 3-4 distinct trains for this corridor
  const numTrains = Math.min(SAMPLE_TRAINS.length, Math.max(3, Math.floor(resourceIds.length / 5)));
  const selectedTrainDefs = [...SAMPLE_TRAINS].sort(() => rng.next() - 0.5).slice(0, numTrains);

  const trains: Train[] = selectedTrainDefs.map((t) => ({
    id: t.id,
    name: t.name,
    max_speed_kmh: t.speed,
    priority_tier: t.tier,
  }));

  const trips: Trip[] = [];
  const baseMinutes: Time = 600; // 10:00 AM (600 minutes from midnight)

  selectedTrainDefs.forEach((t, trainIdx) => {
    const tripId = getNextTripId();
    const trainStartOffset = trainIdx * 35; // staggered by 35 mins
    const tripStartTime: Time = baseMinutes + trainStartOffset;

    // ISO8601 representation for start_time
    const now = new Date();
    now.setHours(Math.floor(tripStartTime / 60), tripStartTime % 60, 0, 0);

    const tripStations = [
      {
        station_id: fromStation.id,
        station_code: fromStation.code,
        arrival: tripStartTime,
        departure: tripStartTime + 5,
        min_dwell: 5,
      },
      {
        station_id: toStation.id,
        station_code: toStation.code,
        arrival: tripStartTime + Math.round(resourceIds.length * 3.5),
        departure: tripStartTime + Math.round(resourceIds.length * 3.5) + 10,
        min_dwell: 10,
      },
    ];

    // Resource-level allocations along the corridor
    const resourceAllocations = resourceIds.map((resId, resIdx) => {
      const entry: Time = tripStartTime + 5 + Math.round(resIdx * 3.2);
      const exit: Time = entry + rng.nextInt(2, 4);
      return {
        resource_id: resId,
        entry_time: entry,
        exit_time: exit,
        planned_speed_kmh: t.speed - rng.nextInt(0, 10),
        headway_seconds: rng.nextInt(180, 420),
      };
    });

    trips.push({
      id: tripId,
      train: t.id,
      train_name: t.name,
      start_time: now.toISOString(),
      stations: tripStations,
      resource_allocations: resourceAllocations,
    });
  });

  return { trains, trips };
}

/**
 * Simulates the LP Timetable Optimization solver (POST /api/plan)
 */
export function solveTimetablePlan(input: TimetableInput): TimetableOutput {
  const optimizedTrips: Trip[] = input.trips.map((trip) => {
    const startDep = trip.stations?.[0]?.departure;
    let allocations = trip.resource_allocations || [];

    // Re-align allocations if departure time shifted
    if (allocations.length > 0 && typeof startDep === 'number') {
      const firstEntry = allocations[0].entry_time;
      const delta = startDep - firstEntry;
      if (delta !== 0) {
        allocations = allocations.map((a) => ({
          ...a,
          entry_time: a.entry_time + delta,
          exit_time: a.exit_time + delta,
        }));
      }
    }

    const updatedAllocations = allocations.map((alloc) => {
      // Check if this resource has a repair during this window
      const repairConflict = input.repairs.find(
        (r) =>
          r.resource_id === alloc.resource_id &&
          alloc.entry_time < r.time_end &&
          alloc.exit_time > r.time_start
      );

      let adjustedEntry = alloc.entry_time;
      let adjustedExit = alloc.exit_time;

      if (repairConflict) {
        // Shift train window after repair completes
        const shift = repairConflict.time_end - alloc.entry_time + 5;
        adjustedEntry += shift;
        adjustedExit += shift;
      }

      return {
        ...alloc,
        entry_time: adjustedEntry,
        exit_time: adjustedExit,
      };
    });

    const updatedStations = [...(trip.stations || [])];
    if (updatedStations.length > 1 && updatedAllocations.length > 0) {
      const lastAlloc = updatedAllocations[updatedAllocations.length - 1];
      updatedStations[updatedStations.length - 1] = {
        ...updatedStations[updatedStations.length - 1],
        arrival: lastAlloc.exit_time + 2,
        departure: lastAlloc.exit_time + 12,
      };
    }

    return {
      ...trip,
      stations: updatedStations,
      resource_allocations: updatedAllocations,
    };
  });

  return {
    trips: optimizedTrips,
  };
}

