import { Arg, Mutation, Query, Resolver } from 'type-graphql';
import { getMongoRepository } from 'typeorm';

import { Commitment } from '../entities/Commitment';
import { Nullifier } from '../entities/Nullifier';
import { Transaction } from '../entities/Transaction';
import { verifyTransactionProof } from '../lib/verifyTransactionProof';

import {
  saveCommitments,
  saveNullifiersAndTransaction,
} from './TransactionResolver.helpers';
import { SendTransactionInput } from './TransactionResolver.inputs';

@Resolver()
export class TransactionResolver {
  @Query(() => [Transaction])
  async getTransactions(): Promise<Transaction[]> {
    const transactionRepository = getMongoRepository(Transaction);
    return await transactionRepository.find();
  }

  @Mutation(() => Transaction)
  async sendTransaction(
    @Arg('input')
    input: SendTransactionInput
  ): Promise<Transaction> {
    // Check if proof is valid
    const isVerified = await verifyTransactionProof(input);
    if (!isVerified) throw new Error('Invalid proof');

    const nullifierRepository = getMongoRepository(Nullifier);
    const commitmentRepository = getMongoRepository(Commitment);

    // Check if nullifier 0 does not already exists
    const commitment0Nullifier = await nullifierRepository.findOne({
      nullifier: input.commitment0Nullifier,
    });
    if (commitment0Nullifier) throw new Error('Nullifier 0 already exists');

    // Check if nullifier 1 does not already exists
    const commitment1Nullifier = await nullifierRepository.findOne({
      nullifier: input.commitment1Nullifier,
    });
    if (commitment1Nullifier) throw new Error('Nullifier 1 already exists');

    // Check if root digest exists
    const rootDigestCommitment = commitmentRepository.findOne({
      where: { rootDigest: input.rootDigest },
    });

    if (!rootDigestCommitment) throw new Error('No such root digest!');

    try {
      const { transaction, rollbackSaveNullifiersAndTransaction } =
        await saveNullifiersAndTransaction({
          input,
        });

      await saveCommitments({
        transaction,
        input,
        rollbackSaveNullifiersAndTransaction,
      });

      return transaction;
    } catch (error) {
      console.error('UNKNOWN ERROR', {
        details: 'sendTransaction unknown error',
      });
      throw new Error('');
    }
  }
}
