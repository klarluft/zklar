import { CompilationArtifacts, ZoKratesProvider } from "zokrates-js";

export interface ProveCircuitProps {
  provider: ZoKratesProvider;
  artifacts: CompilationArtifacts;
  keypairPK: Uint8Array;
  params: unknown[];
}

export async function proveCircuit({ provider, artifacts, keypairPK, params }: ProveCircuitProps) {
  const { witness } = provider.computeWitness(artifacts, params);

  const proof = provider.generateProof(artifacts.program, witness, keypairPK);

  return { proof };
}
