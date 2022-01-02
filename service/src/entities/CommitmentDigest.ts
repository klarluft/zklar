import { ObjectId } from 'mongodb';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity()
@ObjectType()
export class CommitmentDigest extends BaseEntity {
  @Field(() => ID)
  @ObjectIdColumn()
  id: ObjectId;

  @Field()
  @Index({ unique: true })
  @Column()
  commitmentIndex: number;

  @Field()
  @Index({ unique: true })
  @Column()
  rootDigest: string;

  @Field()
  @Index({ unique: true })
  @Column()
  commitmentDigest: string;

  @Field(() => ID)
  @Index({ unique: false })
  @Column()
  transactionId: ObjectId;
}
