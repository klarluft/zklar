import fs from "fs";
import path from "path";
import { ZoKratesProvider } from "zokrates-js";
import { memo } from "../memo";
import { setupCircuit } from "./setup-circuit";

interface Props {
  provider: ZoKratesProvider;
}

const DIRECTORY_NAME = "transaction-circuit";
const CONTRACT_NAME = "TransactionVerifierContract";
const CIRCUIT_FILENAME = "transaction-2-2-proof.zok";
const MEMO_KEY = "transactionCircuit";

export async function setupTransactionCircuit({ provider }: Props) {
  const depositCircuit = await memo(MEMO_KEY, () =>
    setupCircuit({ provider, filename: CIRCUIT_FILENAME, contractName: CONTRACT_NAME })
  );

  await fs.promises.writeFile(
    path.join(__dirname, DIRECTORY_NAME, `pk.json`),
    JSON.stringify({ pk: depositCircuit.keypair.pk }),
    "utf-8"
  );

  await fs.promises.writeFile(
    path.join(__dirname, DIRECTORY_NAME, `vk.json`),
    JSON.stringify({ vk: depositCircuit.keypair.vk }),
    "utf-8"
  );

  await fs.promises.writeFile(
    path.join(__dirname, DIRECTORY_NAME, `abi.json`),
    JSON.stringify({ abi: depositCircuit.artifacts.abi }),
    "utf-8"
  );

  await fs.promises.writeFile(
    path.join(__dirname, DIRECTORY_NAME, `program.json`),
    JSON.stringify({ program: depositCircuit.artifacts.program }),
    "utf-8"
  );

  await fs.promises.writeFile(
    path.join(__dirname, "../../../ethereum/contracts", `${CONTRACT_NAME}.sol`),
    depositCircuit.verifier,
    "utf-8"
  );

  return depositCircuit;
}
