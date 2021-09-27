const { ethers } = require("hardhat");
const WeenusTokenABI = require('../tokens/WeenusToken.json');
const XeenusTokenABI = require('../tokens/XeenusToken.json');   
const Tx = require('ethereumjs-tx').Transaction;
const ERC20SwapInfo = require('../contract.json');

/**
 * This file requests funds for bot tokens WeenusToken & XeenusToken by sending a 0 value Tx to the token contract
 */

/**
 * Create, sign, and broadcast a transaction to the Ethereum network
 * @param {*} param0 
 */
const sendEths = async ({
    from,
    to,
    fromPrivateKey,
    value,
    provider,
    gasPrice,
    gasLimit = ethers.utils.hexlify(21000),
  }) => {
    // Get Nonce
    const txCount = await provider.getTransactionCount(from);
    
    // Build transaction
    const tx = new Tx({
      nonce: ethers.utils.hexlify(txCount),
      to,
      value: ethers.utils.parseEther(value).toHexString(),
      gasLimit,
      gasPrice,
    },{
        'chain':'rinkeby'
    });

    // Sign transaction
    tx.sign(Buffer.from(fromPrivateKey, 'hex'));
    console.log(tx.serialize().toString('hex'));
    console.log('Tx signed');

    // Send transaction 
    const { hash } = await provider.sendTransaction('0x' + tx.serialize().toString('hex'));
    console.log(`Waiting for Tx hash to be mined: ${hash}`);

    await provider.waitForTransaction(hash);
}

/**
 * Sends a 0 value transaction to eachh token contract for 
 * the respective user address to be funder with some tokens
 * @param {*} token 
 * @param {*} sender 
 * @param {*} senderPrivKey 
 */
const fundAccount = async (token, sender, senderPrivKey) => {
    const provider = new ethers.providers.JsonRpcProvider('https://rinkeby-light.eth.linkpool.io/');
    const txBody = {
        from: sender.address,
        to: token.address,
        value: '0',
    };

    const gasLimit = await provider.estimateGas(txBody);
    console.log('Gas Estimated: ' + gasLimit);

    await sendEths({
        ...txBody,
        fromPrivateKey: fixKey(senderPrivKey),
        provider,
        gasLimit: ethers.utils.hexlify(gasLimit),
        gasPrice: ethers.utils.hexlify(5000000000),
    });
}
const fixKey = key => key.replace('0x','').toLowerCase();

async function main() {
    const [, user1, user2] = await ethers.getSigners();
    const WeenusTokenAddress = '0xaFF4481D10270F50f203E0763e2597776068CBc5';
    const XeenusTokenAdress = '0x022E292b44B5a146F2e8ee36Ff44D3dd863C915c';
    const WeenusToken = new ethers.Contract(WeenusTokenAddress, WeenusTokenABI, user1);
    const XeenusToken = new ethers.Contract(XeenusTokenAdress, XeenusTokenABI, user2);

    console.log(`User 1 Account ${user1.address} with balance: ${(await user1.getBalance()).toString()}`);
    console.log(`User 2 Account ${user2.address} with balance: ${(await user2.getBalance()).toString()}`);
    
    // Fund Users with their respective Tokens
    await fundAccount(WeenusToken, user1, ERC20SwapInfo.user1.privateKey);
    await fundAccount(XeenusToken, user2, ERC20SwapInfo.user2.privateKey);

    // Check for balances
    const user1Balance = await WeenusToken.balanceOf(user1.address);
    console.log(`User 1 WeenusToken balance : ${user1Balance}`);
    const user2Balance = await XeenusToken.balanceOf(user2.address);
    console.log(`User 2 XeenusToken balance : ${user2Balance}`);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  