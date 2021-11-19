import fs from "fs";
import path from "path";
import crypto from "crypto";
import { default as poseidon } from "circomlib/src/poseidon";
import { CompilationArtifacts, SetupKeypair, ZoKratesProvider } from "zokrates-js";
import { initialize } from "zokrates-js/node";
import { PublicKey, PrivateKey, Jub } from "babyjubjub";
import { hexToBigInt } from "./utils/hex-to-big-int";
import { getLevels } from "./get-levels";
import { getProof } from "./get-proof";
import { numToZok } from "./utils/num-to-zok";
import { compile, computeWitness, generateProof, setup, verify } from "./cli-wrapper";
import { memo } from "./memo";
import { createMerkleTree } from "./merkle-tree";
import { setupDepositCircuit } from "./setup/setup-deposit-circuit";

interface Account {
  account_digest_preimage_0: BigInt;
  account_digest_preimage_1: BigInt;
  account_digest: BigInt;
}

function generateAccount(seed: [number, number]): Account {
  const account_digest_preimage_0 = hexToBigInt(seed[0].toString(16));
  const account_digest_preimage_1 = hexToBigInt(seed[1].toString(16));
  const account_digest = poseidon([account_digest_preimage_0, account_digest_preimage_1]);

  return { account_digest_preimage_0, account_digest_preimage_1, account_digest };
}

interface GenerateLeafProps {
  nonce: BigInt;
  amount: number;
  owner_digest: Account["account_digest"];
}

interface Leaf {
  nonce: BigInt;
  amount: number;
  owner_digest: Account["account_digest"];
  leaf_digest: BigInt;
}

function generateLeaf({ nonce, amount, owner_digest }: GenerateLeafProps): Leaf {
  const leaf_digest = poseidon([nonce, amount, owner_digest]);

  return {
    nonce,
    amount,
    owner_digest,
    leaf_digest,
  };
}

interface GetLeafNullifierProps {
  leaf: Leaf;
  owner_digest_preimage_0: BigInt;
  owner_digest_preimage_1: BigInt;
}

function getLeafNullifier({ leaf, owner_digest_preimage_0, owner_digest_preimage_1 }: GetLeafNullifierProps) {
  const nullifier = poseidon([leaf.leaf_digest, owner_digest_preimage_0, owner_digest_preimage_1]);
  return nullifier;
}

function secret() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs1",
      format: "pem",
      cipher: "aes-256-cbc",
      passphrase: "",
    },
  });

  console.log("publicKey", publicKey);
  console.log("privateKey", privateKey);

  const buffer = Buffer.from("test", "utf8");
  const encrypted = crypto.publicEncrypt(publicKey, buffer).toString("base64");
  console.log("encrypted", encrypted);
}

interface SetupCircuitProps {
  provider: ZoKratesProvider;
  filename: string;
  contractName: string;
}

interface SetupCircuitReturn {
  artifacts: CompilationArtifacts;
  keypair: SetupKeypair;
  verifier: string;
}

async function setupCircuit({ provider, filename, contractName }: SetupCircuitProps): Promise<SetupCircuitReturn> {
  const source = (await fs.promises.readFile(path.join(__dirname, "./zokrates", filename))).toString();
  const artifacts = provider.compile(source, {
    config: { allow_unconstrained_variables: true },
  });
  const keypair = provider.setup(artifacts.program);
  let verifier = provider.exportSolidityVerifier(keypair.vk);

  /**
   * For some reason verifier code from Zokrates puts pragma in the middle of the file.
   * That makes causes solidity compiler to fail when importing this contract.
   */
  const pragmaLine = `pragma solidity ^0.8.0;`;

  const verifierParts = verifier.split(pragmaLine);
  verifier = verifierParts[0] + pragmaLine + verifierParts[1] + verifierParts[2];

  /**
   * Since we generate multiple different Zokrates contracts we need to differentiate their names.
   * Different names allow for better typechain integration
   */
  const contractNameLine = "contract Verifier";
  verifier = verifier.replace(contractNameLine, `contract ${contractName}`);

  return { artifacts, keypair, verifier };
}

interface ProveCircuitProps {
  provider: ZoKratesProvider;
  artifacts: CompilationArtifacts;
  keypairPK: Uint8Array;
  params: unknown[];
}

async function proveCircuit({ provider, artifacts, keypairPK, params }: ProveCircuitProps) {
  const { witness } = provider.computeWitness(artifacts, params);

  const proof = provider.generateProof(artifacts.program, witness, keypairPK);

  return { proof };
}

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

  if (!Number.isNaN(1)) return;

  // const person1 =  ([10, 8]);
  // const person2 = generateAccount([2, 18]);

  // const leaf1 = generateLeaf({ nonce: BigInt(1), amount: 50, owner_digest: person1.account_digest });
  // const leaf1Nullifier = getLeafNullifier({
  //   leaf: leaf1,
  //   owner_digest_preimage_0: person1.account_digest_preimage_0,
  //   owner_digest_preimage_1: person1.account_digest_preimage_1,
  // });
  // const leaf2 = generateLeaf({ nonce: BigInt(3), amount: 30, owner_digest: person1.account_digest });
  // const leaf2Nullifier = getLeafNullifier({
  //   leaf: leaf2,
  //   owner_digest_preimage_0: person1.account_digest_preimage_0,
  //   owner_digest_preimage_1: person1.account_digest_preimage_1,
  // });

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

  const private_key = PrivateKey.getRandObj().field;
  const public_key = PublicKey.fromPrivate(new PrivateKey(private_key));

  const note_details_preimage_nonce = hexToBigInt((5).toString(16));
  const note_details_preimage_amount = hexToBigInt((10).toString(16));
  const note_details_preimage_owner_public_key_0 = hexToBigInt(public_key.p.x.n.toString(16));
  const note_details_preimage_owner_public_key_1 = hexToBigInt(public_key.p.y.n.toString(16));
  const owner_private_key = hexToBigInt(private_key.n.toString(16));
  const note_encrypted_message = hexToBigInt((7).toString(16));

  const note_encrypted_message_x = Jub.encrypt(
    [note_details_preimage_nonce, note_details_preimage_amount],
    public_key,
    "12314121"
  );
  console.log("note_encrypted_message_x", note_encrypted_message_x);

  let note_encrypted_message_x_decrypted = Jub.decrypt(note_encrypted_message_x, private_key);
  console.log("note_encrypted_message_x_decrypted", note_encrypted_message_x_decrypted);

  // console.log("note_details_preimage_nonce", note_details_preimage_nonce);
  // console.log("note_details_preimage_amount", note_details_preimage_amount);
  // console.log("note_details_preimage_owner_public_key", note_details_preimage_owner_public_key);

  const note_details_digest = poseidon([
    note_details_preimage_nonce,
    note_details_preimage_amount,
    note_details_preimage_owner_public_key_0,
    note_details_preimage_owner_public_key_1,
  ]);

  // console.log("note_details_digest", note_details_digest);

  const leaf_digest = poseidon([note_details_digest, note_encrypted_message]);

  // console.log("leaf_digest", leaf_digest);

  const nullifier = poseidon([leaf_digest, owner_private_key]);

  const zok = await initialize();

  const proofOfMembershipSource = (
    await fs.promises.readFile(path.join(__dirname, "./zokrates/proofOfMembership.zok"))
  ).toString();
  const proofOfMembershipArtifacts = zok.compile(proofOfMembershipSource, {
    config: { allow_unconstrained_variables: true },
  });

  const nrOfDigestsPerDigest = 6;
  const leafs = [...new Array(nrOfDigestsPerDigest * nrOfDigestsPerDigest)].map((_, index) => poseidon([index]));
  const levels = getLevels(leafs, nrOfDigestsPerDigest);
  const leafDigest = leafs[0];
  const proof = getProof(leafDigest, levels, nrOfDigestsPerDigest);
  const rootDigest = levels[levels.length - 1][0];

  // if (!Number.isNaN(1)) return;

  const { output: proofOfMembershipOutput } = zok.computeWitness(proofOfMembershipArtifacts, [
    numToZok(rootDigest),
    numToZok(leafDigest),
    proof.map((proofStep) => ({
      index_position: numToZok(proofStep.indexPosition),
      digests: proofStep.digests.map((digest) => numToZok(digest)),
    })),
  ]);

  console.log("proofOfMembershipOutput", proofOfMembershipOutput);

  if (!Number.isNaN(1)) return;

  const proofOfOwnershipSource = (
    await fs.promises.readFile(path.join(__dirname, "./zokrates/proofOfOwnership.zok"))
  ).toString();
  const proofOfOwnershipArtifacts = zok.compile(proofOfOwnershipSource, {
    config: { allow_unconstrained_variables: true },
  });

  const { witness, output } = zok.computeWitness(proofOfOwnershipArtifacts, [
    numToZok(nullifier),
    numToZok(note_details_preimage_nonce),
    numToZok(note_details_preimage_amount),
    [numToZok(note_details_preimage_owner_public_key_0), numToZok(note_details_preimage_owner_public_key_1)],
    numToZok(note_details_digest),
    numToZok(owner_private_key),
    numToZok(note_encrypted_message),
    numToZok(leaf_digest),
  ]);

  console.log("output", output);
}

// start()
//   .catch((error) => {
//     console.error(error);
//   })
//   .finally(() => {
//     console.log("DONE");
//   });
