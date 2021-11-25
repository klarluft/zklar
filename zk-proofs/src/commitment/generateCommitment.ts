import { PoseidonFunction } from "circomlibjs";
import { Account } from "../account";

interface GenerateCommitmentProps {
  poseidon: PoseidonFunction;
  nonce: bigint;
  amount: number;
  owner_digest: Account["account_digest"];
}

export interface Commitment {
  nonce: bigint;
  amount: number;
  owner_digest: Account["account_digest"];
  commitment_digest: bigint;
}

export function generateCommitment({ poseidon, nonce, amount, owner_digest }: GenerateCommitmentProps): Commitment {
  const commitment_digest = poseidon.F.toObject(poseidon([nonce, amount, owner_digest]));

  return {
    nonce,
    amount,
    owner_digest,
    commitment_digest,
  };
}
