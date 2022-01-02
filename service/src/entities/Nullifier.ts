import { ObjectId } from 'mongodb';
import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity()
@ObjectType()
export class Nullifier extends BaseEntity {
  @Field(() => ID)
  @ObjectIdColumn()
  id: ObjectId;

  @Field()
  @Index({ unique: true })
  @Column()
  nullifier: string;
}
