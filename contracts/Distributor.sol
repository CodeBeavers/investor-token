pragma solidity ^0.4.0;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract Distributor is Ownable {
    using SafeMath for uint;

    uint public coefficient;
    InvestorToken public token;

    event Deposit(address indexed from, uint256 value);

    function Distributor(address _token){
        token = InvestorToken(_token);
    }

    function changCoefficient(uint value) onlyOwner {
        coefficient = value.mul(token.decimals());
    }

    function sendTokens(address investor, uint value) onlyOwner {
        investors.push(investor);
        token.sendToInvestor(investor, value);
    }

    function() payable {
        Deposit(msg.sender, msg.value);
    }

    function calculateFunds(){
        require(this.balance > 0);

        var ownerBalance = token.balanceOf(token.owner);
        var investorsBalance = token.totalSupply().sub(ownerBalance);

        var (investors, tokensAmount) = token.getHolders();
        for(var investorIndex = 0; investorIndex < investors.length; investorIndex ++){
            if(tokensAmount[investorIndex] >= 10**16){
                var bonus = tokensAmount[investorIndex].mul(this.balance.div(coefficient));
                investors[investorIndex].transfer(bonus);
            }
        }
    }
}
