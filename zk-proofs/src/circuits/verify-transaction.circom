pragma circom 2.0.1;

include "./verify-ownership.circom";
include "./verify-merkle-tree-commitment.circom";
include "./verify-new-commitment.circom";

template VerifyTransaction(nrOfLevels) {
  signal input rootDigest;

  signal input commitment0Nullifier;
  signal input commitment0Digest;
  signal input commitment0Nonce;
  signal input commitment0Amount;
  signal input commitment0OwnerDigest;
  signal input commitment0OwnerDigestPreimage[2];
  signal input commitment0Index;
  signal input commitment0Siblings[nrOfLevels];
  
  signal input commitment1Nullifier;
  signal input commitment1Digest;
  signal input commitment1Nonce;
  signal input commitment1Amount;
  signal input commitment1OwnerDigest;
  signal input commitment1OwnerDigestPreimage[2];
  signal input commitment1Index;
  signal input commitment1Siblings[nrOfLevels];

  signal input newCommitment0Digest;
  signal input newCommitment0Nonce;
  signal input newCommitment0Amount;
  signal input newCommitment0OwnerDigest;

  signal input newCommitment1Digest;
  signal input newCommitment1Nonce;
  signal input newCommitment1Amount;
  signal input newCommitment1OwnerDigest;

  signal output isVerified;

  component verifyOwnership[2];
  component verifyMerkleTreeCommitment[2];
  component verifyNewCommitment[2];
  component isAmountEqual;

  var i;

  // Check committment 0 ownership
  verifyOwnership[0] = VerifyOwnership();
  verifyOwnership[0].nullifier <== commitment0Nullifier;
  verifyOwnership[0].commitmentDigest <== commitment0Digest;
  verifyOwnership[0].nonce <== commitment0Nonce;
  verifyOwnership[0].amount <== commitment0Amount;
  verifyOwnership[0].ownerDigest <== commitment0OwnerDigest;
  verifyOwnership[0].ownerDigestPreimage[0] <== commitment0OwnerDigestPreimage[0];
  verifyOwnership[0].ownerDigestPreimage[1] <== commitment0OwnerDigestPreimage[1];
  assert(verifyOwnership[0].isVerified);

  // Check committment 1 ownership
  verifyOwnership[1] = VerifyOwnership();
  verifyOwnership[1].nullifier <== commitment1Nullifier;
  verifyOwnership[1].commitmentDigest <== commitment1Digest;
  verifyOwnership[1].nonce <== commitment1Nonce;
  verifyOwnership[1].amount <== commitment1Amount;
  verifyOwnership[1].ownerDigest <== commitment1OwnerDigest;
  verifyOwnership[1].ownerDigestPreimage[0] <== commitment1OwnerDigestPreimage[0];
  verifyOwnership[1].ownerDigestPreimage[1] <== commitment1OwnerDigestPreimage[1];
  assert(verifyOwnership[1].isVerified);

  // Check commitment 0 merkle tree membership
  verifyMerkleTreeCommitment[0] = VerifyMerkleTreeCommitment(nrOfLevels);
  verifyMerkleTreeCommitment[0].rootDigest <== rootDigest;
  verifyMerkleTreeCommitment[0].commitmentDigest <== commitment0Digest;
  verifyMerkleTreeCommitment[0].commitmentIndex <== commitment0Index;
  for(i = 0; i < nrOfLevels; i++) {
    verifyMerkleTreeCommitment[0].siblings[i] <== commitment0Siblings[i];
  }
  assert(verifyMerkleTreeCommitment[0].isVerified);

  // Check commitment 1 merkle tree membership
  verifyMerkleTreeCommitment[1] = VerifyMerkleTreeCommitment(nrOfLevels);
  verifyMerkleTreeCommitment[1].rootDigest <== rootDigest;
  verifyMerkleTreeCommitment[1].commitmentDigest <== commitment1Digest;
  verifyMerkleTreeCommitment[1].commitmentIndex <== commitment1Index;
  for(i = 0; i < nrOfLevels; i++) {
    verifyMerkleTreeCommitment[1].siblings[i] <== commitment1Siblings[i];
  }
  assert(verifyMerkleTreeCommitment[1].isVerified);

  // Check new commitment 0
  verifyNewCommitment[0] = VerifyNewCommitment();
  verifyNewCommitment[0].commitmentDigest <== newCommitment0Digest;
  verifyNewCommitment[0].nonce <== newCommitment0Nonce;
  verifyNewCommitment[0].amount <== newCommitment0Amount;
  verifyNewCommitment[0].ownerDigest <== newCommitment0OwnerDigest;
  assert(verifyNewCommitment[0].isVerified);

  // Check new commitment 1
  verifyNewCommitment[1] = VerifyNewCommitment();
  verifyNewCommitment[1].commitmentDigest <== newCommitment1Digest;
  verifyNewCommitment[1].nonce <== newCommitment1Nonce;
  verifyNewCommitment[1].amount <== newCommitment1Amount;
  verifyNewCommitment[1].ownerDigest <== newCommitment1OwnerDigest;
  assert(verifyNewCommitment[1].isVerified);

  // Check amount balance
  isAmountEqual = IsEqual();
  isAmountEqual.in[0] <== commitment0Amount + commitment1Amount;
  isAmountEqual.in[1] <== newCommitment0Amount + newCommitment1Amount;
  assert(isAmountEqual.out);

  isVerified <-- verifyOwnership[0].isVerified &&
    verifyOwnership[1].isVerified &&
    verifyMerkleTreeCommitment[0].isVerified &&
    verifyMerkleTreeCommitment[1].isVerified &&
    verifyNewCommitment[0].isVerified &&
    verifyNewCommitment[1].isVerified &&
    isAmountEqual.out;
  
  assert(isVerified);

  log(isVerified);
}

component main { public [
  rootDigest,
  commitment0Nullifier,
  commitment1Nullifier,
  newCommitment0Digest,
  newCommitment1Digest
] } = VerifyTransaction(42);
