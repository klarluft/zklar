export interface ProofStep {
  indexPosition: number;
  digests: BigInt[];
}

export function getProof(leaf: BigInt, levels: BigInt[][], nrOfDigestsPerDigest: number): ProofStep[] {
  const proof: ProofStep[] = [];
  let leafIndex = levels[0].findIndex((digest) => digest === leaf);

  for (let levelIndex = 0; levelIndex < levels.length - 1; levelIndex++) {
    const level = levels[levelIndex];

    const leafIndexInGroup = leafIndex % nrOfDigestsPerDigest;
    const groupStartIndex = leafIndex - leafIndexInGroup;
    const leafsInGroup = [...new Array(nrOfDigestsPerDigest)].map(
      (_, leafIndexInGroup) => level[groupStartIndex + leafIndexInGroup]
    );

    proof.push({ indexPosition: leafIndexInGroup, digests: leafsInGroup });
    leafIndex = Math.floor(leafIndex / nrOfDigestsPerDigest);
  }

  return proof;
}
