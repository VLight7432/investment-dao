import "dotenv/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  networks: {
    // Réseau local de développement
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
      chainId: 31337,
      allowUnlimitedContractSize: true
    },
    
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    
    // Testnet Sepolia (Ethereum)
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },
    
    // Testnet Mumbai (Polygon)
    mumbai: {
      type: "http",
      chainType: "l1",
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001
    },
    
    // Mainnet Ethereum
    mainnet: {
      type: "http",
      chainType: "l1",
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1
    }
  },

  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY || process.env.POLYGONSCAN_API_KEY || ""
    }
  },
  
  // Configuration des chemins
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  
  mocha: {
    timeout: 40000
  }
};