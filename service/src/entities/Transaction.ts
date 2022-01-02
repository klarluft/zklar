import { ObjectId } from 'mongodb';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ObjectIdColumn } from 'typeorm';

import { Proof } from './Proof';

@Entity()
@ObjectType()
export class Transaction extends BaseEntity {
  @Field(() => ID)
  @ObjectIdColumn()
  id: ObjectId;

  @Field(() => Proof)
  @Column(() => Proof)
  proof: Proof;

  @Field()
  @Column()
  rootDigest: string;

  @Field()
  @Column()
  commitment0Nullifier: string;

  @Field()
  @Column()
  newCommitment0Digest: string;

  @Field()
  @Column()
  commitment1Nullifier: string;

  @Field()
  @Column()
  newCommitment1Digest: string;
}
