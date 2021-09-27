require("@nomiclabs/hardhat-waffle");
const contractInformation = require('./contract.json');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      outputSelection: {
        "*": {
            "*": ["storageLayout"],
        },
      },
    }
  },
  networks: {
    rinkeby: {
      url: "https://rinkeby-light.eth.linkpool.io/",
      gas: 21000,
      gasPrice: 5000000000,
      accounts: [
        contractInformation.deployer.privateKey, 
        contractInformation.user1.privateKey, 
        contractInformation.user2.privateKey
      ]
    }
  }
};
