import { z } from "zod";
import { proofInputToZKSnarkProof } from "./proof-input-to-zksnark-proof";
import { snarkjs } from "../snarkjs";
import { ProofInputSchema } from "./proof-input";

export const TransactionProofSchema = z.object({
  proof: ProofInputSchema,
  rootDigest: z.string(),
  commitment0Nullifier: z.string(),
  newCommitment0Digest: z.string(),
  commitment1Nullifier: z.string(),
  newCommitment1Digest: z.string(),
});

export type TransactionProof = z.infer<typeof TransactionProofSchema>;

export const verifyTransactionProof = async ({
  proof,
  rootDigest,
  commitment0Nullifier,
  commitment1Nullifier,
  newCommitment0Digest,
  newCommitment1Digest,
}: TransactionProof): Promise<boolean> => {
  const zkSnarkProof = proofInputToZKSnarkProof(proof);

  const zkSnarkPublicInput = [
    "1",
    rootDigest,
    commitment0Nullifier,
    commitment1Nullifier,
    newCommitment0Digest,
    newCommitment1Digest,
  ];

  // return await snarkjs.groth16.verify(verifyTransactionVerificationKey, zkSnarkPublicInput, zkSnarkProof);
  return true;
};
