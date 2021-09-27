const { ethers } = require("hardhat");
const WeenusTokenABI = require('../tokens/WeenusToken.json');
const XeenusTokenABI = require('../tokens/XeenusToken.json');
const ERC20SwapInfo = require('../contract.json');
const ERC20SwapContract = require('../artifacts/contracts/ERC20Swap.sol/ERC20Swap.json');

/* Executes ERC20Swap smart contract functions on the Ethereum network */
async function main() {
    const [, user1, user2] = await ethers.getSigners();
    const WeenusTokenAddress = '0xaFF4481D10270F50f203E0763e2597776068CBc5';
    const XeenusTokenAdress = '0x022E292b44B5a146F2e8ee36Ff44D3dd863C915c';

    // Making a 0 value transfer to these contracts will fund some tokens
    const WeenusToken = new ethers.Contract(WeenusTokenAddress, WeenusTokenABI, user2);
    const XeenusToken = new ethers.Contract(XeenusTokenAdress, XeenusTokenABI, user1);

    console.log(`Contract WeenusToken Token instantiated: ${WeenusToken.address}`);
    console.log(`Contract XeenusToken Token instantiated: ${XeenusToken.address}`);
    console.log(`User 1 Account ${user1.address} with balance: ${(await user1.getBalance()).toString()}`);
    console.log(`User 2 Account ${user2.address} with balance: ${(await user2.getBalance()).toString()}`);

    let ERC20Swap = new ethers.Contract(
        ERC20SwapInfo.address,
        ERC20SwapContract.abi,
        user1
    );

    /* Allowance */
    
    const amountToSwapUser1 = 100;
    const amountToSwapUser2 = 200;

    // Approve ERC20Swap contract to send funds on behalf of users
    const user1Aproval = await WeenusToken.approve(ERC20Swap.address, amountToSwapUser1*4);
    const user2Aproval = await XeenusToken.approve(ERC20Swap.address, amountToSwapUser2*4);

    console.log(`User 1 approval: ${JSON.stringify(user1Aproval)}`);
    console.log(`User 2 approval: ${JSON.stringify(user2Aproval)}`);

    /* Witdraws */

    const balanceBeforeWithdraw = await ERC20Swap.getAccountBalanceOfToken(WeenusToken.address, user1.address);
    console.log(`WeenusToken balance for user 1 before withdraw: ${balanceBeforeWithdraw}`);

    await ERC20Swap.withdraw();

    const balanceAfterWithdraw = await ERC20Swap.getAccountBalanceOfToken(WeenusToken.address, user1.address);
    console.log(`WeenusToken balance for user 1 after withdraw: ${balanceAfterWithdraw}`);

    /* Deposits */

    // User 1 deposit    
    let balanceBeforeDeposit = await ERC20Swap.getAccountBalanceOfToken(WeenusToken.address, user1.address);
    console.log(`WeenusToken balance for user 1 before deposit: ${balanceBeforeDeposit}`);    

    console.log('\nDeposit 2 in progress \n');
    await ERC20Swap.deposit();

    let balanceAfterDeposit = await ERC20Swap.getAccountBalanceOfToken(WeenusToken.address, user1.address);
    console.log(`WeenusToken balance for user 1 after deposit: ${balanceAfterDeposit}`);
    console.log('\n--- User 1 deposit completed ----\n');

    // User 2 deposit    
    ERC20Swap = ERC20Swap.connect(user2);

    balanceBeforeDeposit = await ERC20Swap.getAccountBalanceOfToken(XeenusToken.address, user2.address);
    console.log(`XeenusToken balance for user 2 before deposit: ${balanceBeforeDeposit}`);    

    console.log('\nDeposit 2 in progress \n');
    await ERC20Swap.deposit();

    balanceAfterDeposit = await ERC20Swap.getAccountBalanceOfToken(XeenusToken.address, user2.address);
    console.log(`XeenusToken balance for user 2 after deposit: ${balanceAfterDeposit}`);
    console.log('\n--- User 2 deposit completed ---\n');

    console.log('Swap should be completed by now');

    try {
        await ERC20Swap.owner();
    } catch (error) {
        console.log('Contract ERC20Swap has been disbled');
    }
    /* Verify Contract has been destroyed after swap 
 

    /* Checking balances after Swap */
    const balanceu1 =  await XeenusToken.balanceOf(user1.address);
    const balanceu2 =  await WeenusToken.balanceOf(user2.address);

    console.log(`User 1 Account ${user1.address} with Xeenus balance : ${balanceu1}`);
    console.log(`User 2 Account ${user2.address} with Weenus balance: ${balanceu2}`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  