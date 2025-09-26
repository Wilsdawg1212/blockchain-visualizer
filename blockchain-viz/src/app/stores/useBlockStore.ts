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
  console.log('Loading block from chain:', blockNumber);
  const block = await httpClient.getBlock({ blockNumber: BigInt(blockNumber) });
  console.log('Block loaded from chain:', block.number, ' Hash: ', block.hash);

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
        console.log('🔍 loadBlockWindow called with centerBlock:', centerBlock);
        console.log(
          '📊 Current state - blocks count:',
          state.blocks.length,
          'currentPosition:',
          state.currentPosition,
          'isLiveMode:',
          state.isLiveMode
        );

        // Use a smaller window for searches to avoid rate limiting
        const searchWindowSize = 10; // Only load 10 blocks around the target
        const halfWindow = Math.floor(searchWindowSize / 2);
        const startBlock = Math.max(0, centerBlock - halfWindow);
        const endBlock = centerBlock + halfWindow;

        console.log(
          '📏 Window calculation - startBlock:',
          startBlock,
          'endBlock:',
          endBlock,
          'halfWindow:',
          halfWindow
        );

        // Check which blocks we need to load
        const blocksToLoad = [];
        for (let i = startBlock; i <= endBlock; i++) {
          const existingBlock = state.blocks.find(b => b.number === i);
          if (!existingBlock) {
            blocksToLoad.push(i);
          }
        }

        console.log('📋 Blocks to load:', blocksToLoad);
        console.log(
          '📋 Existing blocks in range:',
          state.blocks
            .filter(b => b.number >= startBlock && b.number <= endBlock)
            .map(b => b.number)
        );

        if (blocksToLoad.length === 0) {
          // All blocks already exist, just update position
          console.log(
            '✅ All blocks already exist, updating position to:',
            centerBlock
          );
          set({
            currentPosition: centerBlock,
            isLiveMode: false,
          });
          return;
        }

        console.log('⏳ Setting loading state to true');
        set({ isLoadingHistorical: true });

        try {
          // Load blocks in smaller batches with delays to avoid rate limiting
          const batchSize = 3; // Reduced batch size
          for (let i = 0; i < blocksToLoad.length; i += batchSize) {
            const batch = blocksToLoad.slice(i, i + batchSize);
            console.log('📦 Loading batch:', batch);
            const promises = batch.map(blockNumber =>
              loadBlockFromChain(blockNumber)
            );
            const rawBlocks = await Promise.all(promises);
            console.log(
              '✅ Batch loaded successfully, rawBlocks count:',
              rawBlocks.length
            );

            // Add a small delay between batches to avoid rate limiting
            if (i + batchSize < blocksToLoad.length) {
              await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
            }

            set(s => {
              const newBlocks = rawBlocks.map(rawBlockToUiBlock);
              console.log(
                '🔄 Converting raw blocks to UI blocks:',
                newBlocks.map(b => b.number)
              );

              const existingNumbers = new Set(s.blocks.map(b => b.number));
              const uniqueNewBlocks = newBlocks.filter(
                b => !existingNumbers.has(b.number)
              );
              console.log(
                '🆕 Unique new blocks:',
                uniqueNewBlocks.map(b => b.number)
              );

              const combined = [...uniqueNewBlocks, ...s.blocks].sort(
                (a, b) => b.number - a.number
              );
              console.log(
                '🔗 Combined blocks count:',
                combined.length,
                'sorted by number desc'
              );

              const finalBlocks =
                combined.length > s.maxBlocks
                  ? combined.slice(0, s.maxBlocks)
                  : combined;

              let smartTrimmedBlocks = finalBlocks;
              if (combined.length > s.maxBlocks) {
                const searchedBlock = combined.find(
                  b => b.number === centerBlock
                );
                if (
                  searchedBlock &&
                  !finalBlocks.some(b => b.number === centerBlock)
                ) {
                  // The searched block was trimmed out, add it back
                  smartTrimmedBlocks = [
                    ...finalBlocks.slice(0, s.maxBlocks - 1),
                    searchedBlock,
                  ];
                  console.log(
                    `Smart trim: Preserved searched block ${centerBlock}`
                  );
                }
              }

              // Debug: Check if our searched block is still in the store
              const searchedBlockExists = smartTrimmedBlocks.some(
                b => b.number === centerBlock
              );
              console.log(
                `After trimming: total blocks=${smartTrimmedBlocks.length}, searched block ${centerBlock} exists: ${searchedBlockExists}`
              );
              console.log(
                '🎯 Final state update - blocks:',
                smartTrimmedBlocks.length,
                'currentPosition:',
                centerBlock,
                'isLiveMode: false'
              );

              return {
                blocks: smartTrimmedBlocks,
                currentPosition: centerBlock,
                isLiveMode: false,
              };
            });
          }
        } catch (error) {
          console.error('Failed to load block window:', error);
          // If we get rate limited, show a helpful message
          if (
            error instanceof Error &&
            error.message &&
            error.message.includes('429')
          ) {
            alert(
              'Rate limited by RPC endpoint. Please wait a moment and try again.'
            );
          }
        } finally {
          console.log('🏁 Setting loading state to false');
          set({ isLoadingHistorical: false });
        }
      },
      navigateToBlock: async blockNumber => {
        // Use the new loadBlockWindow function
        console.log('Navigating to block inside navigateToBlock:', blockNumber);
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
        console.log(
          '👁️ getVisibleBlocks called - isLiveMode:',
          state.isLiveMode,
          'currentPosition:',
          state.currentPosition,
          'totalBlocks:',
          state.blocks.length
        );

        if (state.isLiveMode) {
          // In live mode, show the most recent blocks
          const visibleBlocks = state.blocks.slice(0, state.windowSize);
          console.log(
            '📺 Live mode - returning first',
            state.windowSize,
            'blocks:',
            visibleBlocks.map(b => b.number)
          );
          return visibleBlocks;
        } else {
          // In historical mode, show blocks around current position with even distribution
          const sortedBlocks = [...state.blocks].sort(
            (a, b) => b.number - a.number
          );
          console.log(
            '📊 Historical mode - sorted blocks:',
            sortedBlocks.map(b => b.number)
          );

          const currentIndex = sortedBlocks.findIndex(
            b => b.number === state.currentPosition
          );
          console.log(
            '🎯 Current block index:',
            currentIndex,
            'for position:',
            state.currentPosition
          );

          if (currentIndex === -1) {
            console.log(
              '❌ Current position not found in blocks, showing available blocks around target'
            );
            // If current position not found, show blocks around the target position
            // Find the closest block to currentPosition
            const closestBlock = sortedBlocks.reduce((closest, block) => {
              const currentDiff = Math.abs(
                block.number - state.currentPosition
              );
              const closestDiff = Math.abs(
                closest.number - state.currentPosition
              );
              return currentDiff < closestDiff ? block : closest;
            }, sortedBlocks[0]);

            if (!closestBlock) {
              console.log('❌ No blocks available at all');
              return [];
            }

            const closestIndex = sortedBlocks.findIndex(
              b => b.number === closestBlock.number
            );
            console.log(
              '🎯 Using closest block:',
              closestBlock.number,
              'at index:',
              closestIndex
            );

            // Use the closest block as the center
            const halfWindow = Math.floor(state.windowSize / 2);
            const start = Math.max(0, closestIndex - halfWindow);
            const end = Math.min(sortedBlocks.length, start + state.windowSize);
            const actualStart = Math.max(0, end - state.windowSize);

            const visibleBlocks = sortedBlocks.slice(actualStart, end);
            console.log(
              '📺 Historical mode (fallback) - returning blocks:',
              visibleBlocks.map(b => b.number),
              'window:',
              actualStart,
              'to',
              end
            );
            return visibleBlocks;
          }

          // Calculate even distribution around current block
          const halfWindow = Math.floor(state.windowSize / 2);
          const start = Math.max(0, currentIndex - halfWindow);
          const end = Math.min(sortedBlocks.length, start + state.windowSize);

          // Adjust start if we're near the end to maintain window size
          const actualStart = Math.max(0, end - state.windowSize);

          const visibleBlocks = sortedBlocks.slice(actualStart, end);
          console.log(
            '📺 Historical mode - returning blocks:',
            visibleBlocks.map(b => b.number),
            'window:',
            actualStart,
            'to',
            end
          );
          return visibleBlocks;
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
