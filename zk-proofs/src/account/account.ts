import poseidon from "circomlib/src/poseidon";
import { hexToBigInt } from "../utils/hex-to-big-int";

export interface Account {
  account_digest_preimage_0: BigInt;
  account_digest_preimage_1: BigInt;
  account_digest: BigInt;
}

export function generateAccount(seed: [number, number]): Account {
  const account_digest_preimage_0 = hexToBigInt(seed[0].toString(16));
  const account_digest_preimage_1 = hexToBigInt(seed[1].toString(16));
  const account_digest = poseidon([account_digest_preimage_0, account_digest_preimage_1]);

  return { account_digest_preimage_0, account_digest_preimage_1, account_digest };
}
