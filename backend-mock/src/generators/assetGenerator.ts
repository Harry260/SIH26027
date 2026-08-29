import { AssetBlock } from '../types/index.js';
import { SeededRandom } from '../utils/pseudoRandom.js';

interface AssetProfile {
  asset_type: 'Electric Loco (WAP-7)' | 'Diesel Loco (WDM-3D)' | 'EMU / Vande Bharat' | 'Freight Rake';
  idPrefix: string;
}

const ASSET_PROFILES: AssetProfile[] = [
  { asset_type: 'Electric Loco (WAP-7)', idPrefix: 'WAP7-' },
  { asset_type: 'Diesel Loco (WDM-3D)', idPrefix: 'WDM3D-' },
  { asset_type: 'EMU / Vande Bharat', idPrefix: 'VB16-' },
  { asset_type: 'Freight Rake', idPrefix: 'WAG9-' },
];

/**
 * Generates real-time asset telemetry and idle heatmap metrics for any corridor
 */
export function generateAssetDataForBlocks(
  blockIds: string[],
  corridorKey = 'default'
): Record<string, AssetBlock> {
  const rng = new SeededRandom(`asset-data-${corridorKey}`);
  const result: Record<string, AssetBlock> = {};

  blockIds.forEach((blockId, idx) => {
    const profile = rng.pick(ASSET_PROFILES);
    const assetNumber = rng.nextInt(30100, 39999);
    const assetId = `${profile.idPrefix}${assetNumber}`;

    // Cluster high idle times around certain sections (simulating congestion/holding signals)
    let idleMinutes = 0;
    const isBottleneck = (idx % 7 === 2 || idx % 7 === 5);

    if (isBottleneck) {
      idleMinutes = rng.nextInt(65, 195);
    } else if (rng.chance(0.35)) {
      idleMinutes = rng.nextInt(20, 55);
    } else {
      idleMinutes = rng.nextInt(0, 15);
    }

    let assetStatus: AssetBlock['asset_status'];
    if (idleMinutes > 90) {
      assetStatus = 'Holding at Signal';
    } else if (idleMinutes > 40) {
      assetStatus = 'Speed Restricted';
    } else if (idleMinutes > 15) {
      assetStatus = 'Yard Staging';
    } else {
      assetStatus = 'Optimal Transit';
    }

    result[blockId] = {
      block_id: blockId,
      idle_minutes: idleMinutes,
      asset_id: assetId,
      asset_type: profile.asset_type,
      asset_status: assetStatus,
    };
  });

  return result;
}

