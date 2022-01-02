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

export interface VerificationKey<Protocol extends Protocols, Curve extends Curves> {
  protocol: Protocol;
  curve: Curve;
  nPublic: number;
  vk_alpha_1: [string, string, string];
  vk_beta_2: [[string, string], [string, string], [string, string]];
  vk_gamma_2: [[string, string], [string, string], [string, string]];
  vk_delta_2: [[string, string], [string, string], [string, string]];
  vk_alphabeta_12: [
    [[string, string], [string, string], [string, string]],
    [[string, string], [string, string], [string, string]]
  ];
  IC: [string, string, string][];
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

  verify: (
    vKey: VerificationKey<"groth16", "bn128">,
    publicSignals: PublicSignals,
    proof: Proof<"groth16", "bn128">
  ) => Promise<boolean>;
}

export interface SnarkJS {
  groth16: Groth16;
}

export const snarkjs = require("snarkjs") as SnarkJS;
