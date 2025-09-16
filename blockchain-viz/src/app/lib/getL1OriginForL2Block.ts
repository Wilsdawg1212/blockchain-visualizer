import { httpClient } from '../lib/viemClient';
import { L1_BLOCK_ABI, L1_BLOCK_ADDR } from './l1BlockPredeploy';

export async function getL1OriginForL2Block(l2BlockNumber: bigint) {
  const [num, hash, ts] = await Promise.all([
    httpClient.readContract({
      address: L1_BLOCK_ADDR,
      abi: L1_BLOCK_ABI,
      functionName: 'number',
      blockNumber: l2BlockNumber,
    }) as Promise<bigint>,
    httpClient.readContract({
      address: L1_BLOCK_ADDR,
      abi: L1_BLOCK_ABI,
      functionName: 'hash',
      blockNumber: l2BlockNumber,
    }) as Promise<`0x${string}`>,
    httpClient.readContract({
      address: L1_BLOCK_ADDR,
      abi: L1_BLOCK_ABI,
      functionName: 'timestamp',
      blockNumber: l2BlockNumber,
    }) as Promise<bigint>,
  ]);

  return {
    l1Number: Number(num),
    l1Hash: hash,
    l1TimestampMs: Number(ts) * 1000,
  };
}
