const from = eth.accounts[0];
const contractDeployer = "0x588aF6d79B96865dc7A0BC98892261D2Cf65d925";
eth.sendTransaction({
  from: from,
  to: contractDeployer,
  value: web3.toWei(100, "ether"),
});
// PK: be44593f36ac74d23ed0e80569b672ac08fa963ede14b63a967d92739b0c8659
