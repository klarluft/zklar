import poseidon from "circomlib/src/poseidon";
import { Account } from "../account";

interface GenerateCommitmentProps {
  nonce: BigInt;
  amount: number;
  owner_digest: Account["account_digest"];
}

export interface Commitment {
  nonce: BigInt;
  amount: number;
  owner_digest: Account["account_digest"];
  commitment_digest: BigInt;
}

export function generateCommitment({ nonce, amount, owner_digest }: GenerateCommitmentProps): Commitment {
  const commitment_digest = poseidon([nonce, amount, owner_digest]);

  return {
    nonce,
    amount,
    owner_digest,
    commitment_digest,
  };
}
