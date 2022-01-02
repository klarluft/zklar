// SPDX-License-Identifier: LGPL-3.0-only
// This file is LGPL3 Licensed
pragma solidity ^0.6.11;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";
import { DepositVerifierContract } from "./DepositVerifierContract.sol";
import { TransactionVerifierContract } from "./TransactionVerifierContract.sol";
import { NewRootDigestVerifierContract } from "./NewRootDigestVerifierContract.sol";

contract ZKlarContract {
  uint public rootDigest;
  uint public currentIndex;
  mapping(uint => bool) public rootDigests;
  address public depositVerifierContractAddress;
  address public transactionVerifierContractAddress;
  address public newRootDigestVerifierContractAddress;
  mapping(uint => bool) public nullifiers;
  mapping(uint => uint256) public pendingDepositsBalances;

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

  event Deposit(uint indexed commitmentDigest, uint256 amount);

  constructor(
    address _depositVerifierContractAddress,
    address _transactionVerifierContractAddress,
    address _newRootDigestVerifierContractAddress
  ) public {
    rootDigest = 0;
    currentIndex = 0;
    rootDigests[0] = true;
    depositVerifierContractAddress = _depositVerifierContractAddress;
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

  function setPendingDepositsBalances(
    uint _commitmentDigest,
    uint256 _amount
  ) public {
    pendingDepositsBalances[_commitmentDigest] = _amount;
  }

  function deposit(
    Proof memory _depositProof,
    uint _commitmentDigest
  ) public payable {
    require(msg.value > 0, "Sent amount needs to be higher then zero");
    require(pendingDepositsBalances[_commitmentDigest] == 0, "This commitment is already deposited");

    DepositVerifierContract depositVerifierContract = DepositVerifierContract(
      address(depositVerifierContractAddress)
    );
    
    uint[3] memory depositVerifierContractInputs = [
      1,
      _commitmentDigest,
      msg.value
    ];

    bool response = depositVerifierContract.verifyProof(
      _depositProof.a,
      _depositProof.b,
      _depositProof.c,
      depositVerifierContractInputs
    );

    require(response, "Invalid deposit proof");

    pendingDepositsBalances[_commitmentDigest] += msg.value;
    
    emit Deposit(_commitmentDigest, msg.value);
  }

  struct PendingDepositFullfilment {
    Proof newRootDigestProof;
    uint newRootDigest;
    uint commitmentDigest;
  }

  function fullfilPendingDeposits(PendingDepositFullfilment[] memory _pendingDepositFullfilments) public {
    NewRootDigestVerifierContract newRootDigestVerifierContract = NewRootDigestVerifierContract(
      address(newRootDigestVerifierContractAddress)
    );

    for (uint256 index = 0; index < _pendingDepositFullfilments.length; index++) {
      uint[6] memory _newRootDigestVerifierContractInputs = [
        1,
        rootDigest,
        0,
        _pendingDepositFullfilments[index].newRootDigest,
        _pendingDepositFullfilments[index].commitmentDigest,
        currentIndex
      ];

      bool newRootDigestVerifierContractResponse = newRootDigestVerifierContract.verifyProof(
        _pendingDepositFullfilments[index].newRootDigestProof.a,
        _pendingDepositFullfilments[index].newRootDigestProof.b,
        _pendingDepositFullfilments[index].newRootDigestProof.c,
        _newRootDigestVerifierContractInputs
      );

      require(newRootDigestVerifierContractResponse, "Invalid new root digest proof");

      rootDigest = _pendingDepositFullfilments[index].newRootDigest;
      currentIndex++;
      pendingDepositsBalances[_pendingDepositFullfilments[index].commitmentDigest] = 0;
    }

    rootDigests[rootDigest] = true;
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