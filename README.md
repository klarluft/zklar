# zKlar

[![zklar](/zklar-logo.png)](https://zklar.com)

**[zKlar](https://zklar.com) - Private, fast and cheap Ethereum transactions by [Klarluft](https://klarluft.com)**

---

_Disclaimer: This repository is very much Work in Progress_

---

The most important pieces:

- [Zero-knowledge circuits](./zk-proofs/src/circuits)
- [Witness calculator](./zk-proofs/src/witness-calculator.ts)
- [Ethereum contracts](./ethereum/contracts)
- [Tests for Ethereum contract](./ethereum/test/ZKlarContract.spec.ts)
- [Example transaction proof test](./service/src/lib/verifyTransactionProof.spec.ts)

---

![graph](/graph.png)

---

## Download ptau file

https://github.com/iden3/snarkjs#7-prepare-phase-2

nr 15 should be enough since it supports up to 32k constraints.

```
curl -O https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau
```

## Circuit info

We're going with merkle tree of 2^42 commitments as this is more then 1000 commitments every second for 100 years.
It seems that this is going to be much much easier to manage then proofs for 2^256 commitments.

```
const secondsIn100Years = 100*365*24*60*60;
const nrOfTransactionsPerSecond = 1000;
const maxNrOfCommitments = Math.pow(2, 42);

maxNrOfCommitments > secondsIn100Years * nrOfTransactionsPerSecond;

// maxNrOfCommitments => 4'398'046'511'104 (~4 Trillion)
```

```
snarkjs r1cs info zk-proofs/src/circuits/verify-deposit/verify-deposit.r1cs
[INFO]  snarkJS: Curve: bn-128
[INFO]  snarkJS: # of Wires: 268
[INFO]  snarkJS: # of Constraints: 263
[INFO]  snarkJS: # of Private Inputs: 2
[INFO]  snarkJS: # of Public Inputs: 2
[INFO]  snarkJS: # of Labels: 1392
[INFO]  snarkJS: # of Outputs: 1

snarkjs r1cs info zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest.r1cs
[INFO]  snarkJS: Curve: bn-128
[INFO]  snarkJS: # of Wires: 21053
[INFO]  snarkJS: # of Constraints: 20752
[INFO]  snarkJS: # of Private Inputs: 42
[INFO]  snarkJS: # of Public Inputs: 5
[INFO]  snarkJS: # of Labels: 95157
[INFO]  snarkJS: # of Outputs: 1

snarkjs r1cs info zk-proofs/src/circuits/verify-transaction/verify-transaction.r1cs
[INFO]  snarkJS: Curve: bn-128
[INFO]  snarkJS: # of Wires: 23181
[INFO]  snarkJS: # of Constraints: 22816
[INFO]  snarkJS: # of Private Inputs: 104
[INFO]  snarkJS: # of Public Inputs: 5
[INFO]  snarkJS: # of Labels: 105799
[INFO]  snarkJS: # of Outputs: 1
```

## Verify Deposit

```
circom zk-proofs/src/circuits/verify-deposit.circom \
  --wasm \
  --r1cs \
  --sym \
  -o zk-proofs/src/circuits/verify-deposit && \
\
snarkjs groth16 setup \
  zk-proofs/src/circuits/verify-deposit/verify-deposit.r1cs \
  powersOfTau28_hez_final_15.ptau \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_0000.zkey && \
\
snarkjs zkey contribute \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_0000.zkey \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_0001.zkey \
  --name="1st Contributor Name" \
  -v \
  -e="Some random entropy" && \
\
snarkjs zkey beacon \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_0001.zkey \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_final.zkey \
  0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f \
  10 \
  -n="Final Beacon phase2" && \
\
snarkjs zkey export verificationkey \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_final.zkey \
  zk-proofs/src/circuits/verify-deposit/verification_key.json && \
\
snarkjs zkey export solidityverifier \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_final.zkey \
  zk-proofs/src/circuits/verify-deposit/verify-deposit.sol && \
\
cp \
  zk-proofs/src/circuits/verify-deposit/verify-deposit.sol \
  ethereum/contracts/DepositVerifierContract.sol && \
\
sed -i "" 's/contract Verifier {/contract DepositVerifierContract {/' \
  ethereum/contracts/DepositVerifierContract.sol && \
\
cp \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_final.zkey \
  ethereum/test/ && \
\
cp \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_final.zkey \
  service/src/proofs/ && \
\
cp \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_js/verify-deposit.wasm \
  ethereum/test/ && \
\
cp \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_js/verify-deposit.wasm \
  service/src/proofs/ && \
\
cp \
  zk-proofs/src/circuits/verify-deposit/verification_key.json \
  service/src/proofs/verify-deposit-verification-key.json
```

```
touch zk-proofs/src/circuits/verify-deposit/verify-deposit_js/input.json

yarn workspace zk-proofs get-verify-deposit-input

code zk-proofs/src/circuits/verify-deposit/verify-deposit_js/input.json

// Copy the json to input file

node \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_js/generate_witness.js \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_js/verify-deposit.wasm \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_js/input.json \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_js/witness.wtns

snarkjs groth16 prove \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_0001.zkey \
  zk-proofs/src/circuits/verify-deposit/verify-deposit_js/witness.wtns \
  zk-proofs/src/circuits/verify-deposit/proof.json \
  zk-proofs/src/circuits/verify-deposit/public.json

snarkjs groth16 verify \
  zk-proofs/src/circuits/verify-deposit/verification_key.json \
  zk-proofs/src/circuits/verify-deposit/public.json \
  zk-proofs/src/circuits/verify-deposit/proof.json

snarkjs zkey export soliditycalldata \
  zk-proofs/src/circuits/verify-deposit/public.json \
  zk-proofs/src/circuits/verify-deposit/proof.json
```

## Verify New Root Digest

```
circom zk-proofs/src/circuits/verify-new-root-digest.circom \
  --wasm \
  --r1cs \
  --sym \
  -o zk-proofs/src/circuits/verify-new-root-digest && \
\
snarkjs groth16 setup \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest.r1cs \
  powersOfTau28_hez_final_15.ptau \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_0000.zkey && \
\
snarkjs zkey contribute \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_0000.zkey \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_0001.zkey \
  --name="1st Contributor Name" \
  -v \
  -e="Some random entropy" && \
\
snarkjs zkey beacon \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_0001.zkey \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_final.zkey \
  0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f \
  10 \
  -n="Final Beacon phase2" && \
\
snarkjs zkey export verificationkey \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_final.zkey \
  zk-proofs/src/circuits/verify-new-root-digest/verification_key.json && \
\
snarkjs zkey export solidityverifier \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_final.zkey \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest.sol && \
\
cp \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest.sol \
  ethereum/contracts/NewRootDigestVerifierContract.sol && \
\
sed -i "" 's/contract Verifier {/contract NewRootDigestVerifierContract {/' \
  ethereum/contracts/NewRootDigestVerifierContract.sol && \
\
cp \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_final.zkey \
  ethereum/test/ && \
\
cp \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_final.zkey \
  service/src/proofs/ && \
\
cp \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_js/verify-new-root-digest.wasm \
  ethereum/test/ && \
\
cp \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_js/verify-new-root-digest.wasm \
  service/src/proofs/ && \
\
cp \
  zk-proofs/src/circuits/verify-new-root-digest/verification_key.json \
  service/src/proofs/verify-new-root-digest-verification-key.json
```

```
touch zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_js/input.json

yarn workspace zk-proofs get-verify-new-root-digest-input

code zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_js/input.json

// Copy the json to input file

node \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_js/generate_witness.js \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_js/verify-new-root-digest.wasm \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_js/input.json \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_js/witness.wtns

snarkjs groth16 prove \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_0001.zkey \
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest_js/witness.wtns \
  zk-proofs/src/circuits/verify-new-root-digest/proof.json \
  zk-proofs/src/circuits/verify-new-root-digest/public.json

snarkjs groth16 verify \
  zk-proofs/src/circuits/verify-new-root-digest/verification_key.json \
  zk-proofs/src/circuits/verify-new-root-digest/public.json \
  zk-proofs/src/circuits/verify-new-root-digest/proof.json

snarkjs zkey export soliditycalldata \
  zk-proofs/src/circuits/verify-new-root-digest/public.json \
  zk-proofs/src/circuits/verify-new-root-digest/proof.json
```

## Verify Transaction

```
circom zk-proofs/src/circuits/verify-transaction.circom \
  --wasm \
  --r1cs \
  --sym \
  -o zk-proofs/src/circuits/verify-transaction && \
\
snarkjs groth16 setup \
  zk-proofs/src/circuits/verify-transaction/verify-transaction.r1cs \
  powersOfTau28_hez_final_15.ptau \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_0000.zkey && \
\
snarkjs zkey contribute \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_0000.zkey \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_0001.zkey \
  --name="1st Contributor Name" \
  -v \
  -e="Some random entropy" && \
\
snarkjs zkey beacon \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_0001.zkey \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_final.zkey \
  0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f \
  10 \
  -n="Final Beacon phase2" && \
\
snarkjs zkey export verificationkey \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_final.zkey \
  zk-proofs/src/circuits/verify-transaction/verification_key.json && \
\
snarkjs zkey export solidityverifier \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_final.zkey \
  zk-proofs/src/circuits/verify-transaction/verify-transaction.sol && \
\
cp \
  zk-proofs/src/circuits/verify-transaction/verify-transaction.sol \
  ethereum/contracts/TransactionVerifierContract.sol && \
\
sed -i "" 's/contract Verifier {/contract TransactionVerifierContract {/' \
  ethereum/contracts/TransactionVerifierContract.sol && \
\
cp \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_final.zkey \
  ethereum/test/ && \
\
cp \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_final.zkey \
  service/src/proofs/ && \
\
cp \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_js/verify-transaction.wasm \
  ethereum/test/ && \
\
cp \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_js/verify-transaction.wasm \
  service/src/proofs/ && \
\
cp \
  zk-proofs/src/circuits/verify-transaction/verification_key.json \
  service/src/proofs/verify-transaction-verification-key.json
```

```
touch zk-proofs/src/circuits/verify-transaction/verify-transaction_js/input.json

yarn workspace zk-proofs get-verify-transaction-input

code zk-proofs/src/circuits/verify-transaction/verify-transaction_js/input.json

// Copy the json to input file

node \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_js/generate_witness.js \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_js/verify-transaction.wasm \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_js/input.json \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_js/witness.wtns

snarkjs groth16 prove \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_0001.zkey \
  zk-proofs/src/circuits/verify-transaction/verify-transaction_js/witness.wtns \
  zk-proofs/src/circuits/verify-transaction/proof.json \
  zk-proofs/src/circuits/verify-transaction/public.json

snarkjs groth16 verify \
  zk-proofs/src/circuits/verify-transaction/verification_key.json \
  zk-proofs/src/circuits/verify-transaction/public.json \
  zk-proofs/src/circuits/verify-transaction/proof.json

snarkjs zkey export soliditycalldata \
  zk-proofs/src/circuits/verify-transaction/public.json \
  zk-proofs/src/circuits/verify-transaction/proof.json
```

## About

[![klarluft](./klarluft-logo-black.png)](https://klarluft.com)
[![michal-wrzosek](./michal-wrzosek-avatar.jpg)](https://github.com/michal-wrzosek)

[zKlar](https://zklar.com) project is created and maintained by [Michal Wrzosek](https://github.com/michal-wrzosek) from [Klarluft](https://klarluft.com).
