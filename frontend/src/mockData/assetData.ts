import { AssetBlock } from '../types';

export function generateMockAssetData(blockIds: string[]): Record<string, AssetBlock> {
  const assetMap: Record<string, AssetBlock> = {};

  const assetsRoster: { id: string; type: AssetBlock['asset_type']; status: AssetBlock['asset_status'] }[] = [
    { id: 'WAP-7 #30245', type: 'Electric Loco (WAP-7)', status: 'Holding at Signal' },
    { id: 'VB-Rake #14', type: 'EMU / Vande Bharat', status: 'Optimal Transit' },
    { id: 'WAP-5 #30012', type: 'Electric Loco (WAP-7)', status: 'Speed Restricted' },
    { id: 'WDM-3D #11340', type: 'Diesel Loco (WDM-3D)', status: 'Yard Staging' },
    { id: 'BOXN-WR #882', type: 'Freight Rake', status: 'Holding at Signal' },
  ];

  // Specific idle values to showcase gradient buckets
  const idleValues = [4, 8, 18, 22, 38, 45, 95, 12, 16, 72, 85, 110, 6, 28, 14, 55, 32, 105, 15, 8];

  blockIds.forEach((blockId, idx) => {
    const idle = idleValues[idx % idleValues.length];
    const asset = assetsRoster[idx % assetsRoster.length];

    assetMap[blockId] = {
      block_id: blockId,
      idle_minutes: idle,
      asset_id: asset.id,
      asset_type: asset.type,
      asset_status: idle > 60 ? 'Holding at Signal' : idle > 25 ? 'Speed Restricted' : 'Optimal Transit',
    };
  });

  return assetMap;
}

