import { AiPlanBlock } from '../types';

export function generateMockAiPlan(blockIds: string[]): Record<string, AiPlanBlock> {
  const planMap: Record<string, AiPlanBlock> = {};
  const baseTime = new Date();

  // Pattern of 4 distinct trains traversing the corridor
  const trainRoster = [
    { id: '12002', name: 'Bhopal Shatabdi', priority: 'Premier' as const, baseSpeed: 130 },
    { id: '22436', name: 'Vande Bharat Express', priority: 'Premier' as const, baseSpeed: 145 },
    { id: '12952', name: 'Mumbai Rajdhani', priority: 'Premier' as const, baseSpeed: 135 },
    { id: 'BOXN-8842', name: 'Container Freight', priority: 'Freight' as const, baseSpeed: 85 },
    { id: '12424', name: 'Dibrugarh Rajdhani', priority: 'Express' as const, baseSpeed: 120 },
  ];

  blockIds.forEach((blockId, idx) => {
    // Train assignment rhythm across blocks
    const trainIdx = Math.floor(idx / 4) % trainRoster.length;
    const train = trainRoster[trainIdx];

    const offsetMinutes = (idx % 4) * 6 + Math.floor(idx / 4) * 20;
    const entryDate = new Date(baseTime.getTime() + offsetMinutes * 60000);
    const exitDate = new Date(entryDate.getTime() + 4.5 * 60000);

    planMap[blockId] = {
      block_id: blockId,
      train_id: train.id,
      train_name: train.name,
      entry_time: entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      exit_time: exitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      planned_speed_kmh: train.baseSpeed,
      headway_seconds: 180 + (idx % 3) * 30,
      priority_tier: train.priority,
    };
  });

  return planMap;
}

