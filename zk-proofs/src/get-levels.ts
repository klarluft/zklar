import { poseidon } from "circomlibjs";

export function getLevels(leafs: BigInt[], nrOfDigestsPerDigest: number): BigInt[][] {
  const digests = leafs;
  const levels = [digests];
  let currentLevel = 0;
  let rootDigestReached = false;

  while (rootDigestReached === false) {
    const groupedLeafs = levels[currentLevel].reduce<BigInt[][]>((sum, n, index) => {
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
