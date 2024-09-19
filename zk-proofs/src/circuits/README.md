```bash
 circom zk-proofs/src/circuits/merkle-tree-commitment-verifier.circom \
  --wasm \
  --r1cs \
  --sym \
  --c \
  --verbose \
  -o zk-proofs/src/circuits/merkle-tree-commitment-verifier

make --directory ./zk-proofs/src/circuits/merkle-tree-commitment-verifier/merkle-tree-commitment-verifier_cpp

./zk-proofs/src/circuits/merkle-tree-commitment-verifier/merkle-tree-commitment-verifier_cpp/merkle-tree-commitment-verifier \
  ./zk-proofs/src/circuits/merkle-tree-commitment-verifier-input.json \
  ./zk-proofs/src/circuits/merkle-tree-commitment-verifier-witness.wtns

snarkjs groth16 setup \
  zk-proofs/src/circuits/merkle-tree-commitment-verifier/merkle-tree-commitment-verifier.r1cs \
  powersOfTau28_hez_final_16.ptau \
  zk-proofs/src/circuits/merkle-tree-commitment-verifier/merkle-tree-commitment-verifier.zkey
```

```bash
mkdir ./zk-proofs/src/circuits/verify-ownership

circom zk-proofs/src/circuits/verify-ownership.circom \
  --wasm \
  --r1cs \
  --sym \
  --verbose \
  -o zk-proofs/src/circuits/verify-ownership

snarkjs r1cs info \
  ./zk-proofs/src/circuits/verify-ownership/verify-ownership.r1cs

snarkjs plonk setup \
  ./zk-proofs/src/circuits/verify-ownership/verify-ownership.r1cs \
  powersOfTau28_hez_final_16.ptau \
  ./zk-proofs/src/circuits/verify-ownership.zkey

snarkjs plonk fullprove \
  ./zk-proofs/src/circuits/verify-ownership-input.json \
  ./zk-proofs/src/circuits/verify-ownership/verify-ownership_js/verify-ownership.wasm \
  ./zk-proofs/src/circuits/verify-ownership.zkey \
  ./zk-proofs/src/circuits/verify-ownership-proof.json \
  ./zk-proofs/src/circuits/verify-ownership-public.json

snarkjs zkey export verificationkey \
  ./zk-proofs/src/circuits/verify-ownership.zkey \
  ./zk-proofs/src/circuits/verify-ownership-verification-key.json

snarkjs plonk verify \
  ./zk-proofs/src/circuits/verify-ownership-verification-key.json \
  ./zk-proofs/src/circuits/verify-ownership-proof.json \
  ./zk-proofs/src/circuits/verify-ownership-public.json
```

```
mkdir ./zk-proofs/src/circuits/test

circom zk-proofs/src/circuits/test.circom \
  --wasm \
  --r1cs \
  --sym \
  --verbose \
  -o zk-proofs/src/circuits/test

snarkjs r1cs info \
  ./zk-proofs/src/circuits/test/test.r1cs

snarkjs plonk setup \
  ./zk-proofs/src/circuits/test/test.r1cs \
  powersOfTau28_hez_final_16.ptau \
  ./zk-proofs/src/circuits/test.zkey

snarkjs plonk fullprove \
  ./zk-proofs/src/circuits/test-input.json \
  ./zk-proofs/src/circuits/test/test_js/test.wasm \
  ./zk-proofs/src/circuits/test.zkey \
  ./zk-proofs/src/circuits/test-proof.json \
  ./zk-proofs/src/circuits/test-public.json

snarkjs zkey export verificationkey \
  ./zk-proofs/src/circuits/test.zkey \
  ./zk-proofs/src/circuits/test-verification-key.json

snarkjs plonk verify \
  ./zk-proofs/src/circuits/test-verification-key.json \
  ./zk-proofs/src/circuits/test-proof.json \
  ./zk-proofs/src/circuits/test-public.json
```

```
mkdir ./zk-proofs/src/circuits/multiplier && \
circom ./zk-proofs/src/circuits/multiplier.circom \
  --wasm \
  --r1cs \
  --inspect \
  -o ./zk-proofs/src/circuits/multiplier && \
snarkjs r1cs info \
  ./zk-proofs/src/circuits/multiplier/multiplier.r1cs && \
snarkjs powersoftau prepare phase2 \
  ./powersOfTau28_hez_final_15.ptau \
  ./zk-proofs/src/circuits/multiplier/multiplier.ptau -v && \
snarkjs groth16 setup \
  ./zk-proofs/src/circuits/multiplier/multiplier.r1cs \
  ./zk-proofs/src/circuits/multiplier/multiplier.ptau \
  ./zk-proofs/src/circuits/multiplier/multiplier-0000.zkey && \
snarkjs zkey contribute \
  ./zk-proofs/src/circuits/multiplier/multiplier-0000.zkey \
  ./zk-proofs/src/circuits/multiplier/multiplier.zkey \
  --name="Michal Wrzosek" -v && \
snarkjs groth16 fullprove \
  ./zk-proofs/src/circuits/multiplier-input.json \
  ./zk-proofs/src/circuits/multiplier/multiplier_js/multiplier.wasm \
  ./zk-proofs/src/circuits/multiplier/multiplier.zkey \
  ./zk-proofs/src/circuits/multiplier/multiplier-proof.json \
  ./zk-proofs/src/circuits/multiplier/multiplier-public.json && \
snarkjs zkey export verificationkey \
  ./zk-proofs/src/circuits/multiplier/multiplier.zkey \
  ./zk-proofs/src/circuits/multiplier/multiplier-verification-key.json && \
snarkjs groth16 verify \
  ./zk-proofs/src/circuits/multiplier/multiplier-verification-key.json \
  ./zk-proofs/src/circuits/multiplier/multiplier-proof.json \
  ./zk-proofs/src/circuits/multiplier/multiplier-public.json
```

```
mkdir ./zk-proofs/src/circuits/multiplier && \
circom ./zk-proofs/src/circuits/multiplier.circom \
  --wasm \
  --r1cs \
  --inspect \
  -o ./zk-proofs/src/circuits/multiplier && \
snarkjs r1cs info \
  ./zk-proofs/src/circuits/multiplier/multiplier.r1cs && \
snarkjs plonk setup \
  ./zk-proofs/src/circuits/multiplier/multiplier.r1cs \
  ./powersOfTau28_hez_final_15.ptau \
  ./zk-proofs/src/circuits/multiplier/multiplier.zkey && \
snarkjs plonk fullprove \
  ./zk-proofs/src/circuits/multiplier-input.json \
  ./zk-proofs/src/circuits/multiplier/multiplier_js/multiplier.wasm \
  ./zk-proofs/src/circuits/multiplier/multiplier.zkey \
  ./zk-proofs/src/circuits/multiplier/multiplier-proof.json \
  ./zk-proofs/src/circuits/multiplier/multiplier-public.json && \
snarkjs zkey export verificationkey \
  ./zk-proofs/src/circuits/multiplier/multiplier.zkey \
  ./zk-proofs/src/circuits/multiplier/multiplier-verification-key.json && \
snarkjs plonk verify \
  ./zk-proofs/src/circuits/multiplier/multiplier-verification-key.json \
  ./zk-proofs/src/circuits/multiplier/multiplier-proof.json \
  ./zk-proofs/src/circuits/multiplier/multiplier-public.json
```
