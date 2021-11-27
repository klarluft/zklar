import { getPoseidon } from "./get-poseidon";
import { generateAccount } from "./account";
import { generateCommitment } from "./commitment";
import { getCommitmentNullifier } from "./commitment";
import { numToZok } from "./utils/num-to-zok";

export async function getVerifyTransactionInput() {
  const poseidon = await getPoseidon();

  const person1 = generateAccount(poseidon, [10, 8]);
  const person2 = generateAccount(poseidon, [2, 18]);

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

  const commitment3 = generateCommitment({
    poseidon,
    nonce: BigInt(3),
    amount: 13,
    owner_digest: person2.account_digest,
  });

  const commitment4 = generateCommitment({
    poseidon,
    nonce: BigInt(4),
    amount: 60 - 13,
    owner_digest: person1.account_digest,
  });

  const commitment1Nullifier = getCommitmentNullifier({
    poseidon,
    commitment: commitment1,
    ownerDigestPreimage: [person1.account_digest_preimage_0, person1.account_digest_preimage_1],
  });

  const commitment2Nullifier = getCommitmentNullifier({
    poseidon,
    commitment: commitment2,
    ownerDigestPreimage: [person1.account_digest_preimage_0, person1.account_digest_preimage_1],
  });

  const rootDigest = poseidon([commitment1.commitment_digest, commitment2.commitment_digest]);

  const transactionParams = {
    rootDigest: numToZok(rootDigest),

    commitment0Nullifier: numToZok(commitment1Nullifier),
    commitment0Digest: numToZok(commitment1.commitment_digest),
    commitment0Nonce: numToZok(commitment1.nonce),
    commitment0Amount: numToZok(commitment1.amount),
    commitment0OwnerDigest: numToZok(commitment1.owner_digest),
    commitment0OwnerDigestPreimage: [
      numToZok(person1.account_digest_preimage_0),
      numToZok(person1.account_digest_preimage_1),
    ],
    commitment0Index: numToZok(0),
    commitment0Siblings: [numToZok(commitment2.commitment_digest), ...[...new Array(256 - 1)].fill(numToZok(0))],

    commitment1Nullifier: numToZok(commitment2Nullifier),
    commitment1Digest: numToZok(commitment2.commitment_digest),
    commitment1Nonce: numToZok(commitment2.nonce),
    commitment1Amount: numToZok(commitment2.amount),
    commitment1OwnerDigest: numToZok(commitment2.owner_digest),
    commitment1OwnerDigestPreimage: [
      numToZok(person1.account_digest_preimage_0),
      numToZok(person1.account_digest_preimage_1),
    ],
    commitment1Index: numToZok(1),
    commitment1Siblings: [numToZok(commitment1.commitment_digest), ...[...new Array(256 - 1)].fill(numToZok(0))],

    newCommitment0Digest: numToZok(commitment3.commitment_digest),
    newCommitment0Nonce: numToZok(commitment3.nonce),
    newCommitment0Amount: numToZok(commitment3.amount),
    newCommitment0OwnerDigest: numToZok(commitment3.owner_digest),

    newCommitment1Digest: numToZok(commitment4.commitment_digest),
    newCommitment1Nonce: numToZok(commitment4.nonce),
    newCommitment1Amount: numToZok(commitment4.amount),
    newCommitment1OwnerDigest: numToZok(commitment4.owner_digest),
  };

  console.log(JSON.stringify(transactionParams, null, 2));
}

getVerifyTransactionInput();
