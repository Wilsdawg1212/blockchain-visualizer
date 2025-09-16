// app/api/ping/route.ts
import { httpClient } from '../../lib/viemClient';

export async function GET() {
  const n = await httpClient.getBlockNumber();
  return new Response(JSON.stringify({ blockNumber: Number(n) }), {
    headers: { 'content-type': 'application/json' },
  });
}
