import { Trip, Train, ResourceId, Time } from '../types';

export const MOCK_TRAINS: Train[] = [
  { id: 12002, name: 'Bhopal Shatabdi Express', max_speed_kmh: 130, priority_tier: 'Premier' },
  { id: 22436, name: 'Vande Bharat Express', max_speed_kmh: 140, priority_tier: 'Premier' },
  { id: 12952, name: 'Mumbai Tejas Rajdhani', max_speed_kmh: 130, priority_tier: 'Premier' },
  { id: 8842,  name: 'Heavy-Haul Coal Freight', max_speed_kmh: 75, priority_tier: 'Freight' },
];

export function generateMockTrips(resourceIds: ResourceId[]): Trip[] {
  const baseMinutes: Time = 600; // 10:00 AM

  return MOCK_TRAINS.map((train, idx) => {
    const tripId = 501 + idx;
    const startOffset = idx * 30;
    const tripStart: Time = baseMinutes + startOffset;

    const allocations = resourceIds.map((resId, rIdx) => {
      const entry: Time = tripStart + 5 + Math.round(rIdx * 3.2);
      const exit: Time = entry + 3;
      return {
        resource_id: resId,
        entry_time: entry,
        exit_time: exit,
        planned_speed_kmh: (train.max_speed_kmh || 120) - 5,
        headway_seconds: 240,
      };
    });

    const now = new Date();
    now.setHours(Math.floor(tripStart / 60), tripStart % 60, 0, 0);

    return {
      id: tripId,
      train: train.id,
      train_name: train.name,
      start_time: now.toISOString(),
      stations: [
        { station_id: 1, station_code: 'NDLS', arrival: tripStart, departure: tripStart + 5, min_dwell: 5 },
        { station_id: 13, station_code: 'AGC', arrival: tripStart + 90, departure: tripStart + 95, min_dwell: 5 },
      ],
      resource_allocations: allocations,
    };
  });
}
