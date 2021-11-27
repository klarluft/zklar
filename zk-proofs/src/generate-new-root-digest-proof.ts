import fs from "fs";
import path from "path";
import { generateProof } from "./generate-proof";
import { generateWitness } from "./generate-witness";

interface Props {
  input: Record<string, any>;
  webAssemblyFilePath: string;
  zkeyFilePath: string;
}

export async function generateNewRootDigestProof({ input, webAssemblyFilePath, zkeyFilePath }: Props) {
  const webAssemblyBuffer = await fs.promises.readFile(webAssemblyFilePath);
  const zkeyBuffer = await fs.promises.readFile(zkeyFilePath);
  const witnessBuffer = await generateWitness({ input, webAssemblyBuffer });
  const { proof, publicSignals } = await generateProof({ witnessBuffer, zkeyBuffer });

  return { proof, publicSignals };
}
