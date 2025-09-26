// app/hooks/useLiveBlocks.ts
'use client';
import { useEffect, useRef } from 'react';
import { useBlocksStore, RawBlock } from '@/app/stores/useBlockStore';
import { httpClient, wsClient } from '@/app/lib/viemClient';
import { getL1OriginForL2Block } from '@/app/lib/getL1OriginForL2Block';

type AnyBlock = {
  number: bigint;
  hash: `0x${string}`;
  parentHash: `0x${string}`;
  timestamp: bigint;
  gasUsed: bigint;
  gasLimit: bigint;
  baseFeePerGas?: bigint | null;
  transactions: unknown[];
};

export default function useLiveBlocks(pollMs = 2000) {
  const { pushBlock, setTip } = useBlocksStore();
  const stopPoll = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let unwatch: (() => void) | undefined;

    const onBlock = async (blk: AnyBlock) => {
      // Defensive check for undefined/null block
      if (!blk || typeof blk !== 'object') {
        console.error('❌ onBlock received invalid block data:', blk);
        return;
      }

      if (blk.number === undefined || blk.number === null) {
        console.error('❌ onBlock received block without number:', blk);
        return;
      }

      const number = Number(blk.number);

      // Fetch L1 origin data for this L2 block
      let l1Data = {};
      try {
        const l1Origin = await getL1OriginForL2Block(blk.number);
        l1Data = {
          l1Number: l1Origin.l1Number,
          l1Hash: l1Origin.l1Hash,
          l1TimestampMs: l1Origin.l1TimestampMs,
        };
      } catch (error) {
        console.warn('Failed to fetch L1 origin for block', number, error);
      }

      const rawBlock: RawBlock = {
        number,
        hash: blk.hash,
        parentHash: blk.parentHash,
        timestampMs: Number(blk.timestamp) * 1000,
        gasUsed: blk.gasUsed,
        gasLimit: blk.gasLimit,
        baseFeePerGas: blk.baseFeePerGas,
        txCount: Array.isArray(blk.transactions) ? blk.transactions.length : 0,
        ...l1Data,
      };

      setTip(number);
      pushBlock(rawBlock);
    };

    // Prefer WebSocket if available
    if (wsClient) {
      try {
        unwatch = wsClient.watchBlocks({
          includeTransactions: false,
          onBlock: block => {
            console.log(
              '🔌 WebSocket received block:',
              block ? `Block #${block.number}` : 'null/undefined'
            );
            onBlock(block as AnyBlock);
          },
          onError: error => {
            console.error('❌ WebSocket error:', error);
            startPolling();
          },
        });
      } catch (error) {
        console.error('❌ Failed to start WebSocket:', error);
        startPolling();
      }
    } else {
      console.log('📡 WebSocket not available, starting HTTP polling');
      startPolling();
    }

    return () => {
      try {
        unwatch?.();
      } catch {}
      if (stopPoll.current) clearTimeout(stopPoll.current);
    };

    function startPolling() {
      const tick = async () => {
        try {
          const n = await httpClient.getBlockNumber();
          console.log('📡 Polling for block number:', n);

          const b = (await httpClient.getBlock({
            blockNumber: n,
          })) as unknown as AnyBlock;

          console.log(
            '📦 Received block from API:',
            b ? `Block #${b.number}` : 'null/undefined'
          );

          if (b) {
            onBlock(b);
          } else {
            console.error('❌ API returned null/undefined block');
          }
        } catch (e) {
          console.error('❌ Poll error:', e);
        } finally {
          stopPoll.current = setTimeout(tick, pollMs);
        }
      };
      tick();
    }
  }, [pollMs, pushBlock, setTip]);
}
