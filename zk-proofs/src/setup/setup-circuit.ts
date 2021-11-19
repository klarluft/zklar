import fs from "fs";
import path from "path";
import { CompilationArtifacts, SetupKeypair, ZoKratesProvider } from "zokrates-js";

interface SetupCircuitProps {
  provider: ZoKratesProvider;
  filename: string;
  contractName: string;
}

export interface SetupCircuitReturn {
  artifacts: CompilationArtifacts;
  keypair: SetupKeypair;
  verifier: string;
}

export async function setupCircuit({
  provider,
  filename,
  contractName,
}: SetupCircuitProps): Promise<SetupCircuitReturn> {
  const source = (await fs.promises.readFile(path.join(__dirname, "../circuits", filename))).toString();
  const artifacts = provider.compile(source);
  const keypair = provider.setup(artifacts.program);
  let verifier = provider.exportSolidityVerifier(keypair.vk);

  /**
   * For some reason verifier code from Zokrates puts pragma in the middle of the file.
   * That makes causes solidity compiler to fail when importing this contract.
   */
  const pragmaLine = "pragma solidity ^0.8.0;";

  const verifierParts = verifier.split(pragmaLine);
  verifier = verifierParts[0] + pragmaLine + verifierParts[1] + verifierParts[2];

  /**
   * Since we generate multiple different Zokrates contracts we need to differentiate their names.
   * Different names allow for better typechain integration
   */
  const contractNameLine = "contract Verifier";
  verifier = verifier.replace(contractNameLine, `contract ${contractName}`);

  return { artifacts, keypair, verifier };
}
