pragma circom 2.1.9;

include "./verify-new-commitment.circom";

component main {public [commitmentDigest, amount]} = VerifyNewCommitment();
