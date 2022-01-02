import path from 'path';

import test from 'ava';
import {
  bigIntToHex,
  generateAccount,
  generateCommitment,
  generateProof,
  getPoseidon,
} from 'zk-proofs';
import { getCommitmentNullifier } from 'zk-proofs/build/commitment';

import { SendTransactionInput } from '../resolvers/TransactionResolver.inputs';

import { verifyTransactionProof } from './verifyTransactionProof';

export const exampleProof = {
  pi_a: [
    '20913875345135766416515900832908113312444654152938413569342651405080575991117',
    '1454345583109989936525270798980365678719692232172839654593511788253216247502',
    '1',
  ],
  pi_b: [
    [
      '20216344684178773246344306082884742252596705405929616287304768732446005549195',
      '3967355859774109294536267688297616741544101084003124988830201961418221351986',
    ],
    [
      '21772421965994546779761923793778112859354001799812825444489099304299260624629',
      '4045639827830105134897859500676503153285230621741825329639229001105005309598',
    ],
    ['1', '0'],
  ],
  pi_c: [
    '15311277891455081167417422175115357691202354953532021463715898659595103298527',
    '3189747666849272251555133169771469099864882438510405341219534441868916806759',
    '1',
  ],
  protocol: 'groth16',
  curve: 'bn128',
};

export const examplePublicInputs = [
  '1',
  '6219837461070653564586169814109518701048739129939606787477340350352453412660',
  '13239104105823695639008398983514690449410284221046067676940573191629224963891',
  '15893700147184822134834942728233183126659323839671389847044222154613196768506',
  '21592519779161653269109792652856589994035995350089489169975510090722338073049',
  '21522608729217472495048725998717239930028896930457000475021263260259244859489',
];

test('verifyTransactionProof', async (t) => {
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
    ownerDigestPreimage: [
      person1.account_digest_preimage_0,
      person1.account_digest_preimage_1,
    ],
  });

  const commitment2Nullifier = getCommitmentNullifier({
    poseidon,
    commitment: commitment2,
    ownerDigestPreimage: [
      person1.account_digest_preimage_0,
      person1.account_digest_preimage_1,
    ],
  });

  const rootDigest1 = poseidon([
    commitment1.commitment_digest,
    commitment2.commitment_digest,
  ]);

  const verifyTransactionInput = {
    rootDigest: bigIntToHex(rootDigest1),

    commitment0Nullifier: bigIntToHex(commitment1Nullifier),
    commitment0Digest: bigIntToHex(commitment1.commitment_digest),
    commitment0Nonce: bigIntToHex(commitment1.nonce),
    commitment0Amount: bigIntToHex(commitment1.amount),
    commitment0OwnerDigest: bigIntToHex(commitment1.owner_digest),
    commitment0OwnerDigestPreimage: [
      bigIntToHex(person1.account_digest_preimage_0),
      bigIntToHex(person1.account_digest_preimage_1),
    ],
    commitment0Index: bigIntToHex(0),
    commitment0Siblings: [
      bigIntToHex(commitment2.commitment_digest),
      ...[...new Array(42 - 1)].fill(bigIntToHex(0)),
    ],

    commitment1Nullifier: bigIntToHex(commitment2Nullifier),
    commitment1Digest: bigIntToHex(commitment2.commitment_digest),
    commitment1Nonce: bigIntToHex(commitment2.nonce),
    commitment1Amount: bigIntToHex(commitment2.amount),
    commitment1OwnerDigest: bigIntToHex(commitment2.owner_digest),
    commitment1OwnerDigestPreimage: [
      bigIntToHex(person1.account_digest_preimage_0),
      bigIntToHex(person1.account_digest_preimage_1),
    ],
    commitment1Index: bigIntToHex(1),
    commitment1Siblings: [
      bigIntToHex(commitment1.commitment_digest),
      ...[...new Array(42 - 1)].fill(bigIntToHex(0)),
    ],

    newCommitment0Digest: bigIntToHex(commitment3.commitment_digest),
    newCommitment0Nonce: bigIntToHex(commitment3.nonce),
    newCommitment0Amount: bigIntToHex(commitment3.amount),
    newCommitment0OwnerDigest: bigIntToHex(commitment3.owner_digest),

    newCommitment1Digest: bigIntToHex(commitment4.commitment_digest),
    newCommitment1Nonce: bigIntToHex(commitment4.nonce),
    newCommitment1Amount: bigIntToHex(commitment4.amount),
    newCommitment1OwnerDigest: bigIntToHex(commitment4.owner_digest),
  };

  const verifyTransactionWebAssemblyFilePath = path.join(
    __dirname,
    '../proofs/verify-transaction.wasm'
  );
  const verifyTransactionZkeyFilePath = path.join(
    __dirname,
    '../proofs/verify-transaction_final.zkey'
  );

  const { proof } = await generateProof({
    input: verifyTransactionInput,
    webAssemblyFilePath: verifyTransactionWebAssemblyFilePath,
    zkeyFilePath: verifyTransactionZkeyFilePath,
  });

  const input: SendTransactionInput = {
    proof: {
      a0: proof.pi_a[0],
      a1: proof.pi_a[1],
      b00: proof.pi_b[0][0],
      b01: proof.pi_b[0][1],
      b10: proof.pi_b[1][0],
      b11: proof.pi_b[1][1],
      c0: proof.pi_c[0],
      c1: proof.pi_c[1],
    },
    rootDigest: verifyTransactionInput.rootDigest,
    commitment0Nullifier: verifyTransactionInput.commitment0Nullifier,
    commitment1Nullifier: verifyTransactionInput.commitment1Nullifier,
    newCommitment0Digest: verifyTransactionInput.newCommitment0Digest,
    newCommitment1Digest: verifyTransactionInput.newCommitment1Digest,
  };

  t.is(await verifyTransactionProof(input), true);
});
