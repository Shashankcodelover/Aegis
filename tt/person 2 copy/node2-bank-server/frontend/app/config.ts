/**
 * config.ts
 * ─────────────────────────────────────────────
 * Central config for the SOC Dashboard.
 * Set NEXT_PUBLIC_BANK_HOST in .env.local to point
 * at the backend when running across laptops on LAN.
 *
 * Example .env.local:
 *   NEXT_PUBLIC_BANK_HOST=http://192.168.1.42:3002
 * ─────────────────────────────────────────────
 */
export const BANK_HOST =
  process.env.NEXT_PUBLIC_BANK_HOST ?? 'http://localhost:3002';
