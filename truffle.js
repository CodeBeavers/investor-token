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
            from: "0x9F204bc2561336d3d6A63b76788EE729d4a42daC", // default address to use for any transaction Truffle makes during migrations
            network_id: 4
        }
    }
};
