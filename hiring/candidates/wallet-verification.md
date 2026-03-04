# Wallet ownership verification (design)

This document describes how to verify that a client owns a `walletAddress` by having the client sign a nonce (or structured message) and having the server verify the signature.

## Goal

Allow a user to prove control of a wallet address and (optionally) link it to their existing email/password account, without the server ever receiving the private key.

## Proposed API

Two-step flow (recommended):

1. **Request a challenge / nonce**
   - `POST /api/auth/wallet/challenge`
   - Body: `{ "walletAddress": "0x..." }`
   - Response: `{ "nonce": "...", "message": "..." }`

2. **Verify signature**
   - `POST /api/auth/wallet/verify`
   - Body: `{ "walletAddress": "0x...", "message": "...", "signature": "..." }`
   - Response (example): `{ "success": true, "walletVerified": true, "token": "<jwt>" }`

> This repo includes a **stub** for `POST /api/auth/wallet/verify` in `routes/api/auth.js` that returns `501` and points to this document.

## Flow details

### 1) Challenge generation

Server generates a cryptographically-random nonce and stores it server-side:

- `nonce`: 16–32 bytes, base64url/hex encoded
- `expiresAt`: e.g. now + 5 minutes
- `used`: boolean
- Optional binding fields:
  - `walletAddress` (lowercased/checksummed normalization)
  - `userId` (if the user is logged in and is linking a wallet)
  - `ipHash` / `userAgentHash` (soft binding)

Server also builds a message for the client to sign. Options:

- **Simple text message** (fast to implement)
- **EIP-4361 (SIWE)**-style message (preferred for EVM wallets)
- **EIP-712 typed data** (strong domain separation, more complex)

Minimum recommended message fields:

- app name (`Texas Hold'em Online`)
- environment / host (domain)
- `walletAddress`
- nonce
- issued at timestamp
- expiration time

### 2) Client signing

Client uses the wallet provider to sign the exact `message`:

- MetaMask / EVM: `personal_sign` / `eth_sign`
- WalletConnect: same signing method routed through WC

Client then sends `{ walletAddress, message, signature }` to the server.

### 3) Server verification

Server verifies:

1. `message` parses to the expected format (app/domain/nonce/address)
2. nonce exists, not expired, not used
3. recovered signer address equals `walletAddress`
4. mark nonce as used (atomic)

If successful, server can:

- issue a JWT with `walletAddress` as a claim, or
- link `walletAddress` to the authenticated user (if already logged in)

## Where to implement in this codebase

### Routes

- Add wallet endpoints under the existing auth router:
  - `routes/api/auth.js`
    - `POST /wallet/challenge`
    - `POST /wallet/verify`

The assignment stub lives here:

- `routes/api/auth.js` → `router.post('/wallet/verify', ...)`

### Controllers

Create controller methods alongside current auth handlers:

- `controllers/auth.js`
  - `createWalletChallenge(req, res)`
  - `verifyWalletSignature(req, res)`

### Storage

For the MVP (in-memory), store nonces in a Map:

- `utils/walletNonceStore.js` (or similar)

For production, store in MongoDB (already present in repo but not wired):

- `models/WalletNonce.js` (nonce, walletAddress, expiresAt, used, userId)

## Security considerations

1. **Replay protection (critical)**
   - Nonce must be **single-use** and **expire quickly**.
   - Mark as used atomically (or with an update condition) to prevent race-condition replay.

2. **Message/domain separation**
   - Include the expected host/domain in the signed message so a signature from another site cannot be reused.

3. **Normalize addresses**
   - For EVM addresses, normalize to checksum or lowercase consistently before storing/comparing.

4. **Rate limiting / abuse**
   - Add rate limiting to `/wallet/challenge` to prevent nonce spam.

5. **Don’t accept arbitrary `message` without parsing**
   - Always parse and validate the message format and fields server-side.

## Implementation notes (EVM example)

For EVM wallets, verification can be done with `ethers`:

- `ethers.verifyMessage(message, signature)` → returns recovered address

If this project later supports non-EVM wallets (e.g. Solana), the signing and verification primitives differ, so the API should include a `chain` field and route to the correct verifier.
