var Lot = artifacts.require("./Lot.sol");

module.exports = function(deployer) {
  deployer.deploy(Lot);
};
