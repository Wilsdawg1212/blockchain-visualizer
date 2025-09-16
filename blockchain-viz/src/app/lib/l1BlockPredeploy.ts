export const L1_BLOCK_ADDR =
  '0x4200000000000000000000000000000000000015' as const;

export const L1_BLOCK_ABI = [
  {
    name: 'number',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint64' }],
  },
  {
    name: 'hash',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'timestamp',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint64' }],
  },
  // optional, handy for fees since Dencun:
  {
    name: 'blobBaseFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;
