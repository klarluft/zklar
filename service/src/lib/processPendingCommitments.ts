import { getMongoRepository } from 'typeorm';

import { MERKLE_TREE_NR_OF_LEVELS } from '../configuration';
import { Commitment } from '../entities/Commitment';
import { MerkleTreeDigest } from '../entities/MerkleTreeDigest';

import { poseidon } from './poseidon';

export async function processPendingCommitments() {
  const commitmentRepository = getMongoRepository(Commitment);
  const merkleTreeDigestRepository = getMongoRepository(MerkleTreeDigest);

  // put commitments in order and calculate merkle tree digests for each commitment
  const pendingCommitments = await commitmentRepository.find({
    where: {
      rootDigest: { $exists: false },
      commitmentIndex: { $exists: false },
    },
  });

  for (const commitment of pendingCommitments) {
    const previousCommitment = await commitmentRepository.findOne({
      where: {
        rootDigest: { $exists: true },
        commitmentIndex: { $exists: true },
      },
      order: { commitmentIndex: -1 },
    });

    const previousCommitmentIndex = previousCommitment?.commitmentIndex ?? -1;

    const commitmentIndex = previousCommitmentIndex + 1;

    let previousMerkleTreeDigestIndex = commitmentIndex;
    let previousMerkleTreeDigestDigest = commitment.commitmentDigest;

    for (let level = 0; level < MERKLE_TREE_NR_OF_LEVELS; level++) {
      const previousIsLeft = previousMerkleTreeDigestIndex % 2 === 0;
      const previousIsRight = !previousIsLeft;
      const previousLeftLeafIndex = previousIsLeft
        ? previousMerkleTreeDigestIndex
        : previousMerkleTreeDigestIndex - 1;

      const merkleTreeDigestIndex = previousLeftLeafIndex / 2;
      let merkleTreeDigestDigest: string;

      if (previousIsRight) {
        if (level === 0) {
          const previousLeftCommitment = await commitmentRepository.findOne({
            where: {
              commitmentIndex: { $eq: previousLeftLeafIndex },
            },
          });

          if (!previousLeftCommitment)
            throw new Error('Previous left commitment does not exist!');

          if (!previousMerkleTreeDigestDigest)
            throw new Error('Previous commitment digest does not exist!');

          merkleTreeDigestDigest = poseidon([
            BigInt(previousLeftCommitment.commitmentDigest),
            BigInt(previousMerkleTreeDigestDigest),
          ]).toString();
        } else {
          const previousLeftDigest = await merkleTreeDigestRepository.findOne({
            where: { index: previousLeftLeafIndex, level: level - 1 },
          });

          if (!previousLeftDigest)
            throw new Error('Previous left merkle tree digest does not exist!');

          if (!previousMerkleTreeDigestDigest)
            throw new Error('Previous merkle tree digest does not exist!');

          merkleTreeDigestDigest = poseidon([
            BigInt(previousLeftDigest.digest),
            BigInt(previousMerkleTreeDigestDigest),
          ]).toString();
        }

        // Save calculated merkle tree digest
        let merkleTreeDigest = await merkleTreeDigestRepository.findOne({
          where: { level, index: merkleTreeDigestIndex },
        });

        if (!merkleTreeDigest) {
          merkleTreeDigest = merkleTreeDigestRepository.create();
          merkleTreeDigest.level = level;
          merkleTreeDigest.index = merkleTreeDigestIndex;
        }

        merkleTreeDigest.digest = merkleTreeDigestDigest;
        await merkleTreeDigest.save();
      } else {
        merkleTreeDigestDigest = commitment.commitmentDigest;
      }

      previousMerkleTreeDigestIndex = merkleTreeDigestIndex;
      previousMerkleTreeDigestDigest = merkleTreeDigestDigest;
    }

    const rootDigest = previousMerkleTreeDigestDigest;

    if (!rootDigest) throw new Error('Root digest undefined!');

    commitment.commitmentIndex = commitmentIndex;
    commitment.rootDigest = rootDigest;
    commitment.processedAt = +new Date();
    await commitment.save();
  }
}
