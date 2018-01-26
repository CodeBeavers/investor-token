pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./InvestorToken.sol";

contract Distributor is Ownable {
    using SafeMath for uint;

    uint public coefficient;
    InvestorToken public token;

    event Deposit(address indexed sender, uint value);

    function Distributor(address _token){
        token = InvestorToken(_token);
    }

    function changeCoefficient(uint value) external onlyOwner {
        uint decimal = token.decimals();
        coefficient = value.mul(10 ** decimal);
    }

    function sendToInvestor(address investor, uint value) onlyOwner {
        token.sendToInvestor(investor, value);
    }

    function() payable {
        if (msg.value > 0){
            Deposit(msg.sender, msg.value);
        }
    }

    function calculateFunds(address[] investors) external onlyOwner{
        require(this.balance > 0);
        uint contractBalance = this.balance;

        for (uint investorIndex = 0; investorIndex < investors.length; investorIndex ++) {
            address investor = investors[investorIndex];
            uint investorBalance = token.balanceOf(investor);
            if (investorBalance >= 10 ** 16 && investor != token.owner()) {
                uint bonus = (investorBalance.mul(contractBalance)).div(coefficient);
                investor.transfer(bonus);
            }
        }
    }

    /*function calculateFunds() external onlyOwner{
        require(this.balance > 0);
        uint contractBalance = this.balance;

        for (uint investorIndex = 0; investorIndex < token.tokenHoldersCount(); investorIndex ++) {
            address investor = token.indexedTokenHolders(investorIndex);
            uint investorBalance = token.balanceOf(investor);

            if (investorBalance >= 10 ** 16 && investor != token.owner()) {
                uint bonus = (investorBalance.mul(contractBalance)).div(coefficient);
                investor.transfer(bonus);
            }
        }
    }*/
}
