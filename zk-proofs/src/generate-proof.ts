import fs from "fs";
import { snarkjs } from "./snarkjs";
import { builder } from "./witness-calculator";

interface GenerateCircomWitnessProps {
  input: Record<string, any>;
  webAssemblyBuffer: ArrayBuffer;
}

async function generateCircomWitness({ input, webAssemblyBuffer }: GenerateCircomWitnessProps): Promise<Uint8Array> {
  const witnessCalculator = await builder({ code: webAssemblyBuffer });
  const witnessBuffer = await witnessCalculator.calculateWTNSBin(input, false);

  return witnessBuffer;
}

interface GenerateCircomProofProps {
  witnessBuffer: Uint8Array;
  zkeyBuffer: Buffer;
}

async function generateCircomProof({ witnessBuffer, zkeyBuffer }: GenerateCircomProofProps) {
  const { proof, publicSignals } = await snarkjs.groth16.prove(new Uint8Array(zkeyBuffer), witnessBuffer);

  return { proof, publicSignals };
}

interface GenerateProofProps {
  input: Record<string, any>;
  webAssemblyFilePath: string;
  zkeyFilePath: string;
}

export async function generateProof({ input, webAssemblyFilePath, zkeyFilePath }: GenerateProofProps) {
  const webAssemblyBuffer = await fs.promises.readFile(webAssemblyFilePath);
  const zkeyBuffer = await fs.promises.readFile(zkeyFilePath);
  const witnessBuffer = await generateCircomWitness({ input, webAssemblyBuffer });
  const { proof, publicSignals } = await generateCircomProof({ witnessBuffer, zkeyBuffer });

  return { proof, publicSignals };
}
