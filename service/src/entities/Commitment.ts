import { ObjectId } from 'mongodb';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity()
@ObjectType()
export class Commitment extends BaseEntity {
  @Field(() => ID)
  @ObjectIdColumn()
  id: ObjectId;

  @Field({ nullable: true })
  @Index({ unique: true, sparse: true })
  @Column({ nullable: true })
  commitmentIndex: number;

  @Field({ nullable: true })
  @Index({ unique: true, sparse: true })
  @Column({ nullable: true })
  rootDigest: string;

  @Field()
  @Index({ unique: true })
  @Column()
  commitmentDigest: string;

  @Field(() => ID)
  @Index({ unique: false })
  @Column()
  transactionId: ObjectId;

  @Field()
  @Column()
  createdAt: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  processedAt: number;
}
