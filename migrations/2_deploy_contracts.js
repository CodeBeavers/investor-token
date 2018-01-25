const SafeMath = artifacts.require('./SafeMath.sol');
const InvestorToken = artifacts.require('./InvestorToken.sol');
const Distributor = artifacts.require('./Distributor.sol');

module.exports = async function (deployer) {
    await deployer.deploy(SafeMath);
    await deployer.link(SafeMath, InvestorToken);
    await deployer.link(SafeMath, Distributor);

    await deployer.deploy(InvestorToken).then(async function () {
        await deployer.deploy(Distributor, InvestorToken.address);
    });
};