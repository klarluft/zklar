import "@nomiclabs/hardhat-ganache";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import { HardhatUserConfig } from "hardhat/types";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    localhost: {
      url: "http://127.0.0.1:7545",
      accounts: [
        "2ad9e1b895289b4913e2e3937a1ffa06ee627e89da874e9336822c2b6117495b",
        "194d6da19a6e5c52651291f807d28e4f2950f1219095282d9c0dc640217ce1e2",
        "7eec9ad53e7c65d3ab1d35e6b6698717028b9fc34fe47d4f3ae00f81c43688a0",
      ],
    },
  },
  solidity: {
    compilers: [{ version: "0.6.11", settings: {} }],
  },
};

export default config;
