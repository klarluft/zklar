import { MongoClient } from "mongodb";
import { numToZok } from "../utils/num-to-zok";
import { ObjectID } from "bson";
import { getPoseidon } from "..";

const username = "root";
const password = "password";
const url = `mongodb://${username}:${encodeURIComponent(password)}@localhost:27017`;
const client = new MongoClient(url);
const dbName = "merkle-tree";
const nrOfLevels = 10;
const nrOfLeafs = Math.pow(2, 10);

interface NodeDocument {
  level: number;
  index: number;
  value?: string;
  digest: string;
}

interface NodeStatusDocument {
  _id: ObjectID;
  currentLevel: number;
  currentIndex: number;
}

async function setUpMongoConnection() {
  await client.connect();
  console.log("Connected successfully to server");
  const db = client.db(dbName);

  const nodesCollection = db.collection<NodeDocument>("nodes");
  nodesCollection.createIndex("digest");
  nodesCollection.createIndex("value");
  nodesCollection.createIndex(["level", "index"]);

  const nodesStatusCollection = db.collection<NodeStatusDocument>("nodes-status");
  let nodeStatus = await nodesStatusCollection.findOne();
  if (!nodeStatus) {
    await nodesStatusCollection.insertOne({ currentLevel: 0, currentIndex: 0 });
    nodeStatus = await nodesStatusCollection.findOne();
    if (!nodeStatus) throw new Error("Could not create node status document");
  }

  return { db, nodesCollection, nodesStatusCollection, nodeStatus };
}

async function closeMongoConnection() {
  await client.close();
}

export async function createMerkleTree() {
  try {
    const poseidon = await getPoseidon();
    const { nodesCollection, nodeStatus, nodesStatusCollection } = await setUpMongoConnection();

    const { currentLevel, currentIndex } = nodeStatus;

    for (let level = currentLevel; level <= nrOfLevels; level++) {
      await nodesStatusCollection.updateOne({ _id: nodeStatus._id }, { $set: { currentLevel: level } });

      if (level === 0) {
        for (let index = currentIndex; index < nrOfLeafs; index++) {
          await nodesStatusCollection.updateOne({ _id: nodeStatus._id }, { $set: { currentIndex: index } });

          const nodeAtThisIndex = await nodesCollection.findOne({ level, index });
          if (nodeAtThisIndex) continue;
          const digest = numToZok(poseidon([index, 0]));
          console.log(`${digest} - ${index + 1}/${nrOfLeafs} (${Math.round(((index + 1) / nrOfLeafs) * 100)}%)`);
          await nodesCollection.insertOne({ level: 0, index, value: numToZok(0), digest });
        }
      } else {
        const nrOfNodesOnLevel = nrOfLeafs / Math.pow(2, level);

        for (let index = 0; index < nrOfNodesOnLevel; index++) {
          await nodesStatusCollection.updateOne({ _id: nodeStatus._id }, { $set: { currentIndex: index } });

          const nodeAtThisIndex = await nodesCollection.findOne({ level, index });
          if (nodeAtThisIndex) continue;

          const leftNode = await nodesCollection.findOne({ level: level - 1, index: index / 2 });
          const rightNode = await nodesCollection.findOne({ level: level - 1, index: index / 2 + 1 });
        }
      }
    }

    await closeMongoConnection();
  } catch (error) {
    await closeMongoConnection();
    throw error;
  }
}
