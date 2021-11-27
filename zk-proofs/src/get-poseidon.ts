import { buildPoseidon } from "circomlibjs";

export type Poseidon = (input: (bigint | number)[]) => bigint;

export async function getPoseidon(): Promise<Poseidon> {
  const originalPoseidon = await buildPoseidon();

  return (input: (bigint | number)[]) => originalPoseidon.F.toObject(originalPoseidon(input));
}
