import { Poseidon } from "../get-poseidon";
import { hexToBigInt } from "../utils/hex-to-big-int";

export interface Account {
  account_digest_preimage_0: bigint;
  account_digest_preimage_1: bigint;
  account_digest: bigint;
}

export function generateAccount(poseidon: Poseidon, seed: [number, number]): Account {
  const account_digest_preimage_0 = hexToBigInt(seed[0].toString(16));
  const account_digest_preimage_1 = hexToBigInt(seed[1].toString(16));
  const account_digest = poseidon([account_digest_preimage_0, account_digest_preimage_1]);

  return { account_digest_preimage_0, account_digest_preimage_1, account_digest };
}
