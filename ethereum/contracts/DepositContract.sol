// SPDX-License-Identifier: LGPL-3.0-only
// This file is LGPL3 Licensed
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import { DepositVerifierContract } from "./DepositVerifierContract.sol";

contract DepositContract {
  address public depositContractAddress;
  mapping(uint => uint256) public pendingDepositsBalances;

  event Deposit(uint indexed leaf_digest);

  constructor(address _depositContractAddress) {
    depositContractAddress = _depositContractAddress;
  }

  function deposit(
    DepositVerifierContract.Proof memory proof,
    uint leaf_digest,
    uint output
  ) public payable {
    require(msg.value > 0, "Sent amount needs to be higher then zero");

    DepositVerifierContract depositContractVerifier = DepositVerifierContract(address(depositContractAddress));
    bool response = depositContractVerifier.verifyTx(proof, [leaf_digest, msg.value, output]);

    require(response, "Invalid deposit proof");

    pendingDepositsBalances[leaf_digest] += msg.value;
    
    emit Deposit(leaf_digest);
  }
}