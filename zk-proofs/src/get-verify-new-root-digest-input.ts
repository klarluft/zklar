import { getPoseidon } from "./get-poseidon";
import { generateAccount } from "./account";
import { generateCommitment } from "./commitment";
import { numToZok } from "./utils/num-to-zok";

export async function getVerifyNewRootDigestInput() {
  const poseidon = await getPoseidon();

  const person1 = generateAccount(poseidon, [10, 8]);

  const commitment1 = generateCommitment({
    poseidon,
    nonce: BigInt(1),
    amount: 50,
    owner_digest: person1.account_digest,
  });

  const commitment2 = generateCommitment({
    poseidon,
    nonce: BigInt(2),
    amount: 10,
    owner_digest: person1.account_digest,
  });

  const oldRootDigest = commitment1.commitment_digest;
  const newRootDigest = poseidon([commitment1.commitment_digest, commitment2.commitment_digest]);

  const newRootDigestParams = {
    oldRootDigest: numToZok(oldRootDigest),
    oldCommitmentDigest: numToZok(0),
    newRootDigest: numToZok(newRootDigest),
    newCommitmentDigest: numToZok(commitment2.commitment_digest),
    commitmentIndex: numToZok(1),
    siblings: [numToZok(commitment1.commitment_digest), ...[...new Array(256 - 1)].fill(numToZok(0))],
  };

  console.log(JSON.stringify(newRootDigestParams, null, 2));
}

getVerifyNewRootDigestInput();
