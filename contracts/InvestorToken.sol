pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/StandardToken.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract InvestorToken is StandardToken, Ownable {
    using SafeMath for uint;

    string public name = "Investor Token T01";
    string public symbol = "T01";
    uint public decimals = 18;
    uint public constant INITIAL_SUPPLY = 1000 * decimals;
    mapping (address => bool) public distributors;

    function InvestorToken(){
        totalSupply = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
    }

    modifier canTransfer(address sender) {
        require(distributors[sender]);
        _;
    }

    function setDistributor(address distributor, bool state) external onlyOwner{
        distributors[distributor] = state;
    }

    function sendToInvestor(address investor, uint value) canTransfer {
        require(investor != address(0));
        require(value <= balances[owner]);

        balances[owner] = balances[owner].sub(value);
        balances[investor] = balances[investor].add(investor);
        addTokenHolder(investor);
        Transfer(owner, investor, value);
    }

    function transfer(address to, uint value) returns (bool success) {
        require(to != 0x0);
        addTokenHolder(to);
        return super.transfer(to, value);
    }

    function transferFrom(address from, address to, uint value) returns (bool success) {
        require(to != 0x0);
        addTokenHolder(to);
        return super.transferFrom(from, to, value);
    }

    /* Token holders */

    mapping(uint => address) indexedTokenHolders;
    mapping(address => uint) tokenHolders;
    uint tokenHoldersCount = 1;

    function addTokenHolder(address investor) private{
        if (tokenHolders[investor] > 0)
            return;

        tokenHolders[investor] = tokenHoldersCount;
        indexedTokenHolders[tokenHoldersCount] = investor;
        tokenHoldersCount ++;
    }

    function getHolders() external constant returns (address[], uint[]){
        address[] addressResult;
        address[] balanceResult;

        for (var index = 1; index <= tokenHoldersCount; index++) {
            if (balances[indexedTokenHolders[index]] > 0) {
                addressResult.push(indexedTokenHolders[index]);
                balanceResult.push(balances[indexedTokenHolders[index]]);
            }
        }

        return (addressResult, balanceResult);
    }
}
