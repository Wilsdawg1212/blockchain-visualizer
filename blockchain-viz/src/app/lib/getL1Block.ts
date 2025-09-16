import { l1HttpClient } from './viemClient';

export async function getL1BlockByNumber(l1Number: number) {
  // viem expects bigint for blockNumber
  const block = await l1HttpClient.getBlock({ blockNumber: BigInt(l1Number) });
  return block; // contains hash, parentHash, timestamp, gasUsed, etc.
}
