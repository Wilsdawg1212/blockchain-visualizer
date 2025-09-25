// app/stores/useBlocksStore.ts
'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { httpClient } from '@/app/lib/viemClient';

export type UiBlock = {
  number: number;
  hash: `0x${string}`;
  parentHash: `0x${string}`;
  timestampMs: number;
  gasUsed?: string; // Store as string for serialization
  gasLimit?: string; // Store as string for serialization
  baseFeePerGas?: string | null; // Store as string for serialization
  txCount: number;
  l1Number?: number; // L1 block number this L2 block is derived from
  l1Hash?: `0x${string}`; // L1 block hash
  l1TimestampMs?: number; // L1 block timestamp
};

// Helper type for the raw block data from the blockchain
export type RawBlock = {
  number: number;
  hash: `0x${string}`;
  parentHash: `0x${string}`;
  timestampMs: number;
  gasUsed?: bigint;
  gasLimit?: bigint;
  baseFeePerGas?: bigint | null;
  txCount: number;
  l1Number?: number; // L1 block number this L2 block is derived from
  l1Hash?: `0x${string}`; // L1 block hash
  l1TimestampMs?: number; // L1 block timestamp
};

// Helper functions to convert between BigInt and string for serialization
const bigIntToString = (
  value: bigint | undefined | null
): string | undefined | null => {
  if (value === undefined || value === null) return value;
  return value.toString();
};

const stringToBigInt = (
  value: string | undefined | null
): bigint | undefined | null => {
  if (value === undefined || value === null) return value;
  return BigInt(value);
};

// Convert raw block to UI block (BigInt -> string)
const rawBlockToUiBlock = (raw: RawBlock): UiBlock => ({
  ...raw,
  gasUsed: bigIntToString(raw.gasUsed) ?? undefined,
  gasLimit: bigIntToString(raw.gasLimit) ?? undefined,
  baseFeePerGas: bigIntToString(raw.baseFeePerGas) ?? undefined,
  // L1 data is already in the correct format (numbers/strings)
});

// Convert UI block to raw block (string -> BigInt) - for display purposes
export const uiBlockToRawBlock = (ui: UiBlock): RawBlock => ({
  ...ui,
  gasUsed: stringToBigInt(ui.gasUsed) ?? undefined,
  gasLimit: stringToBigInt(ui.gasLimit) ?? undefined,
  baseFeePerGas: stringToBigInt(ui.baseFeePerGas) ?? undefined,
  // L1 data remains as numbers/strings
});

interface BlocksState {
  blocks: UiBlock[];
  tipNumber: number;
  currentPosition: number; // User's current viewing position
  isLiveMode: boolean; // Whether we're in live mode or historical mode
  windowSize: number; // How many blocks to keep around current position
  maxBlocks: number; // Maximum total blocks to store
  isLoadingHistorical: boolean; // Loading state for historical blocks
  pushBlock: (b: RawBlock) => void; // Accept raw block with BigInt values
  setTip: (n: number) => void;
  setCurrentPosition: (position: number) => void;
  setLiveMode: (isLive: boolean) => void;
  navigateToBlock: (blockNumber: number) => Promise<void>; // Now async
  navigateRelative: (direction: 'prev' | 'next') => Promise<void>; // Now async
  loadHistoricalBlocks: (startBlock: number, endBlock: number) => Promise<void>;
  loadBlockWindow: (centerBlock: number) => Promise<void>; // New function to load window around a block
  reset: () => void;
  getVisibleBlocks: () => UiBlock[];
}

// Helper function to load a single block from the blockchain
const loadBlockFromChain = async (blockNumber: number): Promise<RawBlock> => {
  const block = await httpClient.getBlock({ blockNumber: BigInt(blockNumber) });

  // Fetch L1 origin data for this L2 block
  let l1Data = {};
  try {
    const { getL1OriginForL2Block } = await import(
      '@/app/lib/getL1OriginForL2Block'
    );
    const l1Origin = await getL1OriginForL2Block(BigInt(blockNumber));
    l1Data = {
      l1Number: l1Origin.l1Number,
      l1Hash: l1Origin.l1Hash,
      l1TimestampMs: l1Origin.l1TimestampMs,
    };
  } catch (error) {
    console.warn('Failed to fetch L1 origin for block', blockNumber, error);
  }

  return {
    number: Number(block.number),
    hash: block.hash,
    parentHash: block.parentHash,
    timestampMs: Number(block.timestamp) * 1000,
    gasUsed: block.gasUsed,
    gasLimit: block.gasLimit,
    baseFeePerGas: block.baseFeePerGas,
    txCount: Array.isArray(block.transactions) ? block.transactions.length : 0,
    ...l1Data,
  };
};

export const useBlocksStore = create<BlocksState>()(
  persist(
    (set, get) => ({
      blocks: [],
      tipNumber: 0,
      currentPosition: 0,
      isLiveMode: true,
      windowSize: 50, // Show 50 blocks around current position
      maxBlocks: 200, // Store up to 1000 blocks total
      isLoadingHistorical: false,
      pushBlock: rawBlock =>
        set(s => {
          // Convert raw block to UI block (BigInt -> string)
          const b = rawBlockToUiBlock(rawBlock);

          // avoid duplicates (same hash)
          if (s.blocks.length && s.blocks[0].hash === b.hash) return s;

          const next = [b, ...s.blocks];

          // If in live mode, update current position to the latest block
          if (s.isLiveMode) {
            return {
              blocks:
                next.length > s.maxBlocks ? next.slice(0, s.maxBlocks) : next,
              currentPosition: b.number,
            };
          }

          // In historical mode, just add the block without changing position
          return {
            blocks:
              next.length > s.maxBlocks ? next.slice(0, s.maxBlocks) : next,
          };
        }),
      setTip: n => set({ tipNumber: n }),
      setCurrentPosition: position => set({ currentPosition: position }),
      setLiveMode: isLive =>
        set(s => ({
          isLiveMode: isLive,
          currentPosition: isLive ? s.tipNumber : s.currentPosition,
        })),
      loadBlockWindow: async centerBlock => {
        const state = get();
        const halfWindow = Math.floor(state.windowSize / 2);
        const startBlock = Math.max(0, centerBlock - halfWindow);
        const endBlock = Math.min(state.tipNumber, centerBlock + halfWindow);

        // Check which blocks we need to load
        const blocksToLoad = [];
        for (let i = startBlock; i <= endBlock; i++) {
          const existingBlock = state.blocks.find(b => b.number === i);
          if (!existingBlock) {
            blocksToLoad.push(i);
          }
        }

        if (blocksToLoad.length === 0) {
          // All blocks already exist, just update position
          set({
            currentPosition: centerBlock,
            isLiveMode: false,
          });
          return;
        }

        set({ isLoadingHistorical: true });

        try {
          // Load blocks in batches to avoid overwhelming the RPC
          const batchSize = 10;
          for (let i = 0; i < blocksToLoad.length; i += batchSize) {
            const batch = blocksToLoad.slice(i, i + batchSize);
            const promises = batch.map(blockNumber =>
              loadBlockFromChain(blockNumber)
            );
            const rawBlocks = await Promise.all(promises);

            set(s => {
              const newBlocks = rawBlocks.map(rawBlockToUiBlock);
              const existingNumbers = new Set(s.blocks.map(b => b.number));
              const uniqueNewBlocks = newBlocks.filter(
                b => !existingNumbers.has(b.number)
              );

              const combined = [...uniqueNewBlocks, ...s.blocks].sort(
                (a, b) => b.number - a.number
              );

              return {
                blocks:
                  combined.length > s.maxBlocks
                    ? combined.slice(0, s.maxBlocks)
                    : combined,
                currentPosition: centerBlock,
                isLiveMode: false,
              };
            });
          }
        } catch (error) {
          console.error('Failed to load block window:', error);
        } finally {
          set({ isLoadingHistorical: false });
        }
      },
      navigateToBlock: async blockNumber => {
        // Use the new loadBlockWindow function
        await get().loadBlockWindow(blockNumber);
      },
      navigateRelative: async direction => {
        const state = get();
        const sortedBlocks = [...state.blocks].sort(
          (a, b) => b.number - a.number
        );
        const currentIndex = sortedBlocks.findIndex(
          b => b.number === state.currentPosition
        );

        let targetBlockNumber: number;

        if (direction === 'next' && currentIndex > 0) {
          targetBlockNumber = sortedBlocks[currentIndex - 1].number;
        } else if (
          direction === 'prev' &&
          currentIndex < sortedBlocks.length - 1
        ) {
          targetBlockNumber = sortedBlocks[currentIndex + 1].number;
        } else {
          // Need to load more blocks
          if (direction === 'next') {
            // Load older blocks
            const oldestBlock = sortedBlocks[sortedBlocks.length - 1];
            targetBlockNumber = oldestBlock
              ? oldestBlock.number - 1
              : state.currentPosition - 1;
          } else {
            // Load newer blocks
            const newestBlock = sortedBlocks[0];
            targetBlockNumber = newestBlock
              ? newestBlock.number + 1
              : state.currentPosition + 1;
          }
        }

        // Load the target block with its window
        await get().loadBlockWindow(targetBlockNumber);
      },
      loadHistoricalBlocks: async (startBlock, endBlock) => {
        set({ isLoadingHistorical: true });

        try {
          const blocksToLoad = [];
          for (let i = startBlock; i <= endBlock; i++) {
            const existingBlock = get().blocks.find(b => b.number === i);
            if (!existingBlock) {
              blocksToLoad.push(i);
            }
          }

          // Load blocks in batches to avoid overwhelming the RPC
          const batchSize = 10;
          for (let i = 0; i < blocksToLoad.length; i += batchSize) {
            const batch = blocksToLoad.slice(i, i + batchSize);
            const promises = batch.map(blockNumber =>
              loadBlockFromChain(blockNumber)
            );
            const rawBlocks = await Promise.all(promises);

            set(s => {
              const newBlocks = rawBlocks.map(rawBlockToUiBlock);
              const existingNumbers = new Set(s.blocks.map(b => b.number));
              const uniqueNewBlocks = newBlocks.filter(
                b => !existingNumbers.has(b.number)
              );

              const combined = [...uniqueNewBlocks, ...s.blocks].sort(
                (a, b) => b.number - a.number
              );
              return {
                blocks:
                  combined.length > s.maxBlocks
                    ? combined.slice(0, s.maxBlocks)
                    : combined,
              };
            });
          }
        } catch (error) {
          console.error('Failed to load historical blocks:', error);
        } finally {
          set({ isLoadingHistorical: false });
        }
      },
      reset: () =>
        set({
          blocks: [],
          tipNumber: 0,
          currentPosition: 0,
          isLiveMode: true,
          isLoadingHistorical: false,
        }),
      getVisibleBlocks: () => {
        const state = get();
        if (state.isLiveMode) {
          // In live mode, show the most recent blocks
          return state.blocks.slice(0, state.windowSize);
        } else {
          // In historical mode, show blocks around current position with even distribution
          const sortedBlocks = [...state.blocks].sort(
            (a, b) => b.number - a.number
          );
          const currentIndex = sortedBlocks.findIndex(
            b => b.number === state.currentPosition
          );

          if (currentIndex === -1) return [];

          // Calculate even distribution around current block
          const halfWindow = Math.floor(state.windowSize / 2);
          const start = Math.max(0, currentIndex - halfWindow);
          const end = Math.min(sortedBlocks.length, start + state.windowSize);

          // Adjust start if we're near the end to maintain window size
          const actualStart = Math.max(0, end - state.windowSize);

          return sortedBlocks.slice(actualStart, end);
        }
      },
    }),
    {
      name: 'blockchain-blocks-storage',
      partialize: state => ({
        blocks: state.blocks.slice(0, 200), // Only persist last 200 blocks to save space
        tipNumber: state.tipNumber,
        currentPosition: state.currentPosition,
        isLiveMode: state.isLiveMode,
      }),
    }
  )
);
