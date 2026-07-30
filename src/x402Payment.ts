// Keyless x402 payment support.
//
// When X402_PRIVATE_KEY is set (an EVM private key whose wallet holds USDC on
// Base), the 10 /agentFriendly tools can be called WITHOUT a CoinCap API key:
// the server pays per call ($0.002–$0.01 USDC) via the x402 protocol. The
// flow, handled entirely by @x402/fetch: request → 402 with payment terms →
// sign an EIP-3009 USDC authorization with the wallet → retry with the
// Payment-Signature header. Signing is off-chain and gasless for the payer;
// CoinCap's facilitator settles on-chain.
//
// The x402 packages are loaded with require() at first use, typed as any:
// they resolve types through package.json exports maps that this project's
// node10 moduleResolution can't read (same limitation their CJS runtime
// entries do NOT have), and eager loading would make every keyed MCP session
// pay the import cost of a feature it never uses.

// Per-call spend cap in atomic USDC units (6 decimals). Applied to the 402's
// advertised amount BEFORE anything is signed — a misbehaving or hijacked
// server cannot drain the wallet past this. Default 100000 = $0.10, ~10x the
// most expensive CoinCap endpoint. Override with X402_MAX_PAYMENT_ATOMIC_USDC.
const DEFAULT_MAX_ATOMIC = 100_000n

type FetchLike = (input: any, init?: any) => Promise<any>

// null = not configured (no key in env); built lazily on first use.
let cachedPaidFetch: FetchLike | null | undefined

export function isX402Configured (): boolean {
  return Boolean(process.env.X402_PRIVATE_KEY)
}

export function getPaidFetch (): FetchLike | null {
  if (cachedPaidFetch !== undefined) return cachedPaidFetch
  const rawKey = process.env.X402_PRIVATE_KEY
  if (!rawKey) {
    cachedPaidFetch = null
    return null
  }

  /* eslint-disable @typescript-eslint/no-var-requires */
  const { privateKeyToAccount } = require('viem/accounts')
  const { ExactEvmScheme } = require('@x402/evm')
  const { x402Client } = require('@x402/core/client')
  const { wrapFetchWithPayment } = require('@x402/fetch')
  /* eslint-enable @typescript-eslint/no-var-requires */

  const privateKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`
  const account = privateKeyToAccount(privateKey)

  // Register both Base mainnet (production CoinCap) and Base Sepolia
  // (staging) — the wrapper signs for whichever network the 402 advertises.
  const client = new x402Client()
    .register('eip155:8453', new ExactEvmScheme(account))
    .register('eip155:84532', new ExactEvmScheme(account))

  const maxAtomic = BigInt(
    process.env.X402_MAX_PAYMENT_ATOMIC_USDC ?? DEFAULT_MAX_ATOMIC
  )

  // Inner fetch enforces the spend cap: it sees the 402 before
  // wrapFetchWithPayment signs anything, and throws if the server asks for
  // more than we allow.
  const cappedFetch: FetchLike = async (input, init) => {
    const res = await fetch(input, init)
    if (res.status !== 402) return res
    try {
      const body = await res.clone().json()
      for (const accept of body?.accepts ?? []) {
        if (accept?.amount && BigInt(accept.amount) > maxAtomic) {
          throw new Error(
            `x402 payment of ${accept.amount} atomic USDC exceeds the cap of ` +
              `${maxAtomic} (override with X402_MAX_PAYMENT_ATOMIC_USDC)`
          )
        }
      }
    } catch (e: any) {
      if (e?.message?.includes('exceeds the cap')) throw e
      // Unparseable 402 body — let the wrapper surface its own error.
    }
    return res
  }

  const wrapped: FetchLike = wrapFetchWithPayment(cappedFetch, client)
  cachedPaidFetch = wrapped
  return wrapped
}
