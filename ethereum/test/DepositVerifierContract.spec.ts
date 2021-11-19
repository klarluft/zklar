import { BigNumberish } from "@ethersproject/bignumber";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";

import { generateAccount, generateCommitment, getDepositProof, GetDepositProofReturn } from "zk-proofs";
import type { DepositVerifierContract, DepositContract } from "../typechain-types";

chai.use(solidity);
chai.use(chaiAsPromised);
const { expect } = chai;

interface Proof {
  a: { X: BigNumberish; Y: BigNumberish };
  b: { X: [BigNumberish, BigNumberish]; Y: [BigNumberish, BigNumberish] };
  c: { X: BigNumberish; Y: BigNumberish };
}

function reshapeProof(proof: GetDepositProofReturn["proof"]): Proof {
  return {
    a: { X: proof.a[0], Y: proof.a[1] },
    b: { X: [proof.b[0][0], proof.b[0][1]], Y: [proof.b[1][0], proof.b[1][1]] },
    c: { X: proof.c[0], Y: proof.c[1] },
  };
}

describe("DepositContract", async () => {
  let depositVerifierContract: DepositVerifierContract;
  let depositContract: DepositContract;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    const depositVerifierContractFactory = await ethers.getContractFactory("DepositVerifierContract", signers[0]);
    const depositContractFactory = await ethers.getContractFactory("DepositContract", signers[0]);

    depositVerifierContract = await depositVerifierContractFactory.deploy();
    await depositVerifierContract.deployed();

    depositContract = await depositContractFactory.deploy(depositVerifierContract.address);
    await depositContract.deployed();
  });

  describe("deposit", async () => {
    it("deposits", async () => {
      const person1 = generateAccount([1, 2]);

      const nonce = BigInt(1);
      const amount = 2;

      const commitment = generateCommitment({ nonce, amount, owner_digest: person1.account_digest });

      const { proof } = await getDepositProof({
        amount,
        nonce,
        commitmentDigest: commitment.commitment_digest,
        ownerDigest: person1.account_digest,
      });

      await expect(
        depositContract.deposit(reshapeProof(proof), commitment.commitment_digest as bigint, 1, {
          value: amount,
        })
      )
        .to.emit(depositContract, "Deposit")
        .withArgs(commitment.commitment_digest);

      expect(await ethers.provider.getBalance(depositContract.address)).to.be.equal(amount);
      expect(await depositContract.pendingDepositsBalances(commitment.commitment_digest as bigint)).to.be.equal(amount);
    });

    it("reverts on invalid proof (amount)", async () => {
      const person1 = generateAccount([1, 2]);

      const nonce = BigInt(1);
      const amount = 2;

      const commitment = generateCommitment({ nonce, amount, owner_digest: person1.account_digest });

      const { proof } = await getDepositProof({
        amount,
        nonce,
        commitmentDigest: commitment.commitment_digest,
        ownerDigest: person1.account_digest,
      });

      await expect(
        depositContract.deposit(reshapeProof(proof), commitment.commitment_digest as bigint, 1, {
          value: amount + 1,
        })
      ).to.be.revertedWith("Invalid deposit proof");

      expect(await ethers.provider.getBalance(depositContract.address)).to.be.equal(0);
      expect(await depositContract.pendingDepositsBalances(commitment.commitment_digest as bigint)).to.be.equal(0);
    });
  });
});
