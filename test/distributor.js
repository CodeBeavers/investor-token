const Distributor = artifacts.require("Distributor");
const InvestorToken = artifacts.require("InvestorToken");

require('chai').use(require('chai-as-promised')).should();

contract('Distributor', accounts => {
    let instance;
    let token;

    beforeEach(async () => {
        token = await InvestorToken.new();
        instance = await Distributor.new(token.address);
        await token.setDistributor(instance.address, true);
    });

    describe('initial tests', () => {
        it("owner can change coefficient", async () => {
            await instance.changeCoefficient(234);
            let coefficient = await instance.coefficient();
            assert.equal(coefficient.valueOf(), 234 * 10 ** 18, "Coefficient must be 234");
        });

        it("owner can change coefficient", async () => {
            await instance.changeCoefficient(234);
            await instance.changeCoefficient(348);
            let coefficient = await instance.coefficient();
            assert.equal(coefficient.valueOf(), 348 * 10 ** 18, "Coefficient must be 348");
        });

        it("only owner can change coefficient", async () => {
            instance.changeCoefficient(234, {from : accounts[9]}).should.be.rejectedWith('revert');
        });

        it("contract can store money and send them to owner", async () => {
            await instance.sendTransaction({value: 398 * (10 ** 11), from: accounts[8]});
            await instance.sendTransaction({value: 200 * (10 ** 11), from: accounts[7]});
            let balance = await web3.eth.getBalance(instance.address);

            assert.equal(598 * 10 ** 11, balance.valueOf(), "Balance must be 598 * 10 ** 11");
        });
    });

    describe('sendToInvestor', async () => {
        it("only owner can sendToInvestor", async function () {
            instance.sendToInvestor(accounts[1], 20 * 10 ** 18, {from: accounts[3]}).should.be.rejectedWith('revert');
        });

        it("sendToInvestor", async function () {
            //act
            await instance.sendToInvestor(accounts[9], 200 * 10 ** 18);

            //assert
            const balance0 = await token.balanceOf(accounts[0]);
            const balance9 = await token.balanceOf(accounts[9]);
            assert.equal(balance0.valueOf(), 800 * 10 ** 18);
            assert.equal(balance9.valueOf(), 200 * 10 ** 18);
        });

        it("sendToInvestor. check token holder", async function () {
            //act
            await instance.sendToInvestor(accounts[9], 200 * 10 ** 18);
            await instance.sendToInvestor(accounts[4], 300 * 10 ** 18);

            //assert
            let investor9Address = await token.indexedTokenHolders(0);
            let investor4Address = await token.indexedTokenHolders(1);
            let investor9Index = await token.tokenHolders(investor9Address);
            let investor4Index = await token.tokenHolders(investor4Address);
            let tokenHoldersCount = await token.tokenHoldersCount();

            assert.equal(tokenHoldersCount.valueOf(), 2);
            assert.equal(investor9Index.valueOf(), 0);
            assert.equal(investor4Index.valueOf(), 1);
            assert.equal(investor9Address.valueOf(), accounts[9]);
            assert.equal(investor4Address.valueOf(), accounts[4]);
        });

        it("can't send to 0x0", async function () {
            instance.sendToInvestor(0, 20 * 10 ** 18).should.be.rejectedWith('revert');
        });

        it("can't send more then have", async function () {
            instance.sendToInvestor(accounts[9], 2000 * 10 ** 18).should.be.rejectedWith('revert');
        });

        it("don't add owner to investors", async function () {
            await instance.sendToInvestor(accounts[9], 700 * 10 ** 18);
            await token.transfer(accounts[0], 700 * 10 ** 18, {from: accounts[9]});

            //assert
            let investor9Address = await token.indexedTokenHolders(0);
            let investor9Index = await token.tokenHolders(investor9Address);
            let tokenHoldersCount = await token.tokenHoldersCount();

            assert.equal(tokenHoldersCount.valueOf(), 1);
            assert.equal(investor9Index.valueOf(), 0);
            assert.equal(investor9Address.valueOf(), accounts[9]);
        });
    });

    describe('calculateFunds', async () => {
        it("check bonus for 200 and 300 tokens", async function () {
            await instance.changeCoefficient(15000);
            await instance.sendTransaction({value: 20 * (10 ** 18), from: accounts[0]});
            let balance9 = await web3.eth.getBalance(accounts[9]);
            let balance8 = await web3.eth.getBalance(accounts[8]);
            await instance.sendToInvestor(accounts[9], 200 * 10 ** 18);
            await instance.sendToInvestor(accounts[8], 300 * 10 ** 18);

            await instance.calculateFunds([accounts[9], accounts[8]]);

            let balance9After = await web3.eth.getBalance(accounts[9]);
            let balance8After = await web3.eth.getBalance(accounts[8]);

            assert.equal(266666666666666666, balance9After.sub(balance9).valueOf());
            assert.equal(4 * 10 ** 17, balance8After.sub(balance8).valueOf());
        });

        it("calculations starts on 10 ** 16", async function () {
            await instance.changeCoefficient(15000);
            await instance.sendTransaction({value: 20 * (10 ** 18), from: accounts[0]});
            let balance9 = await web3.eth.getBalance(accounts[9]);
            await instance.sendToInvestor(accounts[9], 9 ** 16);

            await instance.calculateFunds([accounts[9]]);

            let balance9After = await web3.eth.getBalance(accounts[9]);

            assert.equal(0, balance9After.sub(balance9).valueOf());
        });

        it("only owner can call", async function () {
            instance.calculateFunds([], {from: accounts[2]}).should.be.rejectedWith('revert');
        });
    });
});
