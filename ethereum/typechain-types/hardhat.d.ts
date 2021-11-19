/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { ethers } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";

import * as Contracts from ".";

declare module "hardhat/types/runtime" {
  interface HardhatEthersHelpers extends HardhatEthersHelpersBase {
    getContractFactory(
      name: "DepositContract",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.DepositContract__factory>;
    getContractFactory(
      name: "BN256G2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BN256G2__factory>;
    getContractFactory(
      name: "DepositVerifierContract",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.DepositVerifierContract__factory>;
    getContractFactory(
      name: "BN256G2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BN256G2__factory>;
    getContractFactory(
      name: "TransactionVerifierContract",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.TransactionVerifierContract__factory>;
    getContractFactory(
      name: "BN256G2",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.BN256G2__factory>;
    getContractFactory(
      name: "UpdateVerifierContract",
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<Contracts.UpdateVerifierContract__factory>;

    getContractAt(
      name: "DepositContract",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.DepositContract>;
    getContractAt(
      name: "BN256G2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BN256G2>;
    getContractAt(
      name: "DepositVerifierContract",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.DepositVerifierContract>;
    getContractAt(
      name: "BN256G2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BN256G2>;
    getContractAt(
      name: "TransactionVerifierContract",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.TransactionVerifierContract>;
    getContractAt(
      name: "BN256G2",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.BN256G2>;
    getContractAt(
      name: "UpdateVerifierContract",
      address: string,
      signer?: ethers.Signer
    ): Promise<Contracts.UpdateVerifierContract>;

    // default types
    getContractFactory(
      name: string,
      signerOrOptions?: ethers.Signer | FactoryOptions
    ): Promise<ethers.ContractFactory>;
    getContractFactory(
      abi: any[],
      bytecode: ethers.utils.BytesLike,
      signer?: ethers.Signer
    ): Promise<ethers.ContractFactory>;
    getContractAt(
      nameOrAbi: string | any[],
      address: string,
      signer?: ethers.Signer
    ): Promise<ethers.Contract>;
  }
}