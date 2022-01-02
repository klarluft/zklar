import path from "path";
import { BigNumberish } from "@ethersproject/bignumber";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";

import { getPoseidon, generateAccount, generateCommitment, bigIntToHex, generateProof, Proof } from "zk-proofs";
import { getCommitmentNullifier } from "zk-proofs/build/commitment";
import type {
  TransactionVerifierContract,
  NewRootDigestVerifierContract,
  ZKlarContract,
  DepositVerifierContract,
} from "../typechain-types";

chai.use(solidity);
chai.use(chaiAsPromised);
const { expect } = chai;

interface SolidityProof {
  a: [BigNumberish, BigNumberish];
  b: [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]];
  c: [BigNumberish, BigNumberish];
}

// IMPORTANT!!!
// Look, "b" needs to be swapped ([0][1], [1][0])
// Figuring it out was a very painful experience
function reshapeProof(proof: Proof<"groth16", "bn128">): SolidityProof {
  return {
    a: [bigIntToHex(proof.pi_a[0]), bigIntToHex(proof.pi_a[1])],
    b: [
      [bigIntToHex(proof.pi_b[0][1]), bigIntToHex(proof.pi_b[0][0])],
      [bigIntToHex(proof.pi_b[1][1]), bigIntToHex(proof.pi_b[1][0])],
    ],
    c: [bigIntToHex(proof.pi_c[0]), bigIntToHex(proof.pi_c[1])],
  };
}

describe("ZKlarContract", () => {
  let depositVerifierContract: DepositVerifierContract;
  let transactionVerifierContract: TransactionVerifierContract;
  let newRootDigestVerifierContract: NewRootDigestVerifierContract;
  let zKlarContract: ZKlarContract;

  beforeEach(async () => {
    console.log("beforeEach");
    const signers = await ethers.getSigners();

    const depositVerifierContractFactory = await ethers.getContractFactory("DepositVerifierContract", signers[0]);

    const transactionVerifierContractFactory = await ethers.getContractFactory(
      "TransactionVerifierContract",
      signers[0]
    );

    const newRootDigestVerifierContractFactory = await ethers.getContractFactory(
      "NewRootDigestVerifierContract",
      signers[0]
    );

    const zKlarContractFactory = await ethers.getContractFactory("ZKlarContract", signers[0]);

    depositVerifierContract = await depositVerifierContractFactory.deploy();
    await depositVerifierContract.deployed();

    transactionVerifierContract = await transactionVerifierContractFactory.deploy();
    await transactionVerifierContract.deployed();

    newRootDigestVerifierContract = await newRootDigestVerifierContractFactory.deploy();
    await newRootDigestVerifierContract.deployed();

    zKlarContract = await zKlarContractFactory.deploy(
      depositVerifierContract.address,
      transactionVerifierContract.address,
      newRootDigestVerifierContract.address
    );
    await zKlarContract.deployed();
  });

  describe.skip("deposit", function () {
    // 5 min timeout
    this.timeout(5 * 60 * 1000);

    it("deposits", async () => {
      const poseidon = await getPoseidon();
      const person1 = generateAccount(poseidon, [10, 8]);
      const amount = 50;
      const commitment1 = generateCommitment({
        poseidon,
        nonce: BigInt(1),
        amount,
        owner_digest: person1.account_digest,
      });

      const verifyDepositInput = {
        commitmentDigest: bigIntToHex(commitment1.commitment_digest),
        nonce: bigIntToHex(commitment1.nonce),
        amount: bigIntToHex(commitment1.amount),
        ownerDigest: bigIntToHex(commitment1.owner_digest),
      };

      const verifyDepositWebAssemblyFilePath = path.join(__dirname, "verify-deposit.wasm");
      const verifyDepositZkeyFilePath = path.join(__dirname, "verify-deposit_final.zkey");

      const { proof: depositProof } = await generateProof({
        input: verifyDepositInput,
        webAssemblyFilePath: verifyDepositWebAssemblyFilePath,
        zkeyFilePath: verifyDepositZkeyFilePath,
      });

      const solidityParams = {
        _depositProof: reshapeProof(depositProof),
        _commitmentDigest: bigIntToHex(commitment1.commitment_digest),
      };

      await zKlarContract.deposit(solidityParams._depositProof, solidityParams._commitmentDigest, { value: amount });

      expect(await zKlarContract.pendingDepositsBalances(bigIntToHex(commitment1.commitment_digest))).to.be.equal(
        amount
      );
    });
  });

  describe("fullfil pending deposits", function () {
    // 5 min timeout
    this.timeout(5 * 60 * 1000);

    it("fullfil pending deposits", async () => {
      const poseidon = await getPoseidon();

      const person1 = generateAccount(poseidon, [10, 8]);
      const amount1 = 50;
      const commitment1 = generateCommitment({
        poseidon,
        nonce: BigInt(1),
        amount: amount1,
        owner_digest: person1.account_digest,
      });
      const rootDigest1 = commitment1.commitment_digest;

      const person2 = generateAccount(poseidon, [11, 9]);
      const amount2 = 50;
      const commitment2 = generateCommitment({
        poseidon,
        nonce: BigInt(2),
        amount: amount2,
        owner_digest: person2.account_digest,
      });
      const rootDigest2 = poseidon([commitment1.commitment_digest, commitment2.commitment_digest]);

      const person3 = generateAccount(poseidon, [11, 9]);
      const amount3 = 50;
      const commitment3 = generateCommitment({
        poseidon,
        nonce: BigInt(3),
        amount: amount3,
        owner_digest: person3.account_digest,
      });
      const rootDigest3 = poseidon([rootDigest2, commitment3.commitment_digest]);

      const verifyNewRootDigestWebAssemblyFilePath = path.join(__dirname, "verify-new-root-digest.wasm");
      const verifyNewRootDigestZkeyFilePath = path.join(__dirname, "verify-new-root-digest_final.zkey");

      const verifyNewRootDigest1Input = {
        oldRootDigest: bigIntToHex(rootDigest1),
        oldCommitmentDigest: bigIntToHex(0),
        newRootDigest: bigIntToHex(rootDigest2),
        newCommitmentDigest: bigIntToHex(commitment2.commitment_digest),
        commitmentIndex: bigIntToHex(1),
        siblings: [bigIntToHex(commitment1.commitment_digest), ...[...new Array(42 - 1)].fill(bigIntToHex(0))],
      };

      const verifyNewRootDigest2Input = {
        oldRootDigest: bigIntToHex(rootDigest2),
        oldCommitmentDigest: bigIntToHex(0),
        newRootDigest: bigIntToHex(rootDigest3),
        newCommitmentDigest: bigIntToHex(commitment3.commitment_digest),
        commitmentIndex: bigIntToHex(2),
        siblings: [bigIntToHex(0), bigIntToHex(rootDigest2), ...[...new Array(42 - 2)].fill(bigIntToHex(0))],
      };

      const { proof: verifyNewRootDigest1Proof } = await generateProof({
        input: verifyNewRootDigest1Input,
        webAssemblyFilePath: verifyNewRootDigestWebAssemblyFilePath,
        zkeyFilePath: verifyNewRootDigestZkeyFilePath,
      });

      const { proof: verifyNewRootDigest2Proof } = await generateProof({
        input: verifyNewRootDigest2Input,
        webAssemblyFilePath: verifyNewRootDigestWebAssemblyFilePath,
        zkeyFilePath: verifyNewRootDigestZkeyFilePath,
      });

      await zKlarContract.setRootDigest(rootDigest1);
      await zKlarContract.setPendingDepositsBalances(commitment2.commitment_digest, commitment2.amount);
      await zKlarContract.setPendingDepositsBalances(commitment3.commitment_digest, commitment3.amount);

      const result = await zKlarContract.fullfilPendingDeposits([
        {
          newRootDigestProof: reshapeProof(verifyNewRootDigest1Proof),
          newRootDigest: bigIntToHex(rootDigest2),
          commitmentDigest: bigIntToHex(commitment2.commitment_digest),
        },
        {
          newRootDigestProof: reshapeProof(verifyNewRootDigest2Proof),
          newRootDigest: bigIntToHex(rootDigest3),
          commitmentDigest: bigIntToHex(commitment3.commitment_digest),
        },
      ]);

      expect(await zKlarContract.rootDigest()).to.be.equal(rootDigest3);
      expect(await zKlarContract.pendingDepositsBalances(bigIntToHex(commitment2.commitment_digest))).to.be.equal(0);
      expect(await zKlarContract.pendingDepositsBalances(bigIntToHex(commitment3.commitment_digest))).to.be.equal(0);

      console.log("result", result);
    });
  });

  describe.skip("transact", function () {
    // 5 min timeout
    this.timeout(5 * 60 * 1000);

    it("transacts", async () => {
      console.log("transacts");
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

      const rootDigest1 = poseidon([commitment1.commitment_digest, commitment2.commitment_digest]);

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

      const rootDigest2 = poseidon([rootDigest1, commitment3.commitment_digest]);
      const rootDigest3 = poseidon([
        rootDigest1,
        poseidon([commitment3.commitment_digest, commitment4.commitment_digest]),
      ]);

      const verifyTransactionWebAssemblyFilePath = path.join(__dirname, "verify-transaction.wasm");
      const verifyTransactionZkeyFilePath = path.join(__dirname, "verify-transaction_final.zkey");

      console.log("transactionProof");
      const { proof: transactionProof } = await generateProof({
        input: verifyTransactionInput,
        webAssemblyFilePath: verifyTransactionWebAssemblyFilePath,
        zkeyFilePath: verifyTransactionZkeyFilePath,
      });

      const verifyNewRootDigestWebAssemblyFilePath = path.join(__dirname, "verify-new-root-digest.wasm");
      const verifyNewRootDigestZkeyFilePath = path.join(__dirname, "verify-new-root-digest_final.zkey");

      const verifyNewRootDigest1Input = {
        oldRootDigest: bigIntToHex(rootDigest1),
        oldCommitmentDigest: bigIntToHex(0),
        newRootDigest: bigIntToHex(rootDigest2),
        newCommitmentDigest: verifyTransactionInput.newCommitment0Digest,
        commitmentIndex: bigIntToHex(2),
        siblings: [bigIntToHex(0), bigIntToHex(rootDigest1), ...[...new Array(42 - 2)].fill(bigIntToHex(0))],
      };

      console.log("verifyNewRootDigest1Proof");
      const { proof: verifyNewRootDigest1Proof } = await generateProof({
        input: verifyNewRootDigest1Input,
        webAssemblyFilePath: verifyNewRootDigestWebAssemblyFilePath,
        zkeyFilePath: verifyNewRootDigestZkeyFilePath,
      });

      const verifyNewRootDigest2Input = {
        oldRootDigest: bigIntToHex(rootDigest2),
        oldCommitmentDigest: bigIntToHex(0),
        newRootDigest: bigIntToHex(rootDigest3),
        newCommitmentDigest: verifyTransactionInput.newCommitment1Digest,
        commitmentIndex: bigIntToHex(3),
        siblings: [
          verifyTransactionInput.newCommitment0Digest,
          bigIntToHex(rootDigest1),
          ...[...new Array(42 - 2)].fill(bigIntToHex(0)),
        ],
      };

      console.log("verifyNewRootDigest2Proof");
      const { proof: verifyNewRootDigest2Proof } = await generateProof({
        input: verifyNewRootDigest2Input,
        webAssemblyFilePath: verifyNewRootDigestWebAssemblyFilePath,
        zkeyFilePath: verifyNewRootDigestZkeyFilePath,
      });

      const solidityParams = {
        _transactionNewDigests: {
          newCommitment0Digest: verifyTransactionInput.newCommitment0Digest,
          newCommitment0RootDigest: bigIntToHex(rootDigest2),
          newCommitment1Digest: verifyTransactionInput.newCommitment1Digest,
          newCommitment1RootDigest: bigIntToHex(rootDigest3),
        },
        _transactionProof: reshapeProof(transactionProof),
        _transactionProofInputs: {
          rootDigest: verifyTransactionInput.rootDigest,
          commitment0Nullifier: verifyTransactionInput.commitment0Nullifier,
          commitment1Nullifier: verifyTransactionInput.commitment1Nullifier,
        },
        _newRootDigestProof0: reshapeProof(verifyNewRootDigest1Proof),
        _newRootDigestProof1: reshapeProof(verifyNewRootDigest2Proof),
      };

      console.log("setRootDigest 1");
      await zKlarContract.setRootDigest(verifyTransactionInput.commitment0Digest);
      console.log("setRootDigest 2");
      await zKlarContract.setRootDigest(verifyTransactionInput.rootDigest);

      console.log("transact");
      await zKlarContract.transact(
        solidityParams._transactionNewDigests,
        solidityParams._transactionProof,
        solidityParams._transactionProofInputs,
        solidityParams._newRootDigestProof0,
        solidityParams._newRootDigestProof1
      );

      console.log("rootDigest");
      expect(await zKlarContract.rootDigest()).to.be.equal(rootDigest3);
    });
  });
});
