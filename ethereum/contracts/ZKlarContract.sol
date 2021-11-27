// SPDX-License-Identifier: LGPL-3.0-only
// This file is LGPL3 Licensed
pragma solidity ^0.6.11;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";
import { TransactionVerifierContract } from "./TransactionVerifierContract.sol";
import { NewRootDigestVerifierContract } from "./NewRootDigestVerifierContract.sol";

contract ZKlarContract {
  uint public rootDigest;
  uint public currentIndex;
  mapping(uint => bool) public rootDigests;
  address public transactionVerifierContractAddress;
  address public newRootDigestVerifierContractAddress;
  mapping(uint => bool) public nullifiers;

  struct Proof {
    uint[2] a;
    uint[2][2] b;
    uint[2] c;
  }

  struct TransactionNewDigests {
    uint newCommitment0Digest;
    uint newCommitment0RootDigest;
    uint newCommitment1Digest;
    uint newCommitment1RootDigest;
  }

  struct TransactionProofInputs {
    uint rootDigest;
    uint commitment0Nullifier;
    uint commitment1Nullifier;
  }

  constructor(
    address _transactionVerifierContractAddress,
    address _newRootDigestVerifierContractAddress
  ) public {
    rootDigest = 0;
    currentIndex = 0;
    rootDigests[0] = true;
    transactionVerifierContractAddress = _transactionVerifierContractAddress;
    newRootDigestVerifierContractAddress = _newRootDigestVerifierContractAddress;
  }

  function setRootDigest(
    uint _rootDigest
  ) public {
    rootDigest = _rootDigest;
    rootDigests[_rootDigest] = true;
    currentIndex = currentIndex + 1;
  }

  function setNullifier(
    uint _nullifier
  ) public {
    nullifiers[_nullifier] = true;
  }

  function transact(
    TransactionNewDigests memory _transactionNewDigests,
    Proof memory _transactionProof,
    TransactionProofInputs memory _transactionProofInputs,
    Proof memory _newRootDigestProof0,
    Proof memory _newRootDigestProof1
  ) public {
    require(rootDigests[_transactionProofInputs.rootDigest] == true, "Invalid root digest");

    require(nullifiers[_transactionProofInputs.commitment0Nullifier] == false, "Nullifier for commitment 0 already exists");
    require(nullifiers[_transactionProofInputs.commitment1Nullifier] == false, "Nullifier for commitment 1 already exists");

    TransactionVerifierContract transactionVerifierContract = TransactionVerifierContract(
      address(transactionVerifierContractAddress)
    );

    NewRootDigestVerifierContract newRootDigestVerifierContract = NewRootDigestVerifierContract(
      address(newRootDigestVerifierContractAddress)
    );

    uint[6] memory transactionVerifierContractInputs = [
      1,
      _transactionProofInputs.rootDigest,
      _transactionProofInputs.commitment0Nullifier,
      _transactionProofInputs.commitment1Nullifier,
      _transactionNewDigests.newCommitment0Digest,
      _transactionNewDigests.newCommitment1Digest
    ];

    bool transactionVerifierContractResponse = transactionVerifierContract.verifyProof(
      _transactionProof.a,
      _transactionProof.b,
      _transactionProof.c,
      transactionVerifierContractInputs
    );

    require(transactionVerifierContractResponse, "Invalid transaction proof");

    uint[6] memory newRootDigestVerifierContract0Inputs = [
      1,
      rootDigest,
      0,
      _transactionNewDigests.newCommitment0RootDigest,
      _transactionNewDigests.newCommitment0Digest,
      currentIndex
    ];

    bool newRootDigestVerifierContract0Response = newRootDigestVerifierContract.verifyProof(
      _newRootDigestProof0.a,
      _newRootDigestProof0.b,
      _newRootDigestProof0.c,
      newRootDigestVerifierContract0Inputs
    );

    require(newRootDigestVerifierContract0Response, "Invalid new root digest 0 proof");

    uint[6] memory newRootDigestVerifierContract1Inputs = [
      1,
      _transactionNewDigests.newCommitment0RootDigest,
      0,
      _transactionNewDigests.newCommitment1RootDigest,
      _transactionNewDigests.newCommitment1Digest,
      currentIndex + 1
    ];

    bool newRootDigestVerifierContract1Response = newRootDigestVerifierContract.verifyProof(
      _newRootDigestProof1.a,
      _newRootDigestProof1.b,
      _newRootDigestProof1.c,
      newRootDigestVerifierContract1Inputs
    );

    require(newRootDigestVerifierContract1Response, "Invalid new root digest 1 proof");

    // Set new root digest
    rootDigest = _transactionNewDigests.newCommitment1RootDigest;

    // Update current index
    currentIndex = currentIndex + 2;

    // Add root digests
    rootDigests[_transactionNewDigests.newCommitment0RootDigest] = true;
    rootDigests[_transactionNewDigests.newCommitment1RootDigest] = true;

    // Add nullifiers
    nullifiers[_transactionProofInputs.commitment0Nullifier] = true;
    nullifiers[_transactionProofInputs.commitment1Nullifier] = true;
  }
}