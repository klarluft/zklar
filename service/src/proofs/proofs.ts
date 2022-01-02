import { VerificationKey } from 'zk-proofs/build/snarkjs';

import verifyDepositVerificationKeyJSON from './verify-deposit-verification-key.json';
import verifyNewRootDigestVerificationKeyJSON from './verify-new-root-digest-verification-key.json';
import verifyTransactionVerificationKeyJSON from './verify-transaction-verification-key.json';

export const verifyDepositVerificationKey =
  verifyDepositVerificationKeyJSON as VerificationKey<'groth16', 'bn128'>;

export const verifyNewRootDigestVerificationKey =
  verifyNewRootDigestVerificationKeyJSON as VerificationKey<'groth16', 'bn128'>;

export const verifyTransactionVerificationKey =
  verifyTransactionVerificationKeyJSON as VerificationKey<'groth16', 'bn128'>;
