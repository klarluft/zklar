import { Query, Resolver } from 'type-graphql';
import { getMongoRepository } from 'typeorm';

import { Commitment } from '../entities/Commitment';

@Resolver()
export class CommitmentResolver {
  @Query(() => [Commitment])
  async getCommitments(): Promise<Commitment[]> {
    const commitmentRepository = getMongoRepository(Commitment);

    const commitments = await commitmentRepository.find({
      where: {
        rootDigest: { $exists: true },
        commitmentIndex: { $exists: true },
      },
      order: { commitmentIndex: -1 },
    });

    return commitments;
  }
}
