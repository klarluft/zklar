import { MongoClient } from "mongodb";
import { Poseidon } from "zk-proofs";

export type TrieNode = {
  path: string;
  value: string;
  /** The idea is that we never mutate the nodes. We only add new nodes. With combination of the path and the transaction number, we can always find the latest value of the node. This gives us ability to quickly go back to any previous state of the trie as this is often be necessary. */
  transaction: number;
  level: number;
};

export class Trie {
  trieSize: number;
  poseidon: Poseidon;
  mongodbClient: MongoClient;
  dbName: string;
  collectionName: string;

  constructor({
    trieSize,
    poseidon,
    mongodbClient,
    dbName,
    collectionName,
  }: {
    trieSize: number;
    poseidon: Poseidon;
    mongodbClient: MongoClient;
    dbName: string;
    collectionName: string;
  }) {
    this.trieSize = trieSize;
    this.poseidon = poseidon;
    this.mongodbClient = mongodbClient;
    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  async addLeaf({ index, digest, transaction }: { index: number; digest: BigInt; transaction: number }) {
    const session = this.mongodbClient.startSession();

    try {
      session.startTransaction();

      const path = "0b" + index.toString(2).padStart(this.trieSize, "0");

      // "0b" - is going to be a root node
      const pathArray = ["0b", ...path.slice(2).split("")];

      const collection = this.mongodbClient.db(this.dbName).collection<TrieNode>(this.collectionName);

      await collection.insertOne(
        { path, value: "0x" + digest.toString(16), transaction, level: this.trieSize },
        { session }
      );

      for (let i = 1; i < pathArray.length; i++) {
        const path = pathArray.slice(0, i * -1).join("");

        const childLeft = await collection.findOne(
          { path: path + "0" },
          { session, sort: { transaction: -1 }, projection: { value: 1, _id: 0 } }
        );
        const childRight = await collection.findOne(
          { path: path + "1" },
          { session, sort: { transaction: -1 }, projection: { value: 1, _id: 0 } }
        );

        const childrenValues = [childLeft, childRight].filter((child) => child !== null).map(({ value }) => value);

        const value =
          childrenValues.length === 1
            ? childrenValues[0]
            : "0x" + this.poseidon(childrenValues.map((hexString) => BigInt(hexString))).toString(16);

        await collection.updateOne({ path, value, transaction, level: this.trieSize - i }, { session, upsert: true });
      }

      await session.commitTransaction();
    } catch (error) {
      console.error("An error occurred during the transaction:" + error);
      console.error(error);
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }
}
