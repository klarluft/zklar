const { buildPoseidon } = require("circomlibjs");

async function start() {
  const poseidon = await buildPoseidon();

  const digest = poseidon([0]);

  console.log("digest", digest);
  console.log("digest2", poseidon.F);
  console.log("digest3", poseidon.F.toObject(digest).toString(16));
}

start();
