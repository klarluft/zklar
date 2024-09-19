const { keccak256 } = require("ethereum-cryptography/keccak.js");
const { secp256k1 } = require("ethereum-cryptography/secp256k1.js");
const { hexToBytes, toHex } = require("ethereum-cryptography/utils.js");

const privateKey = hexToBytes("a5dcb7f94c2e1494a19438a66803d854bced35e2ee03f256ab2cf4641355024c");
// const privateKey = secp256k1.utils.randomPrivateKey();
const publicKey = secp256k1.getPublicKey(privateKey, false);
const address = `0x${Buffer.from(keccak256(publicKey.slice(1)).slice(12)).toString("hex")}`;

console.log("Private Key:", toHex(privateKey));
console.log("Public Key:", toHex(publicKey));
console.log("Ethereum Address:", address);

const message = "Hello, Ethereum!";
const messageHash = keccak256(Buffer.from(message));
const signature = secp256k1.sign(messageHash, privateKey).toCompactHex();
console.log(signature);

const sig = secp256k1.Signature.fromCompact(signature).addRecoveryBit(1);
console.log("recovery", sig.recoverPublicKey(messageHash).toHex(false));
