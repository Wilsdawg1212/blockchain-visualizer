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
  clearBlocks: () => void; // Clear all blocks for fresh search
  reset: () => void;
  getVisibleBlocks: () => UiBlock[];
}

// Helper function to load a single block from the blockchain
const loadBlockFromChain = async (blockNumber: number): Promise<RawBlock> => {
  console.log('Loading block from chain:', blockNumber);

  try {
    const block = await httpClient.getBlock({
      blockNumber: BigInt(blockNumber),
    });
    console.log(
      'Block loaded from chain:',
      block.number,
      ' Hash: ',
      block.hash
    );

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
      txCount: Array.isArray(block.transactions)
        ? block.transactions.length
        : 0,
      ...l1Data,
    };
  } catch (error) {
    console.error(`Failed to load block ${blockNumber}:`, error);
    throw new Error(
      `Failed to load block ${blockNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
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
          // Only add blocks if we're in live mode
          if (!s.isLiveMode) {
            console.log('📚 Historical mode: ignoring pushBlock call');
            return s; // Return current state unchanged
          }

          // Convert raw block to UI block (BigInt -> string)
          const b = rawBlockToUiBlock(rawBlock);

          // avoid duplicates (same hash)
          if (s.blocks.length && s.blocks[0].hash === b.hash) return s;

          const next = [b, ...s.blocks];

          // In live mode, update current position to the latest block
          return {
            blocks:
              next.length > s.maxBlocks ? next.slice(0, s.maxBlocks) : next,
            currentPosition: b.number,
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

        // Validate block number
        if (centerBlock < 0) {
          console.error('❌ Invalid block number: cannot be negative');
          throw new Error('Block number cannot be negative');
        }

        // Use a larger window for searches to ensure better coverage
        const searchWindowSize = 20; // Load 20 blocks around the target for better context
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

        // Determine if we need to clear existing blocks
        // If the target block is far from current blocks, clear and reload
        const currentBlocks = state.blocks;
        const hasTargetBlock = currentBlocks.some(
          b => b.number === centerBlock
        );

        // Calculate the distance from current blocks
        let maxDistance = 0;
        if (currentBlocks.length > 0) {
          const distances = currentBlocks.map(b =>
            Math.abs(b.number - centerBlock)
          );
          maxDistance = Math.min(...distances);
        }

        // Clear blocks if:
        // 1. We don't have the target block, OR
        // 2. The target block is more than 50 blocks away from any current block
        const shouldClearBlocks = !hasTargetBlock || maxDistance > 50;

        console.log('🎯 Search analysis:', {
          hasTargetBlock,
          maxDistance,
          shouldClearBlocks,
          currentBlockRange:
            currentBlocks.length > 0
              ? `${Math.min(...currentBlocks.map(b => b.number))}-${Math.max(...currentBlocks.map(b => b.number))}`
              : 'none',
          targetBlock: centerBlock,
        });

        // If searching far from current blocks, clear existing blocks
        if (shouldClearBlocks) {
          console.log('🧹 Clearing existing blocks for fresh search');
          set({ blocks: [] });
        }

        // Check which blocks we need to load
        const blocksToLoad = [];
        for (let i = startBlock; i <= endBlock; i++) {
          blocksToLoad.push(i);
        }

        console.log('📋 Blocks to load:', blocksToLoad);

        if (blocksToLoad.length === 0) {
          // This shouldn't happen, but just in case
          console.log('⚠️ No blocks to load');
          set({
            currentPosition: centerBlock,
            isLiveMode: false,
          });
          return;
        }

        console.log('⏳ Setting loading state to true');
        set({ isLoadingHistorical: true });

        try {
          // Load blocks in batches with delays to avoid rate limiting
          const batchSize = 20; // Load more blocks per batch
          let allLoadedBlocks: RawBlock[] = [];

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

            // Accumulate all blocks
            allLoadedBlocks = [...allLoadedBlocks, ...rawBlocks];

            // Add a small delay between batches to avoid rate limiting
            if (i + batchSize < blocksToLoad.length) {
              await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
            }
          }

          // Now set all blocks at once
          console.log(
            '🎯 Setting all loaded blocks at once:',
            allLoadedBlocks.length
          );
          set(s => {
            const newBlocks = allLoadedBlocks.map(rawBlockToUiBlock);
            console.log(
              '🔄 Converting all raw blocks to UI blocks:',
              newBlocks.map(b => b.number)
            );

            // Since we cleared blocks earlier if needed, we can just use the new blocks
            // Sort by block number descending (newest first)
            const sortedBlocks = newBlocks.sort((a, b) => b.number - a.number);

            console.log(
              '🔗 Final blocks count:',
              sortedBlocks.length,
              'sorted by number desc'
            );

            // Ensure we don't exceed maxBlocks
            const finalBlocks = sortedBlocks.slice(0, s.maxBlocks);

            // Debug: Check if our searched block is in the final result
            const searchedBlockExists = finalBlocks.some(
              b => b.number === centerBlock
            );
            console.log(
              `Final result: total blocks=${finalBlocks.length}, searched block ${centerBlock} exists: ${searchedBlockExists}`
            );
            console.log(
              'Final blocks loaded:',
              finalBlocks.map(b => b.number)
            );

            // Ensure the searched block is always included
            const finalBlocksWithSearched = finalBlocks;
            if (!searchedBlockExists) {
              console.log(
                `⚠️ Searched block ${centerBlock} not found in final blocks - this should not happen`
              );
              console.log(
                `Available blocks: ${finalBlocks.map(b => b.number).join(', ')}`
              );
            }

            console.log(
              '🎯 Final state update - blocks:',
              finalBlocksWithSearched.length,
              'currentPosition:',
              centerBlock,
              'isLiveMode: false'
            );

            return {
              blocks: finalBlocksWithSearched,
              currentPosition: centerBlock,
              isLiveMode: false,
            };
          });
        } catch (error) {
          console.error('Failed to load block window:', error);

          // Provide specific error messages based on the error type
          let errorMessage = 'Failed to load blocks';
          if (error instanceof Error) {
            if (error.message.includes('429')) {
              errorMessage =
                'Rate limited by RPC endpoint. Please wait a moment and try again.';
            } else if (
              error.message.includes('404') ||
              error.message.includes('not found')
            ) {
              errorMessage = `Block ${centerBlock} not found. It may not exist or be too far in the past.`;
            } else if (error.message.includes('invalid')) {
              errorMessage = `Invalid block number: ${centerBlock}`;
            } else {
              errorMessage = `Error loading block ${centerBlock}: ${error.message}`;
            }
          }

          // Log error for debugging but don't show popup to user
          console.error('Block loading error:', errorMessage);
          throw error; // Re-throw to let the calling code handle it
        } finally {
          console.log('🏁 Setting loading state to false');
          set({ isLoadingHistorical: false });
        }
      },
      clearBlocks: () => {
        console.log('🧹 Clearing all blocks');
        set({ blocks: [] });
      },
      navigateToBlock: async blockNumber => {
        // Validate block number before attempting to load
        if (blockNumber < 0) {
          throw new Error('Block number cannot be negative');
        }

        // Check if block is in the future (beyond tip)
        const state = get();
        if (state.tipNumber > 0 && blockNumber > state.tipNumber) {
          throw new Error(
            `Block ${blockNumber} is in the future. Current tip is ${state.tipNumber}`
          );
        }

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
          console.log(
            '🔍 Looking for block:',
            state.currentPosition,
            'in blocks:',
            sortedBlocks.map(b => b.number)
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
