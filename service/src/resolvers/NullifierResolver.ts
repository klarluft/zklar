import { Query, Resolver } from 'type-graphql';
import { getMongoRepository } from 'typeorm';

import { Nullifier } from '../entities/Nullifier';

@Resolver()
export class NullifierResolver {
  @Query(() => [Nullifier])
  async getNullifiers(): Promise<Nullifier[]> {
    const nullifierRepository = getMongoRepository(Nullifier);
    return await nullifierRepository.find();
  }
}
