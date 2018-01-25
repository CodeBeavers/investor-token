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

    function changCoefficient(uint value) onlyOwner {
        coefficient = value.mul(token.decimals());
    }

    function sendTokens(address investor, uint value) onlyOwner {
        token.sendToInvestor(investor, value);
    }

    function() payable {
        if (msg.value > 0)
            Deposit(msg.sender, msg.value);
    }

    function calculateFunds(){
        require(this.balance > 0);

        for (uint investorIndex = 0; investorIndex < token.tokenHoldersCount(); investorIndex ++) {
            address investor = token.indexedTokenHolders(investorIndex);
            uint investorBalance = token.balanceOf(investor);

            if (investorBalance >= 10 ** 16 && investor != token.owner()) {
                uint bonus = uint(investorBalance).mul(this.balance.div(coefficient));
                investor.transfer(bonus);
            }
        }

    }
}
