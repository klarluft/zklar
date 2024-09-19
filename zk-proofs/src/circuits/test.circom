pragma circom 2.1.0;

include "./circomlib/circuits/poseidon.circom";
include "./circomlib/circuits/comparators.circom";

template Test() {
  signal input digest;
  signal input preimage;
  signal output isVerified;

  component poseidon;
  component isEqual;

  // Check commitment digest
  poseidon = Poseidon(1);
  poseidon.inputs[0] <== preimage;

  isEqual = IsEqual();
  isEqual.in[0] <== digest;
  isEqual.in[1] <== poseidon.out;

  isVerified <== isEqual.out;

  assert(isVerified);
}

component main { public [
  digest
] } = Test();
