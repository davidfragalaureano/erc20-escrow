const { use, expect } = require("chai");
const { ethers } = require("hardhat");
const { waffleChai } = require('@ethereum-waffle/chai');
const { deployMockContract } = require('@ethereum-waffle/mock-contract');
const IERC20 = require('../artifacts/contracts/IERC20.sol/IERC20.json');

use(waffleChai);

describe("ERC20Swap Contract", () => {
  let exchanger1;
  const amount1 = 10;
  let exchanger2;
  const amount2 = 40;
  let nonUser;

  // ERC20 Token Contract Mocks
  let mockERC20Token1;
  let mockERC20Token2;

  // Swap Contract
  let ERC20SwapFactory;
  let ERC20Swap;

  beforeEach(async () => {
    // Setting contract users from wallets
    const [owner, _exchanger2, _nonUser] = await ethers.getSigners();
    exchanger1 = owner.address;
    exchanger2 = _exchanger2.address;
    nonUser = _nonUser;

    // Deploy ERC20 Token contract Mocks
    mockERC20Token1 = await deployMockContract(owner, IERC20.abi);
    mockERC20Token2 = await deployMockContract(owner, IERC20.abi);
    
    const { address: tokenAdress1 } = mockERC20Token1;
    const { address: tokenAdress2 } = mockERC20Token2;
    // Create Swap Contract
    ERC20SwapFactory = await ethers.getContractFactory("ERC20Swap");
    ERC20Swap = await ERC20SwapFactory.deploy(
      exchanger1, 
      tokenAdress1, 
      amount1, 
      exchanger2, 
      tokenAdress2, 
      amount2
    );
    // Wait for the contract to be depoyed
    await ERC20Swap.deployed();
  });

  describe('General information', () => {
    it("Should validate the contract owner", async () => {
      const [owner] = await ethers.getSigners();
      const actualOwner = await ERC20Swap.owner();
      const expectedOwner = owner.address;
      expect(actualOwner).to.equal(expectedOwner);
    });
  });

  describe('Balances', () => {
    it("Should revert when a non-user account request the balance", async () => {
      // Create a new instance of the contract but with another signer
      const ERC20SwapWithAnonUserSigner = await ERC20Swap.connect(nonUser);
      await expect(
        ERC20SwapWithAnonUserSigner.getAccountBalanceOfToken(
          mockERC20Token1.address,
           nonUser.address
          )
      ).to.be.revertedWith("You're not allowed to call this contract");
    });

    it("Should return the current balance for the given token", async () => {
      await mockERC20Token1.mock.balanceOf.returns(10);
      expect(
        await ERC20Swap.getAccountBalanceOfToken(mockERC20Token1.address, exchanger1)
        ).to.equal(10); 
    });
  });

  describe('Deposits', () => {
    it("Should accept & process a single user deposit", async () => {
      await Promise.all([
        mockERC20Token1.mock.balanceOf.returns(10),
        mockERC20Token1.mock.allowance.returns(10),
        mockERC20Token1.mock.transferFrom.withArgs(exchanger1, ERC20Swap.address, amount1).returns(true) 
      ]);
      await expect(ERC20Swap.deposit())
        .to.emit(ERC20Swap, 'Deposit')
        .withArgs(exchanger1, mockERC20Token1.address, amount1);
    });

    describe('Swap', () => {
      it("Should accept, process both deposits and make the swap", async () => {
        const [, _exchanger2] = await ethers.getSigners();
        const { address: tokenAdress1 } = mockERC20Token1;
        const { address: tokenAdress2 } = mockERC20Token2;
  
        // Deposit 1
        await Promise.all([
          mockERC20Token1.mock.balanceOf.returns(10),
          mockERC20Token1.mock.transferFrom.returns(true),
          mockERC20Token1.mock.allowance.returns(10),
        ]);
        await expect(ERC20Swap.deposit())
          .to.emit(ERC20Swap, 'Deposit')
          .withArgs(exchanger1, tokenAdress1, amount1);
        
        ERC20Swap = await ERC20Swap.connect(_exchanger2);
        // Deposit 2
        await Promise.all([
          mockERC20Token2.mock.balanceOf.returns(40),
          mockERC20Token2.mock.transferFrom.returns(true),
          mockERC20Token1.mock.transfer.returns(true),
          mockERC20Token2.mock.transfer.returns(true),
          mockERC20Token2.mock.allowance.returns(40),
        ]);
        await expect(ERC20Swap.deposit())
          .to.emit(ERC20Swap, 'Deposit')
          .withArgs(exchanger2, tokenAdress2, amount2)
          .to.emit(ERC20Swap, 'Swap');
        
        // Test if te contract has been destroyed
        // When a contract is destroyed, all calls made to it would result in revert transactions
        await expect(ERC20Swap.owner()).to.be.reverted;
      });
    });

    it("Should reject the deposit if allowance of the owner is not enough for the contract to receive the tokens", async () => {
      await Promise.all([
        mockERC20Token1.mock.balanceOf.returns(10),
        mockERC20Token1.mock.transferFrom.returns(true),
        mockERC20Token1.mock.allowance.returns(5),
      ]);     
      await expect(ERC20Swap.deposit())
        .to.be.revertedWith('Allowance is not sufficient for completing this transfer');
    });

    it("Should reject the deposit if the amount to be sent is greather than the actual balance", async () => {
      await mockERC20Token1.mock.balanceOf.returns(5);
      await expect(ERC20Swap.deposit())
        .to.be.revertedWith('Sender does not have enough funds');
    });

    it("Should reject if a non-user try to do a deposit", async () => {
      ERC20Swap = await ERC20Swap.connect(nonUser);

      await expect(ERC20Swap.deposit())
        .to.be.revertedWith("You're not allowed to call this contract");
    });

    it("Should reject if the deposit failed", async () => {
      await Promise.all([
        mockERC20Token1.mock.balanceOf.returns(10),
        mockERC20Token1.mock.allowance.returns(10),
        mockERC20Token1.mock.transferFrom.returns(false)
      ]);
      await expect(ERC20Swap.deposit())
        .to.be.revertedWith("Deposit failed, funds couldn't be transferred to this contract");

      // Ethers contract instance doesn't support history calls on mocks
      // Waffle contract instace should be used instead
      // expect('swap').not.to.be.calledOnContract(ERC20Swap);
    });
  });

  describe('Withdraw', () => {
    it("Should allow user witdraw their funds if the swap hasn't been completed", async () => {
      const { address: tokenAdress1 } = mockERC20Token1;
      // Process deposit
      await Promise.all([
        mockERC20Token1.mock.balanceOf.returns(10),
        mockERC20Token1.mock.allowance.returns(10),
        mockERC20Token1.mock.transferFrom.withArgs(exchanger1, ERC20Swap.address, amount1).returns(true) 
      ]);
      await expect(ERC20Swap.deposit())
        .to.emit(ERC20Swap, 'Deposit')
        .withArgs(exchanger1, mockERC20Token1.address, amount1);

      await Promise.all([
        mockERC20Token1.mock.transfer.returns(false),
        mockERC20Token1.mock.transfer.withArgs(exchanger1, amount1).returns(true),
      ]);

      await expect(ERC20Swap.withdraw())
      .to.emit(ERC20Swap, 'Withdraw')
      .withArgs(exchanger1, tokenAdress1, amount1);
    });

    it("Should reject when there is nothing to withdraw", async () => {
      await expect(ERC20Swap.withdraw())
        .to.be.revertedWith('You have nothing to withdraw')
    });

    it("Should reject when the user is not part of the contract", async () => {
      ERC20Swap = await ERC20Swap.connect(nonUser);
      await expect(ERC20Swap.withdraw())
        .to.be.revertedWith("You're not allowed to call this contract");
    });

  });


});
