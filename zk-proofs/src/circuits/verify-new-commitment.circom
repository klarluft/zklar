pragma circom 2.0.1;

include "./circomlib/circuits/poseidon.circom";
include "./circomlib/circuits/comparators.circom";

template VerifyNewCommitment() {
  signal input commitmentDigest;
  signal input nonce;
  signal input amount;
  signal input ownerDigest;
  signal output isVerified;

  component poseidon = Poseidon(3);
  component isEqual = IsEqual();

  poseidon.inputs[0] <== nonce;
  poseidon.inputs[1] <== amount;
  poseidon.inputs[2] <== ownerDigest;

  isEqual.in[0] <== commitmentDigest;
  isEqual.in[1] <== poseidon.out;

  isVerified <== isEqual.out;

  assert(isVerified == 1);
}
