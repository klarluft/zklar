import { initialize } from "zokrates-js/node";
import { proveCircuit } from "../prove-circuit";
import { numToZok } from "../utils/num-to-zok";
import pkJSON from "../setup/deposit-circuit/pk.json";
import programJSON from "../setup/deposit-circuit/program.json";
import abiJSON from "../setup/deposit-circuit/abi.json";
import { Proof, ProofPoints } from "zokrates-js";

interface Props {
  commitmentDigest: BigInt;
  nonce: BigInt;
  amount: number;
  ownerDigest: BigInt;
}

export interface GetDepositProofReturn {
  proof: ProofPoints;
  inputs: string[];
}

export async function getDepositProof({
  commitmentDigest,
  nonce,
  amount,
  ownerDigest,
}: Props): Promise<GetDepositProofReturn> {
  const provider = await initialize();

  const params = [numToZok(commitmentDigest), numToZok(nonce), numToZok(amount), numToZok(ownerDigest)];

  const { proof } = await proveCircuit({
    provider,
    params,
    artifacts: { program: new Uint8Array(Object.values(programJSON.program)), abi: abiJSON.abi },
    keypairPK: new Uint8Array(Object.values(pkJSON.pk)),
  });

  return proof;
}
