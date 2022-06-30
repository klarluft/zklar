import { getMongoRepository } from 'typeorm';

import { Commitment } from '../entities/Commitment';
import { Nullifier } from '../entities/Nullifier';
import { Proof } from '../entities/Proof';
import { Transaction } from '../entities/Transaction';

import { SendTransactionInput } from './TransactionResolver.inputs';

interface SaveNullifiersAndTransactionProps {
  input: SendTransactionInput;
}

interface SaveNullifiersAndTransactionReturn {
  nullifier0: Nullifier;
  nullifier1: Nullifier;
  transaction: Transaction;
  rollbackSaveNullifiersAndTransaction: () => Promise<void>;
}

export async function saveNullifiersAndTransaction({
  input,
}: SaveNullifiersAndTransactionProps): Promise<SaveNullifiersAndTransactionReturn> {
  const nullifierRepository = getMongoRepository(Nullifier);
  const transactionRepository = getMongoRepository(Transaction);

  const saveNullifier = async (nullifierString: string) => {
    const nullifier = nullifierRepository.create();
    nullifier.nullifier = nullifierString;
    return await nullifier.save();
  };

  const deleteNullifier = async (nullifier: Nullifier) => {
    await nullifierRepository.delete({ id: nullifier.id });
  };

  const saveTransaction = async () => {
    const transaction = transactionRepository.create();
    transaction.proof = new Proof();
    transaction.proof.a0 = input.proof.a0;
    transaction.proof.a1 = input.proof.a1;
    transaction.proof.b00 = input.proof.b00;
    transaction.proof.b01 = input.proof.b01;
    transaction.proof.b10 = input.proof.b10;
    transaction.proof.b11 = input.proof.b11;
    transaction.proof.c0 = input.proof.c0;
    transaction.proof.c1 = input.proof.c1;
    transaction.rootDigest = input.rootDigest;
    transaction.commitment0Nullifier = input.commitment0Nullifier;
    transaction.newCommitment0Digest = input.newCommitment0Digest;
    transaction.commitment1Nullifier = input.commitment1Nullifier;
    transaction.newCommitment1Digest = input.newCommitment1Digest;
    transaction.createdAt = +new Date();

    return await transaction.save();
  };

  const deleteTransaction = async (transaction: Transaction) => {
    await transactionRepository.delete({ id: transaction.id });
  };

  // Run all at once
  const [saveNullifier0Result, saveNullifier1Result, saveTransactionResult] =
    await Promise.allSettled([
      saveNullifier(input.commitment0Nullifier),
      saveNullifier(input.commitment1Nullifier),
      saveTransaction(),
    ]);

  // try to roll back if something goes wrong
  if (
    saveNullifier0Result.status === 'rejected' ||
    saveNullifier1Result.status === 'rejected' ||
    saveTransactionResult.status === 'rejected'
  ) {
    if (saveNullifier0Result.status === 'rejected') {
      console.error('TRANSACTION ERROR', {
        details: 'saveNullifiersAndTransaction saveNullifier0Result failed',
        reason: saveNullifier0Result.reason,
      });
    }

    if (saveNullifier1Result.status === 'rejected') {
      console.error('TRANSACTION ERROR', {
        details: 'saveNullifiersAndTransaction saveNullifier1Result failed',
        reason: saveNullifier1Result.reason,
      });
    }

    if (saveTransactionResult.status === 'rejected') {
      console.error('TRANSACTION ERROR', {
        details: 'saveNullifiersAndTransaction saveTransactionResult failed',
        reason: saveTransactionResult.reason,
      });
    }

    // run rollbacks at once and report if something goes wrong
    const [
      saveNullifier0RollbackResult,
      saveNullifier1RollbackResult,
      saveTransactionRollbackResult,
    ] = await Promise.allSettled([
      ...(saveNullifier0Result.status === 'fulfilled'
        ? [deleteNullifier(saveNullifier0Result.value)]
        : [undefined]),
      ...(saveNullifier1Result.status === 'fulfilled'
        ? [deleteNullifier(saveNullifier1Result.value)]
        : [undefined]),
      ...(saveTransactionResult.status === 'fulfilled'
        ? [deleteTransaction(saveTransactionResult.value)]
        : [undefined]),
    ]);

    if (saveNullifier0RollbackResult.status === 'rejected') {
      console.error('TRANSACTION ROLLBACK ERROR', {
        details: 'saveNullifiersAndTransaction saveNullifier0Rollback failed',
        reason: saveNullifier0RollbackResult.reason,
      });
    }

    if (saveNullifier1RollbackResult.status === 'rejected') {
      console.error('TRANSACTION ROLLBACK ERROR', {
        details: 'saveNullifiersAndTransaction saveNullifier1Rollback failed',
        reason: saveNullifier1RollbackResult.reason,
      });
    }

    if (saveTransactionRollbackResult.status === 'rejected') {
      console.error('TRANSACTION ROLLBACK ERROR', {
        details: 'saveNullifiersAndTransaction saveTransactionRollback failed',
        reason: saveTransactionRollbackResult.reason,
      });
    }

    throw new Error('');
  }

  const nullifier0 = saveNullifier0Result.value;
  const nullifier1 = saveNullifier1Result.value;
  const transaction = saveTransactionResult.value;

  const rollbackSaveNullifiersAndTransaction = async () => {
    const [
      deleteNullifier0Result,
      deleteNullifier1Result,
      deleteTransactionResult,
    ] = await Promise.allSettled([
      deleteNullifier(nullifier0),
      deleteNullifier(nullifier1),
      deleteTransaction(transaction),
    ]);

    if (deleteNullifier0Result.status === 'rejected') {
      console.error('TRANSACTION ROLLBACK ERROR', {
        details: 'saveNullifiersAndTransaction deleteNullifier0Result failed',
        reason: deleteNullifier0Result.reason,
      });
    }

    if (deleteNullifier1Result.status === 'rejected') {
      console.error('TRANSACTION ROLLBACK ERROR', {
        details: 'saveNullifiersAndTransaction deleteNullifier1Result failed',
        reason: deleteNullifier1Result.reason,
      });
    }

    if (deleteTransactionResult.status === 'rejected') {
      console.error('TRANSACTION ROLLBACK ERROR', {
        details: 'saveNullifiersAndTransaction deleteTransactionResult failed',
        reason: deleteTransactionResult.reason,
      });
    }
  };

  return {
    nullifier0,
    nullifier1,
    transaction,
    rollbackSaveNullifiersAndTransaction,
  };
}

interface SaveCommitmentsProps {
  input: SendTransactionInput;
  transaction: Transaction;
  rollbackSaveNullifiersAndTransaction: () => Promise<void>;
}

interface SaveCommitmentsReturn {
  commitmentDigest0: Commitment;
  commitmentDigest1: Commitment;
}

export async function saveCommitments({
  input,
  transaction,
  rollbackSaveNullifiersAndTransaction,
}: SaveCommitmentsProps): Promise<SaveCommitmentsReturn> {
  const commitmentDigestRepository = getMongoRepository(Commitment);

  const saveCommitment = async (commitmentDigestString: string) => {
    const commitmentDigest = commitmentDigestRepository.create();
    commitmentDigest.transactionId = transaction.id;
    commitmentDigest.commitmentDigest = commitmentDigestString;
    commitmentDigest.createdAt = +new Date();
    return await commitmentDigest.save();
  };

  const deleteCommitment = async (commitmentDigest: Commitment) => {
    await commitmentDigestRepository.delete({ id: commitmentDigest.id });
  };

  // Run all at once
  const [saveCommitment0Result, saveCommitment1Result] =
    await Promise.allSettled([
      saveCommitment(input.newCommitment0Digest),
      saveCommitment(input.newCommitment1Digest),
    ]);

  // try to roll back if something goes wrong
  if (
    saveCommitment0Result.status === 'rejected' ||
    saveCommitment1Result.status === 'rejected'
  ) {
    if (saveCommitment0Result.status === 'rejected') {
      console.error('TRANSACTION ERROR', {
        details: 'sendTransaction saveCommitment0Result failed',
        reason: saveCommitment0Result.reason,
      });
    }

    if (saveCommitment1Result.status === 'rejected') {
      console.error('TRANSACTION ERROR', {
        details: 'sendTransaction saveCommitment1Result failed',
        reason: saveCommitment1Result.reason,
      });
    }

    // run rollbacks at once and report if something goes wrong
    const [saveCommitment0RollbackResult, saveCommitment1RollbackResult] =
      await Promise.allSettled([
        saveCommitment0Result.status === 'fulfilled'
          ? deleteCommitment(saveCommitment0Result.value)
          : undefined,
        saveCommitment1Result.status === 'fulfilled'
          ? deleteCommitment(saveCommitment1Result.value)
          : undefined,
        rollbackSaveNullifiersAndTransaction(),
      ]);

    if (saveCommitment0RollbackResult.status === 'rejected') {
      console.error('TRANSACTION ROLLBACK ERROR', {
        details: 'sendTransaction saveCommitment0RollbackResult failed',
        reason: saveCommitment0RollbackResult.reason,
      });
    }

    if (saveCommitment1RollbackResult.status === 'rejected') {
      console.error('TRANSACTION ROLLBACK ERROR', {
        details: 'sendTransaction saveCommitment1RollbackResult failed',
        reason: saveCommitment1RollbackResult.reason,
      });
    }

    throw new Error('');
  }

  const commitmentDigest0 = saveCommitment0Result.value;
  const commitmentDigest1 = saveCommitment1Result.value;

  return { commitmentDigest0, commitmentDigest1 };
}
