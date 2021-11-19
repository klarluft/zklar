import fs from "fs";
import path from "path";
import { ZoKratesProvider } from "zokrates-js";
import { memo } from "../memo";
import { setupCircuit } from "./setup-circuit";

interface Props {
  provider: ZoKratesProvider;
}

export async function setupDepositCircuit({ provider }: Props) {
  const depositCircuit = await memo("depositCircuit", () =>
    setupCircuit({ provider, filename: "deposit-proof.zok", contractName: "DepositVerifierContract" })
  );

  await fs.promises.writeFile(
    path.join(__dirname, "./deposit-circuit", `pk.json`),
    JSON.stringify({ pk: depositCircuit.keypair.pk }),
    "utf-8"
  );

  await fs.promises.writeFile(
    path.join(__dirname, "./deposit-circuit", `vk.json`),
    JSON.stringify({ vk: depositCircuit.keypair.vk }),
    "utf-8"
  );

  await fs.promises.writeFile(
    path.join(__dirname, "./deposit-circuit", `abi.json`),
    JSON.stringify({ abi: depositCircuit.artifacts.abi }),
    "utf-8"
  );

  await fs.promises.writeFile(
    path.join(__dirname, "./deposit-circuit", `program.json`),
    JSON.stringify({ program: depositCircuit.artifacts.program }),
    "utf-8"
  );

  await fs.promises.writeFile(
    path.join(__dirname, "../../../ethereum/contracts", `DepositVerifierContract.sol`),
    depositCircuit.verifier,
    "utf-8"
  );

  return depositCircuit;
}
