pragma circom 2.0.1;

include "./verify-merkle-tree-commitment.circom";

template VerifyNewRootDigest(nrOfLevels) {
  signal input oldRootDigest;
  signal input oldCommitmentDigest;
  signal input newRootDigest;
  signal input newCommitmentDigest;
  signal input commitmentIndex;
  signal input siblings[nrOfLevels];
  signal output isVerified;

  var i;

  component verifyMerkleTreeCommitment[2];
  
  verifyMerkleTreeCommitment[0] = VerifyMerkleTreeCommitment(nrOfLevels);
  verifyMerkleTreeCommitment[0].rootDigest <== oldRootDigest;
  verifyMerkleTreeCommitment[0].commitmentDigest <== oldCommitmentDigest;
  verifyMerkleTreeCommitment[0].commitmentIndex <== commitmentIndex;
  for(i = 0; i < nrOfLevels; i++) {
    verifyMerkleTreeCommitment[0].siblings[i] <== siblings[i];
  }

  verifyMerkleTreeCommitment[1] = VerifyMerkleTreeCommitment(nrOfLevels);
  verifyMerkleTreeCommitment[1].rootDigest <== newRootDigest;
  verifyMerkleTreeCommitment[1].commitmentDigest <== newCommitmentDigest;
  verifyMerkleTreeCommitment[1].commitmentIndex <== commitmentIndex;
  for(i = 0; i < nrOfLevels; i++) {
    verifyMerkleTreeCommitment[1].siblings[i] <== siblings[i];
  }

  isVerified <-- verifyMerkleTreeCommitment[0].isVerified && verifyMerkleTreeCommitment[1].isVerified;

  assert(isVerified);
  log(isVerified);
}

component main { public [
  oldRootDigest,
  oldCommitmentDigest,
  newRootDigest,
  newCommitmentDigest,
  commitmentIndex
] } = VerifyNewRootDigest(42);
