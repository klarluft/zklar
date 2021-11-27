import { builder } from "./witness-calculator";

interface Props {
  input: Record<string, any>;
  webAssemblyBuffer: ArrayBuffer;
}

export async function generateWitness({ input, webAssemblyBuffer }: Props): Promise<Uint8Array> {
  const witnessCalculator = await builder({ code: webAssemblyBuffer });
  const witnessBuffer = await witnessCalculator.calculateWTNSBin(input, false);

  return witnessBuffer;
}
