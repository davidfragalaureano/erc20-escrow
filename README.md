# Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```

# What is it?

This is a very basic ERC20 Escrow, that let exchange tokens among 2 users.

The contract is intantiated with the users that will interact with it, which tokens and how many of them.

ERC20 Tokens used:

[Weenus Token](https://rinkeby.etherscan.io/address/0xaFF4481D10270F50f203E0763e2597776068CBc5#code)
[Xeenus Token](https://rinkeby.etherscan.io/address/0x022E292b44B5a146F2e8ee36Ff44D3dd863C915c#code)

User address are listed below:

User 1: `0x3dcd47ee0f42291c879ef41a2f51eba14a1971c6`
User 2: `0x96ff4884caa2736d8997714e58128689bf7f3a6d`

And the amount of tokens both will trade are: 

User 1: 100 Weenus
User 2: 200 Xeenus

## Scripts folder

### scripts/deploy-erc20escrow-contract.js

This file deploys the ERC20 Escrow smart contract to the network (Rinkeby Ethereum network, in this case) with all the information needed.

### scripts/erc20-token-users-funding.js

This file funds the user accounts with some funds of each ER20 tokens accordingly.
(having ETH balance in users addresses are a prerequisite to interact with the contract, you can request some ETH using this Faucet: [Rinkeby Faucet](http://rinkeby-faucet.com)).

### scripts/erc20-swap-exec.js

Makes the set up for interacting with the contract (deposits/withdraw) and make the tokens swap.

## Tokens folder

This folder holds the ABI code for each token

## contract.json

This file contains the information of users and the contract itself (addresses, private & public keys)

# Unit Tests

Ethers.js & Hardhat was used for tests, as well as waffle for mocking smart contracts