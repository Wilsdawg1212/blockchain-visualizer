'use client';
import { create } from 'zustand';
import { getL1BlockByNumber } from './getL1Block';

type L1Block = {
  number: bigint;
  hash: `0x${string}`;
  parentHash: `0x${string}`;
  timestamp: bigint;
  gasUsed: bigint;
  gasLimit: bigint;
  baseFeePerGas?: bigint | null;
  transactions: unknown[];
};

type L1CacheState = {
  byNumber: Map<number, L1Block>;
  pending: Set<number>;
  get: (n: number) => L1Block | undefined;
  fetchIfMissing: (n: number) => Promise<void>;
};

export const useL1BlockCache = create<L1CacheState>((set, get) => ({
  byNumber: new Map(),
  pending: new Set(),
  get: n => get().byNumber.get(n),
  fetchIfMissing: async (n: number) => {
    const s = get();
    if (s.byNumber.has(n) || s.pending.has(n)) return;
    s.pending.add(n);
    try {
      const blk = await getL1BlockByNumber(n);
      set(prev => {
        const next = new Map(prev.byNumber);
        next.set(n, blk);
        const pend = new Set(prev.pending);
        pend.delete(n);
        return { byNumber: next, pending: pend };
      });
    } catch (e) {
      console.error('L1 fetch failed', e);
      set(prev => {
        const pend = new Set(prev.pending);
        pend.delete(n);
        return { pending: pend };
      });
    }
  },
}));
