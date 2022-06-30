import { Field, ID, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  Entity,
  Index,
  ObjectID,
  ObjectIdColumn,
} from 'typeorm';

@Entity()
@Index(['level', 'index'], { unique: true })
@ObjectType()
export class MerkleTreeDigest extends BaseEntity {
  @Field(() => ID)
  @ObjectIdColumn()
  id: ObjectID;

  @Field()
  @Column()
  level: number;

  @Field()
  @Column()
  index: number;

  @Field()
  @Column()
  digest: string;
}
