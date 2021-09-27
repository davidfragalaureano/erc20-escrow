//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ERC20Swap {

    // User information for the swap
    struct Payment {
        address _address;
        IERC20 token;
        uint32 amount; 
        bool depositSent;
    }

    event Swap();
    event Deposit(address indexed user, address indexed token, uint256 indexed amount);
    event Withdraw(address indexed user, address indexed token, uint256 indexed amount);

    address payable public owner;
    Payment private exchanger1;
    Payment private exchanger2;
    mapping(address => Payment) users;
    
    modifier onlyUsers { 
        require(users[msg.sender].amount != 0,  "You're not allowed to call this contract");
        _;
    }

    constructor(
        address _exchanger1, 
        address token1, 
        uint32 amount1, 
        address _exchanger2,  
        address token2, 
        uint32 amount2 
    ) {        
        owner = payable(msg.sender);
        exchanger1 = Payment(_exchanger1, IERC20(token1), amount1, false);
        exchanger2 = Payment(_exchanger2, IERC20(token2), amount2, false);
        users[_exchanger1] = Payment(_exchanger1, IERC20(token1), amount1, false);
        users[_exchanger2] = Payment(_exchanger2, IERC20(token2), amount2, false);
    }

    /**
     * Deposit tokens to this contract
     */
    function deposit() external onlyUsers {        
        address sender = msg.sender;
        makeExchangeDeposit(exchanger1, sender);
        makeExchangeDeposit(exchanger2, sender);
        // swap can be completed once both parties have sent their funds
        if (exchanger1.depositSent && exchanger2.depositSent) {
            swap();
            selfdestruct(owner);
        }
    }

    /**
      * Users can widthdraw tokens if the sawp is has not been completed
     */
    function withdraw() external onlyUsers {
        require(!(exchanger1.depositSent && exchanger2.depositSent), 'Deposits are completed for swap, you cannot withdraw');
        validateWithdraw(exchanger1, msg.sender);
        validateWithdraw(exchanger2, msg.sender);
    }

    function getAccountBalanceOfToken(address token, address _address) public view onlyUsers returns (uint) {
        return IERC20(token).balanceOf(_address);
    }

    function validateWithdraw(Payment memory exchanger, address receiver) private {
        if (receiver == exchanger._address) {
            // if user did not deposit, withdraw is not allowed
            require(exchanger.depositSent, 'You have nothing to withdraw');
            // make the refund
            bool tranferResp = exchanger.token.transfer(receiver, exchanger.amount);
            require(tranferResp, 'Withdraw failed');

            emit Withdraw(receiver, address(exchanger.token), exchanger.amount);
        } 
    }

    function makeExchangeDeposit(Payment storage exchanger, address sender) private {
        if (sender == exchanger._address) {
            // verify the sender have enough balance for the swap
            uint userBalance = getAccountBalanceOfToken(address(exchanger.token), sender);
            require(exchanger.amount <= userBalance, "Sender does not have enough funds");

            // check allowance
            uint allowance = exchanger.token.allowance(sender, address(this));
	        require(exchanger.amount <= allowance, "Allowance is not sufficient for completing this transfer");

            // make the deposit to this contract
            bool depositResp = exchanger.token.transferFrom(sender, address(this), exchanger.amount);
            require(depositResp, "Deposit failed, funds couldn't be transferred to this contract");

            exchanger.depositSent = depositResp;      
            emit Deposit(exchanger._address, address(exchanger.token), exchanger.amount);
        }
    }
    
    /**
      * Exchange tokens between users
     */
    function swap() private onlyUsers {
        // transfer to user 1
        bool swap1 = exchanger1.token.transfer(exchanger2._address, exchanger1.amount);
        require(swap1, 'Exchange transfer 1 failed');
        // transfer to user 2
        bool swap2 = exchanger2.token.transfer(exchanger1._address, exchanger2.amount);
        require(swap2, 'Exchange transfer 2 failed');

        emit Swap();
    }
}
