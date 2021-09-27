const { ethers } = require("hardhat");
const WeenusTokenABI = require('../tokens/WeenusToken.json');
const XeenusTokenABI = require('../tokens/XeenusToken.json');
const ERC20Swap = require('../contract.json');

async function main() {
    const [deployer, user1, user2] = await ethers.getSigners();

    console.log("Deploying contract with the account:", deployer.address);
    console.log("Deployer balance:", (await deployer.getBalance()).toString());
    console.log(`User1 Account ${user1.address} with balance: ${(await user1.getBalance()).toString()}`);
    console.log(`User2 Account ${user2.address} with balance: ${(await user2.getBalance()).toString()}`);

    // Setting up Token Contracts
    // Making a 0 value transfer to these contracts will fund some tokens
    const WeenusTokenAddress = '0xaFF4481D10270F50f203E0763e2597776068CBc5';
    const XeenusTokenAdress = '0x022E292b44B5a146F2e8ee36Ff44D3dd863C915c';
    const WeenusToken = new ethers.Contract(WeenusTokenAddress, WeenusTokenABI, user1);
    const XeenusToken = new ethers.Contract(XeenusTokenAdress, XeenusTokenABI, user2);
    console.log(`Contract WeenusToken Token instantiated: ${WeenusToken.address}`);
    console.log(`Contract XeenusToken Token instantiated: ${XeenusToken.address}`);

    const amountToSwapUser1 = 100;
    const amountToSwapUser2 = 200;
        
    // Deploying ERC20Swap Contract to the network
    ERC20SwapFactory = await ethers.getContractFactory("ERC20Swap", deployer);
    ERC20Swap = await ERC20SwapFactory.deploy(
      user1.address, 
      WeenusToken.address, 
      amountToSwapUser1, 
      user2.address,
      XeenusToken.address, 
      amountToSwapUser2
    );
    
    console.log("ERC20Swap Contract address:", ERC20Swap.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  