pragma circom 2.0.1;

include "./circomlib/circuits/poseidon.circom";
include "./circomlib/circuits/comparators.circom";
include "./circomlib/circuits/switcher.circom";

template VerifyMerkleTreeCommitmentLevel() {
  signal input levelDigest;
  signal input commitmentIndex;
  signal input currentIndex;
  signal input sibling;
  signal output nextLevelDigest;

  signal siblingOnTheLeft;

  component poseidon = Poseidon(2);
  component isEqual = IsEqual();
  component isSiblingEqualZero = IsZero();
  component isLevelDigestEqualZero = IsZero();
  component switcher = Switcher();

  var currentPowerOfTwo = 2 ** currentIndex;

  isEqual.in[0] <-- commitmentIndex & currentPowerOfTwo;
  isEqual.in[1] <-- currentPowerOfTwo;

  siblingOnTheLeft <== isEqual.out;

  switcher.L <== levelDigest;
  switcher.R <== sibling;

  switcher.sel <== siblingOnTheLeft;

  poseidon.inputs[0] <== switcher.outL;
  poseidon.inputs[1] <== switcher.outR;

  isSiblingEqualZero.in <== sibling;
  isLevelDigestEqualZero.in <== levelDigest;

  nextLevelDigest <-- isSiblingEqualZero.out || isLevelDigestEqualZero.out ? sibling + levelDigest : poseidon.out;
}

template VerifyMerkleTreeCommitment(nrOfLevels) {
  signal input rootDigest;
  signal input commitmentDigest;
  signal input commitmentIndex;
  signal input siblings[nrOfLevels];
  signal output isVerified;

  var i;

  component verifyLevel[nrOfLevels];
  for (i = 0; i < nrOfLevels; i++) {
    verifyLevel[i] = VerifyMerkleTreeCommitmentLevel();
    
    if (i == 0) {
      verifyLevel[i].levelDigest <== commitmentDigest;
    } else {
      verifyLevel[i].levelDigest <== verifyLevel[i - 1].nextLevelDigest;
    }

    verifyLevel[i].commitmentIndex <== commitmentIndex;
    verifyLevel[i].currentIndex <== i;
    verifyLevel[i].sibling <== siblings[i];
  }

  component isEqual = IsEqual();
  isEqual.in[0] <== verifyLevel[nrOfLevels - 1].nextLevelDigest;
  isEqual.in[1] <== rootDigest;

  isVerified <== isEqual.out;

  assert(isVerified);

  log(rootDigest);
  log(isVerified);
}
