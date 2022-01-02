import { Field, InputType } from 'type-graphql';

import { Proof } from '../entities/Proof';
import { Transaction } from '../entities/Transaction';

@InputType()
export class ProofInput implements Partial<Proof> {
  @Field()
  a0: string;

  @Field()
  a1: string;

  @Field()
  b00: string;

  @Field()
  b01: string;

  @Field()
  b10: string;

  @Field()
  b11: string;

  @Field()
  c0: string;

  @Field()
  c1: string;
}

@InputType()
export class SendTransactionInput implements Partial<Transaction> {
  @Field(() => ProofInput)
  proof: ProofInput;

  @Field()
  rootDigest: string;

  @Field()
  commitment0Nullifier: string;

  @Field()
  newCommitment0Digest: string;

  @Field()
  commitment1Nullifier: string;

  @Field()
  newCommitment1Digest: string;
}
