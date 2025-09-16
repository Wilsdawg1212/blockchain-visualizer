// lib/viemClient.ts
import { createPublicClient, http, webSocket } from 'viem';
import { base, mainnet } from 'viem/chains';

// HTTP client is required
export const httpClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_HTTP_URL!),
});

// WS client is optional (null if you didn't set a WS URL)
export const wsClient = process.env.NEXT_PUBLIC_BASE_WS_URL
  ? createPublicClient({
      chain: base,
      transport: webSocket(process.env.NEXT_PUBLIC_BASE_WS_URL),
    })
  : null;

// NEW: Ethereum L1 client
export const l1HttpClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_ETH_HTTP_URL!),
});
