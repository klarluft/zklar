// SPDX-License-Identifier: LGPL-3.0-only
// This file is LGPL3 Licensed
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import { DepositVerifierContract } from "./DepositVerifierContract.sol";
import { TransactionVerifierContract } from "./TransactionVerifierContract.sol";
import { UpdateVerifierContract } from "./UpdateVerifierContract.sol";

contract DepositContract {
  uint public rootDigest;
  mapping(uint => bool) public rootDigests;
  address public depositVerifierContractAddress;
  address public transactionVerifierContractAddress;
  address public updateVerifierContractAddress;
  mapping(uint => bool) public nullifiers;
  mapping(uint => uint256) public pendingDepositsBalances;

  event Deposit(uint indexed leaf_digest);

  constructor(
    address _depositVerifierContractAddress,
    address _transactionVerifierContractAddress,
    address _updateVerifierContractAddress
  ) {
    rootDigest = 0;
    rootDigests[0] = true;
    depositVerifierContractAddress = _depositVerifierContractAddress;
    transactionVerifierContractAddress = _transactionVerifierContractAddress;
    updateVerifierContractAddress = _updateVerifierContractAddress;
  }

  function deposit(
    DepositVerifierContract.Proof memory _proof,
    uint _leaf_digest,
    uint _output
  ) public payable {
    require(msg.value > 0, "Sent amount needs to be higher then zero");

    DepositVerifierContract depositContractVerifier = DepositVerifierContract(address(depositVerifierContractAddress));
    bool response = depositContractVerifier.verifyTx(_proof, [_leaf_digest, msg.value, _output]);

    require(response, "Invalid deposit proof");

    pendingDepositsBalances[_leaf_digest] += msg.value;
    
    emit Deposit(_leaf_digest);
  }

  function transact(
    TransactionVerifierContract.Proof memory _transactionProof,
    uint _transactionRootDigest,
    uint _transactionAcc0Nullifier,
    uint _transactionAcc1Nullifier,
    uint _transactionNew0LeafDigest,
    uint _transactionNew1LeafDigest,
    UpdateVerifierContract.Proof memory _deposit_proof,
    uint _depositOldRootDigest,
    uint _depositOldLeafDigest,
    uint _depositNewRootDigest,
    uint _depositNewLeafDigest,
    uint _depositLeafIndex,
    uint[32] _depositSiblings
  ) public {
    require(rootDigests[_transactionRootDigest] == true, "Invalid root digest");

    require(nullifiers[_transactionAcc0Nullifier] == false, "Nullifier for account 0 already exists");
    require(nullifiers[_transactionAcc1Nullifier] == false, "Nullifier for account 1 already exists");

    TransactionVerifierContract transactionVerifierContract = TransactionVerifierContract(
      address(transactionVerifierContractAddress)
    );
    UpdateVerifierContract updateVerifierContract = UpdateVerifierContract(
      address(updateVerifierContractAddress)
    );
    bool response = transactionVerifierContract.verifyTx(_transactionProof, [
      _transactionRootDigest,
      _transactionAcc0Nullifier,
      _transactionAcc1Nullifier,
      _transactionNew0LeafDigest,
      _transactionNew1LeafDigest
    ]);

    require(response, "Invalid deposit proof");

    bool updateResponse = updateVerifierContract.verifyTx(_deposit_proof, [
      uint _depositOldRootDigest,
      uint _depositOldLeafDigest,
      uint _depositNewRootDigest,
      uint _depositNewLeafDigest,
      uint _depositLeafIndex,
      uint[32] _depositSiblings
    ]);
  }
}