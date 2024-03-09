// scripts/deploy.js

const hre = require("hardhat");

async function main() {
  const BlackHatCat = await hre.ethers.getContractFactory("BlackHatCat");
  const blackhatcat = await BlackHatCat.deploy({ gasLimit: 5000000 });

  
  await blackhatcat.deployed();
  
  console.log("DAN deployed to:", blackhatcat.address);
  // After deploying the contract, add this line:
    console.log("Transaction hash:", blackhatcat.deployTransaction.hash);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });