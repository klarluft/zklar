import fs from "fs";
import path from "path";
import { ZoKratesProvider } from "zokrates-js";
import { memo } from "../memo";
import { setupCircuit } from "./setup-circuit";

interface Props {
  provider: ZoKratesProvider;
}

export async function setupTransactionCircuit({ provider }: Props) {
  const transactionCircuit = await memo("transactionCircuit", () =>
    setupCircuit({ provider, filename: "transaction-2-2-proof.zok", contractName: "TransactionVerifierContract" })
  );

  await fs.promises.writeFile(
    path.join(__dirname, "../../ethereum/contracts", `TransactionVerifierContract.sol`),
    transactionCircuit.verifier,
    "utf-8"
  );

  return transactionCircuit;
}
