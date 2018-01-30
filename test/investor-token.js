const InvestorToken = artifacts.require("InvestorToken");
require('chai').use(require('chai-as-promised')).should();

contract('InvestorToken', accounts => {
    let instance;
    beforeEach(async () => {
        instance = await InvestorToken.new();
    });

    describe('initial tests', () => {
        it("should create 1000 T01", async () => {
            const supply = await instance.totalSupply();
            assert.equal(supply.valueOf(), 1000 * 10 ** 2, "Supply must be 1000");
        });

        it("should create 1000 T01 and put them to the first account", async () => {
            const balance = await instance.balanceOf(accounts[0]);
            assert.equal(balance.valueOf(), 1000 * 10 ** 2, "Balance must be 1000");
        });

        it("can take money", async () =>{
            await instance.sendTransaction({value: 5 * (10 ** 18), from: accounts[5]});
            let balance = await web3.eth.getBalance(instance.address);
            assert.equal(balance.valueOf(), 5 * (10 ** 18));
        });
    });

    describe('transfer', async () => {

        it("allow transfer", async () => {
            //act
            await instance.transfer(accounts[1], 200 * 10 ** 2);

            //assert
            const balance0 = await instance.balanceOf(accounts[0]);
            const balance1 = await instance.balanceOf(accounts[1]);
            assert.equal(balance0.valueOf(), 800 * 10 ** 2);
            assert.equal(balance1.valueOf(), 200 * 10 ** 2);
        });

        it("allow transfer with bonus", async () => {
            //arrange
            await instance.transfer(accounts[1], 200 * 10 ** 2);
            await instance.sendTransaction({value: 5 * (10 ** 18), from: accounts[8]});
            await instance.setByuoutActive(true);
            await instance.setByuoutCount(199 * 10 ** 2);
            await instance.setPriceForBasePart(2 * 10 ** 14);

            //act
            let previousBalanceEther = await web3.eth.getBalance(accounts[1]);
            await instance.transfer(accounts[0], 200 * 10 ** 2, {from: accounts[1]});
            let afterBalanceEther = await web3.eth.getBalance(accounts[1]);

            //assert
            const balance0 = await instance.balanceOf(accounts[0]);
            const balance1 = await instance.balanceOf(accounts[1]);
            assert.equal(balance0.valueOf(), 1000 * 10 ** 2);
            assert.equal(balance1.valueOf(), 0);
            assert.equal(afterBalanceEther.sub(previousBalanceEther).valueOf(), 3.976876 * 10**18);
        });

        it("calculating bonus failing with revert when no ether", async () => {
            //arrange
            await instance.transfer(accounts[1], 200 * 10 ** 2);
            await instance.setByuoutActive(true);
            await instance.setByuoutCount(199 * 10 ** 2);
            await instance.setPriceForBasePart(2 * 10 ** 14);

            //act
            instance.transfer(accounts[0], 200 * 10 ** 2, {from: accounts[1]}).should.be.rejectedWith('revert');
        });

        it("need three flags for calculation bonus", async () => {
            await instance.transfer(accounts[1], 200 * 10 ** 2);
            await instance.transfer(accounts[0], 200 * 10 ** 2, {from: accounts[1]});

            await instance.setByuoutActive(true);
            await instance.transfer(accounts[1], 200 * 10 ** 2);
            await instance.transfer(accounts[0], 200 * 10 ** 2, {from: accounts[1]});


            await instance.setByuoutCount(199 * 10 ** 2);
            await instance.transfer(accounts[1], 200 * 10 ** 2);
            await instance.transfer(accounts[0], 200 * 10 ** 2, {from: accounts[1]});

            const balance0 = await instance.balanceOf(accounts[0]);
            const balance1 = await instance.balanceOf(accounts[1]);
            assert.equal(balance0.valueOf(), 1000 * 10 ** 2);
            assert.equal(balance1.valueOf(), 0);

            await instance.setPriceForBasePart(2 * 10 ** 14);
            await instance.transfer(accounts[1], 200 * 10 ** 2);
            instance.transfer(accounts[0], 200 * 10 ** 2, {from: accounts[1]}).should.be.rejectedWith('revert');
        });

        it("allow transfer. not round numbers", async () => {
            //act
            await instance.transfer(accounts[1], 0.09 * 10 ** 2);

            //assert
            const balance0 = await instance.balanceOf(accounts[0]);
            const balance1 = await instance.balanceOf(accounts[1]);
            assert.equal(balance0.valueOf(), 999.91 * 10 ** 2);
            assert.equal(balance1.valueOf(), 0.09 * 10 ** 2);
        });


        it("should not allow transfer to 0x0", async function () {
            await instance.transfer(0x0, 100 * 10 ** 2).should.be.rejectedWith('revert');
        });

        it("should not allow transfer from to 0x0", async function () {
            await instance.approve(accounts[1], 100 * 10 ** 2);
            await instance.transferFrom(accounts[0], 0x0, 100 * 10 ** 2, {from: accounts[1]}).should.be.rejectedWith('revert');
        });


        it("should allow transferFrom", async function () {
            await instance.approve(accounts[1], 100 * 10 ** 18);
            await instance.transferFrom(accounts[0], accounts[2], 100 * 10 ** 2, {from: accounts[1]});

            const balance0 = await instance.balanceOf(accounts[0]);
            assert.equal(balance0.valueOf(), 900 * 10 ** 2);

            const balance1 = await instance.balanceOf(accounts[2]);
            assert.equal(balance1.valueOf(), 100 * 10 ** 2);

            const balance2 = await instance.balanceOf(accounts[1]);
            assert.equal(balance2.valueOf(), 0);
        });
    });

    describe('modifiers', async () => {
        it("owner can change distributor state. true", async function () {
            await instance.setDistributor(accounts[1], true);

            let state = await instance.distributors(accounts[1]);
            assert.equal(state, true);
        });

        it("owner can change distributor state. false", async function () {
            await instance.setDistributor(accounts[1], true);
            await instance.setDistributor(accounts[1], false);

            let state = await instance.distributors(accounts[1]);
            assert.equal(state, false);
        });

        it("owner can change distributor state. true. 2 entities", async function () {
            await instance.setDistributor(accounts[2], true);
            await instance.setDistributor(accounts[3], true);

            let state = await instance.distributors(accounts[2]);
            let stateSecond = await instance.distributors(accounts[3]);
            assert.equal(state, true);
            assert.equal(stateSecond, true);
        });

        it("only owner can change distributor state", async function () {
            instance.setDistributor(accounts[1], true, {from: accounts[3]}).should.be.rejectedWith('revert');
        });
    });

    describe('sendToInvestor', async () => {

        it("only distributor or owner can sendToInvestor", async function () {
            instance.sendToInvestor(accounts[1], 20 * 10 ** 2, {from: accounts[3]}).should.be.rejectedWith('revert');
        });

        it("sendToInvestor", async function () {
            await instance.setDistributor(accounts[2], true);

            //act
            await instance.sendToInvestor(accounts[9], 200 * 10 ** 2, {from: accounts[2]});

            //assert
            const balance0 = await instance.balanceOf(accounts[0]);
            const balance9 = await instance.balanceOf(accounts[9]);
            assert.equal(balance0.valueOf(), 800 * 10 ** 2);
            assert.equal(balance9.valueOf(), 200 * 10 ** 2);
        });

        it("sendToInvestor. check token holder", async function () {
            await instance.setDistributor(accounts[2], true);

            //act
            await instance.sendToInvestor(accounts[9], 200 * 10 ** 2, {from: accounts[2]});
            await instance.sendToInvestor(accounts[4], 300 * 10 ** 2, {from: accounts[2]});

            //assert
            let investor9Address = await instance.indexedTokenHolders(0);
            let investor4Address = await instance.indexedTokenHolders(1);
            let investor9Index = await instance.tokenHolders(investor9Address);
            let investor4Index = await instance.tokenHolders(investor4Address);
            let tokenHoldersCount = await instance.tokenHoldersCount();

            assert.equal(tokenHoldersCount.valueOf(), 2);
            assert.equal(investor9Index.valueOf(), 0);
            assert.equal(investor4Index.valueOf(), 1);
            assert.equal(investor9Address.valueOf(), accounts[9]);
            assert.equal(investor4Address.valueOf(), accounts[4]);
        });

        it("can't send to 0x0", async function () {
            instance.sendToInvestor(0, 20 * 10 ** 2).should.be.rejectedWith('revert');
        });

        it("can't send more then have", async function () {
            instance.sendToInvestor(accounts[9], 2000 * 10 ** 2).should.be.rejectedWith('revert');
        });

        it("don't add owner to investors", async function () {
            await instance.sendToInvestor(accounts[9], 700 * 10 ** 2);
            await instance.transfer(accounts[0], 700 * 10 ** 2, {from: accounts[9]});

            //assert
            let investor9Address = await instance.indexedTokenHolders(0);
            let investor9Index = await instance.tokenHolders(investor9Address);
            let tokenHoldersCount = await instance.tokenHoldersCount();

            assert.equal(tokenHoldersCount.valueOf(), 1);
            assert.equal(investor9Index.valueOf(), 0);
            assert.equal(investor9Address.valueOf(), accounts[9]);
        });
    });
});
