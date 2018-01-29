const SafeMath = artifacts.require('./SafeMath.sol');
const InvestorToken = artifacts.require('./InvestorToken.sol');

module.exports = async function (deployer) {
    await deployer.deploy(SafeMath);
    await deployer.link(SafeMath, InvestorToken);
    await deployer.deploy(InvestorToken);
};