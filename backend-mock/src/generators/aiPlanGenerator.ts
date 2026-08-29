import { AiPlanBlock } from '../types/index.js';
import { SeededRandom } from '../utils/pseudoRandom.js';

interface TrainScheduleTemplate {
  train_id: string;
  train_name: string;
  priority_tier: 'Premier' | 'Express' | 'Freight';
  baseSpeed: number;
}

const TRAIN_TEMPLATES: TrainScheduleTemplate[] = [
  { train_id: '22436', train_name: 'Vande Bharat Express', priority_tier: 'Premier', baseSpeed: 140 },
  { train_id: '12002', train_name: 'Bhopal Shatabdi Express', priority_tier: 'Premier', baseSpeed: 130 },
  { train_id: '12301', train_name: 'Howrah Rajdhani Express', priority_tier: 'Premier', baseSpeed: 130 },
  { train_id: '12952', train_name: 'Mumbai Tejas Rajdhani', priority_tier: 'Premier', baseSpeed: 130 },
  { train_id: '12260', train_name: 'Sealdah AC Duronto', priority_tier: 'Express', baseSpeed: 110 },
  { train_id: '12626', train_name: 'Kerala Superfast Express', priority_tier: 'Express', baseSpeed: 105 },
  { train_id: '12424', train_name: 'Dibrugarh Town Rajdhani', priority_tier: 'Express', baseSpeed: 115 },
  { train_id: 'BOXN-8842', train_name: 'Heavy-Haul Coal Rake', priority_tier: 'Freight', baseSpeed: 75 },
  { train_id: 'BCNA-4491', train_name: 'High-Speed Container Freight', priority_tier: 'Freight', baseSpeed: 85 },
];

/**
 * Generates dynamic AI train dispatch plans for any corridor/block collection.
 */
export function generateAiPlanForBlocks(
  blockIds: string[],
  corridorKey = 'default'
): Record<string, AiPlanBlock> {
  const rng = new SeededRandom(`ai-plan-${corridorKey}`);
  const result: Record<string, AiPlanBlock> = {};

  const baseTime = Date.now();
  let cumulativeOffsetMinutes = 5;

  // Pick 3-5 distinct trains that traverse subsets of blocks in this section
  const numTrains = Math.min(TRAIN_TEMPLATES.length, Math.max(3, Math.floor(blockIds.length / 5)));
  const shuffledTrains = [...TRAIN_TEMPLATES].sort(() => rng.next() - 0.5).slice(0, numTrains);

  blockIds.forEach((blockId, index) => {
    // Cluster blocks to train assignments
    const trainIndex = Math.floor((index / blockIds.length) * shuffledTrains.length);
    const train = shuffledTrains[trainIndex] || shuffledTrains[0];

    const transitMinutes = rng.nextInt(2, 4);
    const entryDate = new Date(baseTime + (cumulativeOffsetMinutes + index * 2) * 60000);
    const exitDate = new Date(entryDate.getTime() + transitMinutes * 60000);

    const speedVariation = rng.nextInt(-10, 10);
    const plannedSpeed = Math.max(60, train.baseSpeed + speedVariation);
    const headway = rng.nextInt(180, 480);

    result[blockId] = {
      block_id: blockId,
      train_id: train.train_id,
      train_name: train.train_name,
      entry_time: entryDate.toISOString(),
      exit_time: exitDate.toISOString(),
      planned_speed_kmh: plannedSpeed,
      headway_seconds: headway,
      priority_tier: train.priority_tier,
    };
  });

  return result;
}

