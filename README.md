# arbitrum-messages

Run Zokrates:

```
docker run --rm -ti -v $(pwd):/home/zokrates/code zokrates/zokrates \
  zokrates compile \
    --input ./code/main.zok \
    --output ./code/out \
    --abi-spec ./code/abi.json

docker run --rm -ti -v $(pwd):/home/zokrates/code zokrates/zokrates \
  zokrates setup \
    --input ./code/out \
    --proving-key-path ./code/proving.key \
    --universal-setup-path ./code/universal_setup.dat \
    --verification-key-path ./code/verification.key

docker run --rm -ti -v $(pwd):/home/zokrates/code zokrates/zokrates \
  zokrates compute-witness \
    --abi \
    --abi-spec ./code/abi.json \
    --input ./code/out \
    --output ./code/witness \
    --verbose \
    --stdin

zokrates compute-witness \
    --abi \
    --verbose \
    --stdin

docker run --rm -ti -v $(pwd):/home/zokrates/code zokrates/zokrates \
  zokrates generate-proof \
    --input ./code/out \
    --witness ./code/witness \
    --proving-key-path ./code/proving.key \
    --proof-path ./code/proof.json

docker run --rm -ti -v $(pwd):/home/zokrates/code zokrates/zokrates \
  zokrates export-verifier \
    --input ./code/verification.key \
    --output ./code/verifier.sol

docker run --rm -ti -v $(pwd):/home/zokrates/code zokrates/zokrates \
  zokrates verify \
    --proof-path ./code/proof.json \
    --verification-key-path ./code/verification.key
```
