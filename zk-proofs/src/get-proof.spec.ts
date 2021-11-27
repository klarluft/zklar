import { getLevels } from "./get-levels";
import { getPoseidon, Poseidon } from "./get-poseidon";
import { getProof, ProofStep } from "./get-proof";

describe("get-proof", () => {
  let poseidon: Poseidon;

  beforeAll(async () => {
    poseidon = await getPoseidon();
  });

  it("works for first leaf", () => {
    const nrOfDigestsPerDigest = 3;
    const leafs = [...new Array(nrOfDigestsPerDigest * nrOfDigestsPerDigest)].map((_, index) => poseidon([index]));
    const levels = getLevels(poseidon, leafs, nrOfDigestsPerDigest);
    const leafDigest = leafs[0];
    const proof = getProof(leafDigest, levels, nrOfDigestsPerDigest);
    const expectedProof: ProofStep[] = [
      { indexPosition: 0, digests: [levels[0][0], levels[0][1], levels[0][2]] },
      { indexPosition: 0, digests: [levels[1][0], levels[1][1], levels[1][2]] },
    ];
    expect(proof).toHaveLength(2);
    expect(proof).toEqual(expectedProof);
  });

  it("works for last leaf", () => {
    const nrOfDigestsPerDigest = 3;
    const leafs = [...new Array(nrOfDigestsPerDigest * nrOfDigestsPerDigest)].map((_, index) => poseidon([index]));
    const levels = getLevels(poseidon, leafs, nrOfDigestsPerDigest);
    const leafDigest = leafs[8];
    const proof = getProof(leafDigest, levels, nrOfDigestsPerDigest);
    const expectedProof: ProofStep[] = [
      { indexPosition: 2, digests: [levels[0][6], levels[0][7], levels[0][8]] },
      { indexPosition: 2, digests: [levels[1][0], levels[1][1], levels[1][2]] },
    ];
    expect(proof).toHaveLength(2);
    expect(proof).toEqual(expectedProof);
  });
});
