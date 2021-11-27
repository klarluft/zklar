import { Account } from "../account";
import { Poseidon } from "../get-poseidon";

interface GenerateCommitmentProps {
  poseidon: Poseidon;
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
  const commitment_digest = poseidon([nonce, amount, owner_digest]);

  return {
    nonce,
    amount,
    owner_digest,
    commitment_digest,
  };
}

interface GetCommitmentNullifierProps {
  poseidon: Poseidon;
  commitment: Commitment;
  ownerDigestPreimage: [Account["account_digest_preimage_0"], Account["account_digest_preimage_1"]];
}

export function getCommitmentNullifier({ poseidon, commitment, ownerDigestPreimage }: GetCommitmentNullifierProps) {
  return poseidon([commitment.commitment_digest, ...ownerDigestPreimage]);
}
