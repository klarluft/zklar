import { Proof as ZKSnarkProof } from 'zk-proofs';

import { ProofInput } from '../resolvers/TransactionResolver.inputs';

export const inputProofToZKSnarkProof = (
  inputProof: ProofInput
): ZKSnarkProof<'groth16', 'bn128'> => ({
  pi_a: [inputProof.a0, inputProof.a1, '1'],
  pi_b: [
    [inputProof.b00, inputProof.b01],
    [inputProof.b10, inputProof.b11],
    ['1', '0'],
  ],
  pi_c: [inputProof.c0, inputProof.c1, '1'],
  protocol: 'groth16',
  curve: 'bn128',
});
