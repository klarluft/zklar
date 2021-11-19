const crypto = require("crypto");

function hash(message) {
  return crypto.createHash("sha256").update(message).digest("hex");
}

async function getKeyPair() {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      "rsa",
      {
        modulusLength: 4096,
      },
      (error, publicKey, privateKey) => {
        if (error) reject(err);

        resolve({ publicKey, privateKey });
      }
    );
  });
}

function sign({ message, privateKey }) {
  return crypto.sign("sha256", Buffer.from(message), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  });
}

function verify({ message, signature, publicKey }) {
  return crypto.verify(
    "sha256",
    Buffer.from(message),
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    },
    signature
  );
}

function encrypt({ publicKey, message }) {
  return crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(message)
  );
}

function decrypt({ privateKey, encryptedMessage }) {
  return crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    encryptedMessage
  );
}

function mint({ publicKey, amount }) {
  return encrypt({ publicKey, message: `${amount}` });
}

function encryptCommit({ publicKey, amount, id }) {
  return encrypt({ publicKey, message: `${id}-${amount}` });
}

function decryptCommit({ privateKey, encryptedCommit }) {
  try {
    const commit = decrypt({ privateKey, encryptedMessage: encryptedCommit });
    const [id, amount] = commit.split("-");
    return { id, amount: Number(amount) };
  } catch {
    return undefined;
  }
}

function getCommits({ privateKey, blockchain }) {
  const commits = [];
  for (let index = 0; index < blockchain.length; index++) {
    const encryptedCommit = blockchain[index];

    const commit = decryptCommit({ privateKey, encryptedCommit });
    if (commit) commits.push({ ...commit, encryptedCommit });
  }

  return commits;
}

function commit({ oldCommits, newCommits, blockchain, nullifiers }) {}

function createMerkleTree(leafs) {
  const tree = [leafs.map((leaf) => hash(leaf))];

  while (tree[tree.length - 1].length > 1) {
    let newLevel = [];
    const lastLevel = tree[tree.length - 1];
    for (let index = 0; index < lastLevel.length / 2; index++) {
      const lhs = lastLevel[index * 2];
      const rhs = lastLevel[index * 2 + 1];
      newLevel.push(hash(`${lhs}${rhs}`));
    }
    tree.push(newLevel);
  }

  return tree;
}

function sha256ToU32Array8(hash) {
  let array = [];

  for (let index = 0; index < hash.length / 8; index++) {
    const element = hash.substr(index * 8, 8);
    array = [...array, `0x${element}`];
  }

  return array;
}

async function start() {
  const blockchain = [];
  const nullifiers = [];
  const keyPairA = await getKeyPair();
  const keyPairB = await getKeyPair();

  blockchain.push(mint({ publicKey: keyPairA.publicKey, amount: 10 }));
  blockchain.push(mint({ publicKey: keyPairB.publicKey, amount: 2 }));
  blockchain.push(mint({ publicKey: keyPairA.publicKey, amount: 5 }));

  const commitsA = getCommits({ privateKey: keyPairA.privateKey, blockchain });

  leafs = ["1", "2", "3", "4", "5", "6", "7", "8"];

  const merkleTree = createMerkleTree(leafs);

  console.log(merkleTree);

  const leftHash = crypto.createHash("sha256").update("left").digest("hex");
  const leftHash = "360f84035942243c6a36537ae2f8673485e6c04455a0a85a0db19690f2541480";
  // const rightHash = crypto.createHash("sha256").update("right").digest("hex");
  const rightHash = "27042f4e6eca7d0b2a7ee4026df2ecfa51d3339e6d122aa099118ecd8563bad9";
  // const digestHash = crypto
  //   .createHash("sha256")
  //   .update(leftHash + rightHash, "hex")
  //   .digest("hex");

  // const answer = ["09c603d3aa758d9e580207abf2186c74d8cca44234721c1f3c1785bbddcce6e9"];
  // const answer = ["519d19118a226341a7124b009c732b6be385660af51467b305ae0603281f9017"];

  const left = sha256ToU32Array8(leftHash);
  console.log(left);
  const padding = [...Array(16 * 2).fill(0)];
  crypto
    .createHash("sha256")
    .update(new Uint8Array([...Array(16 * 2 - 1).fill(0), 5]))
    .digest()
    .toString("hex");
  // const right = sha256ToU32Array8(rightHash);
  // const digest = sha256ToU32Array8(digestHash);

  // console.log([digest, left, right]);
  // console.log([digest, answer]);
}

// [
//   "0xda5698be",
//   "0x17b9b469",
//   "0x62335799",
//   "0x779fbeca",
//   "0x8ce5d491",
//   "0xc0d26243",
//   "0xbafef9ea",
//   "0x1837a9d8"
// ]

start();
