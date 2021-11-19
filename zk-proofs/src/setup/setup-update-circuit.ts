import fs from "fs";
import path from "path";
import { ZoKratesProvider } from "zokrates-js";
import { memo } from "../memo";
import { setupCircuit } from "./setup-circuit";

interface Props {
  provider: ZoKratesProvider;
}

export async function setupUpdateCircuit({ provider }: Props) {
  const updateCircuit = await memo("updateCircuit", () =>
    setupCircuit({ provider, filename: "update-proof.zok", contractName: "UpdateVerifierContract" })
  );

  await fs.promises.writeFile(
    path.join(__dirname, "../../ethereum/contracts", `UpdateVerifierContract.sol`),
    updateCircuit.verifier,
    "utf-8"
  );

  return updateCircuit;
}
