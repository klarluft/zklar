import { generateWitness } from "./generate-witness";
import { snarkjs } from "./snarkjs";

interface Props {
  witnessBuffer: Uint8Array;
  zkeyBuffer: Buffer;
}

export async function generateProof({ witnessBuffer, zkeyBuffer }: Props) {
  const { proof, publicSignals } = await snarkjs.groth16.prove(new Uint8Array(zkeyBuffer), witnessBuffer);

  return { proof, publicSignals };
}
