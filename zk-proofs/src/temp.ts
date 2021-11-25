import fs from "fs";
import path from "path";
import crypto from "crypto";
import { buildPoseidon } from "circomlibjs";
import { CompilationArtifacts, SetupKeypair, ZoKratesProvider } from "zokrates-js";
import { initialize } from "zokrates-js/node";
import { PublicKey, PrivateKey, Jub } from "babyjubjub";
import { hexToBigInt } from "./utils/hex-to-big-int";
import { getLevels } from "./get-levels";
import { getProof } from "./get-proof";
import { numToZok } from "./utils/num-to-zok";
// import { compile, computeWitness, generateProof, setup, verify } from "./cli-wrapper";
// import { memo } from "./memo";
// import { createMerkleTree } from "./merkle-tree";
// import { setupDepositCircuit } from "./setup/setup-deposit-circuit";
// import { setupTransactionCircuit } from "./setup/setup-transation-circuit";
// import { setupUpdateCircuit } from "./setup/setup-update-circuit";
import { wasm } from "circom_tester";
import { generateAccount } from "./account";
import { generateCommitment } from "./commitment";

async function start() {
  // console.log("compile");
  // await compile({ input: path.join(__dirname, "./zokrates/test.zok"), curve: "bls12_377" });
  // console.log("setup");
  // await setup({ provingScheme: "gm17", backend: "ark" });
  // console.log("computeWitness");
  // await computeWitness({ argumentsArray: ["1", "2"] });
  // const proofResults = await generateProof({ provingScheme: "gm17", backend: "ark" });

  // console.log("compile");
  // await compile({ input: path.join(__dirname, "./zokrates/gm17.zok"), curve: "bw6_761" });
  // console.log("setup");
  // await setup({ backend: "ark", provingScheme: "gm17" });
  // console.log("computeWitness");
  // await computeWitness({ argumentsArray: [proofResults.proof, proofResults.verificationKey] });
  // console.log("generateProof");
  // const proofResults2 = await generateProof({ provingScheme: "gm17", backend: "ark" });
  // console.log("proofResults2", proofResults2);
  // console.log("verify");
  // const isVerified = await verify({ provingScheme: "gm17", backend: "ark", curve: "bw6_761" });

  // console.log("isVerified", isVerified);

  // secret();
  // console.log(generateAcc());

  // await createMerkleTree();

  // const provider = await initialize();

  // await setupDepositCircuit({ provider });
  // await setupTransactionCircuit({ provider });
  // await setupUpdateCircuit({ provider });

  const poseidon = await buildPoseidon();

  const person1 = generateAccount(poseidon, [10, 8]);
  // const person2 = generateAccount([2, 18]);

  const commitment = generateCommitment({
    poseidon,
    nonce: BigInt(1),
    amount: 50,
    owner_digest: person1.account_digest,
  });

  // const params = {
  //   commitmentDigest: commitment.commitment_digest,
  //   nonce: commitment.nonce,
  //   amount: commitment.amount,
  //   ownerDigest: commitment.owner_digest,
  // };

  // console.log("commitmentDigest", numToZok(params.commitmentDigest));
  // console.log("nonce", numToZok(params.nonce));
  // console.log("amount", numToZok(params.amount));
  // console.log("ownerDigest", numToZok(params.ownerDigest));

  // console.log("step 1");
  // const circuit = await wasm(path.join(__dirname, "circuits", "verify-deposit.circom"));

  // console.log("step 2");
  // const circuitWitness = await circuit.calculateWitness(
  //   {
  //     commitmentDigest: numToZok(commitment.commitment_digest),
  //     nonce: numToZok(commitment.nonce),
  //     amount: numToZok(commitment.amount),
  //     ownerDigest: numToZok(commitment.owner_digest),
  //   },
  //   true
  // );

  const commitment2 = generateCommitment({
    poseidon,
    nonce: BigInt(2),
    amount: 10,
    owner_digest: person1.account_digest,
  });

  const testDigest = poseidon.F.toObject(poseidon([commitment2.commitment_digest, commitment.commitment_digest]));

  const transactionParams = {
    rootDigest: numToZok(testDigest),
    commitmentDigest: numToZok(commitment.commitment_digest),
    commitmentIndex: numToZok(1),
    siblings: [numToZok(commitment2.commitment_digest), ...[...new Array(256 - 1)].fill(numToZok(0))],
  };

  console.log(JSON.stringify(transactionParams, null, 2));

  if (!Number.isNaN(1)) return;

  // const leafsToUse = [leaf1, leaf2];
  // const nrOfLevels = 32;
  // const nrOfLeafsPerDigest = 2;
  // const nrOfLeafs = Math.pow(nrOfLeafsPerDigest, nrOfLevels);
  // const emptyLeaf = BigInt(0);

  // function getSiblings();

  // const leaf1MerkleTreeProof = getProof(leaf1.leaf_digest, merkleTreeLevels, nrOfLeafsPerDigest);
  // const leaf2MerkleTreeProof = getProof(leaf2.leaf_digest, merkleTreeLevels, nrOfLeafsPerDigest);

  // const newLeaf1 = generateLeaf({ nonce: BigInt(4), amount: 75, owner_digest: person2.account_digest });
  // const newLeaf2 = generateLeaf({ nonce: BigInt(4), amount: 5, owner_digest: person1.account_digest });

  // const { proof: proofX } = await proveCircuit({
  //   provider,
  //   artifacts,
  //   keypairPK: keypair.pk,
  //   params: [
  //     numToZok(merkleTreeRootDigest),
  //     numToZok(leaf1Nullifier),
  //     numToZok(leaf1.leaf_digest),
  //     numToZok(leaf1.nonce),
  //     numToZok(leaf1.amount),
  //     numToZok(leaf1.owner_digest),
  //     [numToZok(person1.account_digest_preimage_0), numToZok(person1.account_digest_preimage_1)],
  //     leaf1MerkleTreeProof.map((proofStep) => ({
  //       index_position: numToZok(proofStep.indexPosition),
  //       digests: proofStep.digests.map((digest) => numToZok(digest)),
  //     })),
  //     numToZok(leaf2Nullifier),
  //     numToZok(leaf2.leaf_digest),
  //     numToZok(leaf2.nonce),
  //     numToZok(leaf2.amount),
  //     numToZok(leaf2.owner_digest),
  //     [numToZok(person1.account_digest_preimage_0), numToZok(person1.account_digest_preimage_1)],
  //     leaf2MerkleTreeProof.map((proofStep) => ({
  //       index_position: numToZok(proofStep.indexPosition),
  //       digests: proofStep.digests.map((digest) => numToZok(digest)),
  //     })),
  //     numToZok(newLeaf1.leaf_digest),
  //     numToZok(newLeaf1.nonce),
  //     numToZok(newLeaf1.amount),
  //     numToZok(newLeaf1.owner_digest),
  //     numToZok(newLeaf2.leaf_digest),
  //     numToZok(newLeaf2.nonce),
  //     numToZok(newLeaf2.amount),
  //     numToZok(newLeaf2.owner_digest),
  //   ],
  // });

  // console.log("proofX", proofX);

  if (!Number.isNaN(1)) return;

  // const private_key = PrivateKey.getRandObj().field;
  // const public_key = PublicKey.fromPrivate(new PrivateKey(private_key));

  // const note_details_preimage_nonce = hexToBigInt((5).toString(16));
  // const note_details_preimage_amount = hexToBigInt((10).toString(16));
  // const note_details_preimage_owner_public_key_0 = hexToBigInt(public_key.p.x.n.toString(16));
  // const note_details_preimage_owner_public_key_1 = hexToBigInt(public_key.p.y.n.toString(16));
  // const owner_private_key = hexToBigInt(private_key.n.toString(16));
  // const note_encrypted_message = hexToBigInt((7).toString(16));

  // const note_encrypted_message_x = Jub.encrypt(
  //   [note_details_preimage_nonce, note_details_preimage_amount],
  //   public_key,
  //   "12314121"
  // );
  // console.log("note_encrypted_message_x", note_encrypted_message_x);

  // let note_encrypted_message_x_decrypted = Jub.decrypt(note_encrypted_message_x, private_key);
  // console.log("note_encrypted_message_x_decrypted", note_encrypted_message_x_decrypted);

  // // console.log("note_details_preimage_nonce", note_details_preimage_nonce);
  // // console.log("note_details_preimage_amount", note_details_preimage_amount);
  // // console.log("note_details_preimage_owner_public_key", note_details_preimage_owner_public_key);

  // const note_details_digest = poseidon([
  //   note_details_preimage_nonce,
  //   note_details_preimage_amount,
  //   note_details_preimage_owner_public_key_0,
  //   note_details_preimage_owner_public_key_1,
  // ]);

  // // console.log("note_details_digest", note_details_digest);

  // const leaf_digest = poseidon([note_details_digest, note_encrypted_message]);

  // // console.log("leaf_digest", leaf_digest);

  // const nullifier = poseidon([leaf_digest, owner_private_key]);

  // const zok = await initialize();

  // const proofOfMembershipSource = (
  //   await fs.promises.readFile(path.join(__dirname, "./zokrates/proofOfMembership.zok"))
  // ).toString();
  // const proofOfMembershipArtifacts = zok.compile(proofOfMembershipSource, {
  //   config: { allow_unconstrained_variables: true },
  // });

  // const nrOfDigestsPerDigest = 6;
  // const leafs = [...new Array(nrOfDigestsPerDigest * nrOfDigestsPerDigest)].map((_, index) => poseidon([index]));
  // const levels = getLevels(leafs, nrOfDigestsPerDigest);
  // const leafDigest = leafs[0];
  // const proof = getProof(leafDigest, levels, nrOfDigestsPerDigest);
  // const rootDigest = levels[levels.length - 1][0];

  // // if (!Number.isNaN(1)) return;

  // const { output: proofOfMembershipOutput } = zok.computeWitness(proofOfMembershipArtifacts, [
  //   numToZok(rootDigest),
  //   numToZok(leafDigest),
  //   proof.map((proofStep) => ({
  //     index_position: numToZok(proofStep.indexPosition),
  //     digests: proofStep.digests.map((digest) => numToZok(digest)),
  //   })),
  // ]);

  // console.log("proofOfMembershipOutput", proofOfMembershipOutput);

  // if (!Number.isNaN(1)) return;

  // const proofOfOwnershipSource = (
  //   await fs.promises.readFile(path.join(__dirname, "./zokrates/proofOfOwnership.zok"))
  // ).toString();
  // const proofOfOwnershipArtifacts = zok.compile(proofOfOwnershipSource, {
  //   config: { allow_unconstrained_variables: true },
  // });

  // const { witness, output } = zok.computeWitness(proofOfOwnershipArtifacts, [
  //   numToZok(nullifier),
  //   numToZok(note_details_preimage_nonce),
  //   numToZok(note_details_preimage_amount),
  //   [numToZok(note_details_preimage_owner_public_key_0), numToZok(note_details_preimage_owner_public_key_1)],
  //   numToZok(note_details_digest),
  //   numToZok(owner_private_key),
  //   numToZok(note_encrypted_message),
  //   numToZok(leaf_digest),
  // ]);

  // console.log("output", output);
}

start()
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    console.log("DONE");
  });
