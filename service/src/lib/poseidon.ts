import { getPoseidon, Poseidon } from 'zk-proofs';

export let poseidon: Poseidon;

export const setupPoseidon = async () => {
  poseidon = await getPoseidon();
};
