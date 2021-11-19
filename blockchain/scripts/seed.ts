import { ethers } from "hardhat";

import MessagesDeployment from "../typechain/Messages.deployment.json";
import { Messages__factory } from "../typechain";

async function main() {
  const [JohnSigner, AnneSigner] = await ethers.getSigners();
  const John = await JohnSigner.getAddress();
  const Anne = await AnneSigner.getAddress();

  const contract = Messages__factory.connect(MessagesDeployment.contractAddress, ethers.provider);

  console.log("John creates an account");
  await contract
    .connect(JohnSigner)
    .create_account(
      ethers.utils.formatBytes32String("john"),
      ethers.utils.formatBytes32String("John Doe"),
      ethers.utils.formatBytes32String("This is John's bio.")
    );

  console.log("Anne creates an account");
  await contract
    .connect(AnneSigner)
    .create_account(
      ethers.utils.formatBytes32String("anne"),
      ethers.utils.formatBytes32String("Anne Sophie"),
      ethers.utils.formatBytes32String("This is Anne's bio.")
    );

  console.log("John posts 10 messages");
  const johnMessages = Array(10)
    .fill(undefined)
    .map((_, index) => `John's ${index + 1} message.`);
  for (const message of johnMessages) {
    await contract.connect(JohnSigner).post_message(ethers.utils.formatBytes32String(message));
  }

  console.log("Anne posts 10 messages");
  const anneMessages = Array(10)
    .fill(undefined)
    .map((_, index) => `Anne's ${index + 1} message.`);
  for (const message of anneMessages) {
    await contract.connect(AnneSigner).post_message(ethers.utils.formatBytes32String(message));
  }

  console.log("Done");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
