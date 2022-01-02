import { Field, ObjectType } from 'type-graphql';
import { Column } from 'typeorm';

@ObjectType()
export class Proof {
  @Field()
  @Column()
  a0: string;

  @Field()
  @Column()
  a1: string;

  @Field()
  @Column()
  b00: string;

  @Field()
  @Column()
  b01: string;

  @Field()
  @Column()
  b10: string;

  @Field()
  @Column()
  b11: string;

  @Field()
  @Column()
  c0: string;

  @Field()
  @Column()
  c1: string;
}
