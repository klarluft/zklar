import { Poseidon } from "./get-poseidon";

export function getLevels(poseidon: Poseidon, leafs: bigint[], nrOfDigestsPerDigest: number): bigint[][] {
  const digests = leafs;
  const levels = [digests];
  let currentLevel = 0;
  let rootDigestReached = false;

  while (rootDigestReached === false) {
    const groupedLeafs = levels[currentLevel].reduce<bigint[][]>((sum, n, index) => {
      const groupIndex = Math.floor(index / nrOfDigestsPerDigest);
      const group = sum[groupIndex] ?? [];
      sum[groupIndex] = [...group, n];
      return sum;
    }, []);

    const newDigests = groupedLeafs.map((group) => poseidon(group));
    rootDigestReached = newDigests.length === 1;
    currentLevel++;

    if (!rootDigestReached) {
      const paddedDigests = newDigests;
      levels.push(paddedDigests);
    } else {
      levels.push(newDigests);
    }
  }

  return levels;
}
