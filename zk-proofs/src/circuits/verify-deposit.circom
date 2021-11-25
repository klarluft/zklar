pragma circom 2.0.1;

include "./verify-new-commitment.circom";

component main {public [commitmentDigest, amount]} = VerifyNewCommitment();
