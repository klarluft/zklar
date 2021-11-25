pragma circom 2.0.1;

include "./circomlib/circuits/poseidon.circom";
include "./circomlib/circuits/comparators.circom";

template VerifyOwnership() {
  signal input nullifier;
  signal input commitmentDigest;
  signal input nonce;
  signal input amount;
  signal input ownerDigest;
  signal input ownerDigestPreimage[2];
  signal output isVerified;

  signal isCommitmentDigestVerified;
  signal isOwnerDigestVerified;
  signal isNullifierVerified;

  component poseidon[3];
  component isEqual[3];

  // Check commitment digest
  poseidon[0] = Poseidon(3);
  poseidon[0].inputs[0] <== nonce;
  poseidon[0].inputs[1] <== amount;
  poseidon[0].inputs[2] <== ownerDigest;

  isEqual[0] = IsEqual();
  isEqual[0].in[0] <== commitmentDigest;
  isEqual[0].in[1] <== poseidon[0].out;

  isCommitmentDigestVerified <== isEqual[0].out;

  assert(isCommitmentDigestVerified);

  // Check owner digest
  poseidon[1] = Poseidon(2);
  poseidon[1].inputs[0] <== ownerDigestPreimage[0];
  poseidon[1].inputs[1] <== ownerDigestPreimage[1];

  isEqual[1] = IsEqual();
  isEqual[1].in[0] <== ownerDigest;
  isEqual[1].in[1] <== poseidon[1].out;

  isOwnerDigestVerified <== isEqual[1].out;

  assert(isOwnerDigestVerified);

  // Check nullifier
  poseidon[2] = Poseidon(3);
  poseidon[2].inputs[0] <== commitmentDigest;
  poseidon[2].inputs[1] <== ownerDigestPreimage[0];
  poseidon[2].inputs[2] <== ownerDigestPreimage[1];

  isEqual[2] = IsEqual();
  isEqual[2].in[0] <== nullifier;
  isEqual[2].in[1] <== poseidon[2].out;

  isNullifierVerified <== isEqual[2].out;

  assert(isNullifierVerified);

  isVerified <-- isCommitmentDigestVerified && isOwnerDigestVerified && isNullifierVerified;
}
