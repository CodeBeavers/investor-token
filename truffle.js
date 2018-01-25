module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*"
        },
        rinkeby: {
            host: "localhost", // Connect to geth on the specified
            port: 8545,
            from: "0xC5ce18fF493F119cFd5fBDd8506Cf779d74678A2", // default address to use for any transaction Truffle makes during migrations
            network_id: 4
        }
    }
};
