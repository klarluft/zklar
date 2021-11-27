# arbitrum-messages

# Download ptau file

https://github.com/iden3/snarkjs#7-prepare-phase-2

```
curl -O https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_18.ptau
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
  powersOfTau28_hez_final_18.ptau \
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
  zk-proofs/src/circuits/verify-new-root-digest/verify-new-root-digest.sol
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

### Setup circuit

```
circom zk-proofs/src/circuits/verify-transaction.circom \
  --wasm \
  --r1cs \
  --sym \
  -o zk-proofs/src/circuits/verify-transaction && \
\
snarkjs groth16 setup \
  zk-proofs/src/circuits/verify-transaction/verify-transaction.r1cs \
  powersOfTau28_hez_final_18.ptau \
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
  zk-proofs/src/circuits/verify-transaction/verify-transaction.sol
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
