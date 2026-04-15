/** A single hardware-level pointer sample captured from mousemove / touchmove */
export interface EntropyPoint {
  x: number // clientX
  y: number // clientY
  t: number // Date.now() timestamp in ms
}

/** The payload dispatched across both transport channels */
export interface TransactionPayload {
  amount: number
  recipient: string
  zkProof: string
}

/** Result of evaluating a single AEGIS defense layer */
export interface DefenseLayerStatus {
  layer: string   // "L1" | "L2" | "L3" | "L4" | "L5"
  passed: boolean
  detail: string
}

/** A single phase in the 7-step attack simulation sequence */
export interface SimulationPhase {
  offsetMs: number              // delay from T+0 in milliseconds
  text: string                  // the terminal log line
  type: 'attacker' | 'aegis'   // controls text color in terminal
}

/** Return type of dispatchShards */
export interface ShardResult {
  success: boolean
  detail?: string
}

// ---------------------------------------------------------------------------
// Static simulation data — defined here so it's tree-shaken from the main
// bundle and only loaded when SimulationTerminal is rendered.
// ---------------------------------------------------------------------------

export const SIMULATION_PHASES: SimulationPhase[] = [
  {
    offsetMs: 0,
    type: 'attacker',
    text: "ATTACKER: Scanning target origin... found session cookie SameSite=None",
  },
  {
    offsetMs: 400,
    type: 'attacker',
    text: "ATTACKER: Forging POST /api/transfer { amount: 99999, recipient: 'attacker_wallet' }",
  },
  {
    offsetMs: 800,
    type: 'attacker',
    text: "ATTACKER: Injecting via hidden <iframe> cross-origin...",
  },
  {
    offsetMs: 1200,
    type: 'aegis',
    text: "AEGIS L1: navigator.userActivation.isActive = false → BLOCKED",
  },
  {
    offsetMs: 1400,
    type: 'aegis',
    text: "AEGIS L3: ZK-Proof = NULL_TRAJECTORY → No entropy signature",
  },
  {
    offsetMs: 1600,
    type: 'aegis',
    text: "AEGIS L4: WebRTC Shard B missing → Asymmetric transport failure",
  },
  {
    offsetMs: 1800,
    type: 'aegis',
    text: "AEGIS: THREAT NEUTRALIZED — Attack vector destroyed 🛑",
  },
]
