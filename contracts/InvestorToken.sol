pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract InvestorToken is StandardToken, Ownable {
    using SafeMath for uint;

    string public name = "Investor Token T01";
    string public symbol = "T01";
    uint public decimals = 2;
    uint public constant INITIAL_SUPPLY = 1000 * 10**2;
    mapping (address => bool) public distributors;

    function InvestorToken(){
        totalSupply_ = INITIAL_SUPPLY;
        balances[msg.sender] = INITIAL_SUPPLY;
    }

    modifier canTransfer() {
        require(distributors[msg.sender] || msg.sender == owner);
        _;
    }

    function setDistributor(address distributor, bool state) external onlyOwner{
        distributors[distributor] = state;
    }

    function sendToInvestor(address investor, uint value) canTransfer {
        require(investor != 0x0);
        require(value <= balances[owner]);

        balances[owner] = balances[owner].sub(value);
        balances[investor] = balances[investor].add(value);
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

    mapping(uint => address) public indexedTokenHolders;
    mapping(address => uint) public tokenHolders;
    uint public tokenHoldersCount = 0;

    function addTokenHolder(address investor) private {
        if(investor != owner && indexedTokenHolders[0] != investor && tokenHolders[investor] == 0){
            tokenHolders[investor] = tokenHoldersCount;
            indexedTokenHolders[tokenHoldersCount] = investor;
            tokenHoldersCount ++;
        }
    }
}
