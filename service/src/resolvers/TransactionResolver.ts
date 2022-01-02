import { Arg, Mutation, Query, Resolver } from 'type-graphql';
import { getMongoManager, getMongoRepository } from 'typeorm';

import { CommitmentDigest } from '../entities/CommitmentDigest';
import { Nullifier } from '../entities/Nullifier';
import { Proof } from '../entities/Proof';
import { Transaction } from '../entities/Transaction';
import { verifyTransactionProof } from '../lib/verifyTransactionProof';

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

    // Run all operations in a DB transaction
    return await getMongoManager().transaction(async (entityManager) => {
      const nullifierRepository = entityManager.getMongoRepository(Nullifier);
      const transactionRepository = getMongoRepository(Transaction);
      const commitmentDigestRepository = getMongoRepository(CommitmentDigest);

      // Save nullifier 0
      const nullifier0 = nullifierRepository.create();
      nullifier0.nullifier = input.commitment0Nullifier;
      await nullifier0.save();

      // Save nullifier 1
      const nullifier1 = nullifierRepository.create();
      nullifier1.nullifier = input.commitment1Nullifier;
      await nullifier1.save();

      // Save transaction
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

      // save transaction
      const newTransaction = await transaction.save();

      const commitmentDigest0 = commitmentDigestRepository.create();
      commitmentDigest0.transactionId = newTransaction.id;
      commitmentDigest0.commitmentDigest = input.newCommitment0Digest;
      commitmentDigest0.commitmentIndex = 0; // ?

      // return newly created transaction
      return newTransaction;
    });
  }
}
