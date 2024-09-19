import { getPoseidon, generateAccount, bigIntToHex, generateCommitment, getCommitmentNullifier } from "zk-proofs";

import { mongodbClient } from "./mongodb";
import { Trie } from "./trie";

export async function test() {
  const poseidon = await getPoseidon();

  const preimage = BigInt(13);
  const digest = poseidon([preimage]);

  console.log(JSON.stringify({ preimage: bigIntToHex(preimage), digest: bigIntToHex(digest) }));

  const person1 = generateAccount(poseidon, [10, 8]);
  const person2 = generateAccount(poseidon, [10, 10]);

  const commitment1 = generateCommitment({
    poseidon,
    nonce: BigInt(1),
    amount: 50,
    owner_digest: person1.account_digest,
  });

  const commitment1Nullifier = getCommitmentNullifier({
    poseidon,
    commitment: commitment1,
    ownerDigestPreimage: [person1.account_digest_preimage_0, person1.account_digest_preimage_1],
  });

  const input = {
    nullifier: bigIntToHex(commitment1Nullifier),
    digest: bigIntToHex(commitment1.commitment_digest),
    nonce: bigIntToHex(commitment1.nonce),
    amount: bigIntToHex(commitment1.amount),
    ownerDigest: bigIntToHex(commitment1.owner_digest),
    ownerDigestPreimage: [
      bigIntToHex(person1.account_digest_preimage_0),
      bigIntToHex(person1.account_digest_preimage_1),
    ],
  };

  console.log(JSON.stringify(input));

  // const commitment2 = generateCommitment({
  //   poseidon,
  //   nonce: BigInt(1),
  //   amount: 50,
  //   owner_digest: person2.account_digest,
  // });

  // const input = {
  //   rootDigest: bigIntToHex(commitment1.commitment_digest),
  //   commitmentDigest: bigIntToHex(commitment1.commitment_digest),
  //   siblings: [...[...new Array(254)].fill(bigIntToHex(0))],
  // };

  // const trie = new Trie({ trieSize: 42, poseidon, mongodbClient, dbName: "zklar", collectionName: "commitments" });

  // await trie.addLeaf({ index: 0, digest: commitment1.commitment_digest, transaction: 1 });
  // await trie.addLeaf({ index: 1, digest: commitment2.commitment_digest, transaction: 2 });
}
