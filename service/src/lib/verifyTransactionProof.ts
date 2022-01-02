import { snarkjs } from 'zk-proofs';

import { verifyTransactionVerificationKey } from '../proofs';
import { SendTransactionInput } from '../resolvers/TransactionResolver.inputs';

import { inputProofToZKSnarkProof } from './inputProofToZKSnarkProof';

export const verifyTransactionProof = async ({
  proof,
  rootDigest,
  commitment0Nullifier,
  commitment1Nullifier,
  newCommitment0Digest,
  newCommitment1Digest,
}: SendTransactionInput): Promise<boolean> => {
  const zkSnarkProof = inputProofToZKSnarkProof(proof);

  const zkSnarkPublicInput = [
    '1',
    rootDigest,
    commitment0Nullifier,
    commitment1Nullifier,
    newCommitment0Digest,
    newCommitment1Digest,
  ];

  return await snarkjs.groth16.verify(
    verifyTransactionVerificationKey,
    zkSnarkPublicInput,
    zkSnarkProof
  );
};
