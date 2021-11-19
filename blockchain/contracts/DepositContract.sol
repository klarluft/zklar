// SPDX-License-Identifier: LGPL-3.0-only
// This file is LGPL3 Licensed
pragma solidity ^0.8.0;

import { Verifier } from "./DepositVerifierContract.sol";

contract DepositContract {
  address public depositContractAddress;

  constructor(address _depositContractAddress) {
    depositContractAddress = _depositContractAddress;
  }

  function deposit(
    Verifier.Proof memory proof,
    uint[3] memory input
  ) public view returns (bool r) {
    Verifier depositContractVerifier = Verifier(address(depositContractAddress));

    return depositContractVerifier.verifyTx(proof, input);
  }
}