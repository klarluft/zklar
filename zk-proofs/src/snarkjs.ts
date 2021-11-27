export interface Logger {
  debug: (input: string) => void;
}

export type Protocols = "groth16";
export type Curves = "bn128";

export interface Proof<Protocol extends Protocols, Curve extends Curves> {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: Protocol;
  curve: Curve;
}

export type PublicSignals = string[];

export interface Groth16 {
  prove: (
    zkeyBuffer: Uint8Array,
    witnessBuffer: Uint8Array,
    logger?: Logger
  ) => Promise<{
    proof: Proof<"groth16", "bn128">;
    publicSignals: PublicSignals;
  }>;
}

export interface SnarkJS {
  groth16: Groth16;
}

export const snarkjs = require("snarkjs") as SnarkJS;
