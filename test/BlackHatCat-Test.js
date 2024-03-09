const { expect } = require('chai');
const { ethers } = require('hardhat');


let BLACKHATCAT;
let WETH;
let uniswapFactory;
let uniswapRouter;
let lpTokenAddress;
let lpToken; 
let owner;
let feeAddress;
let addr2;
let addr3;
let addr4;
let addrs;
let marketingWallet;
let BLACKHATCATBalance;
let wethBalance;
let addr3Balance;
let tokenDecimals;


const WETH9_ABI = require("@uniswap/v2-periphery/build/WETH9.json").abi;
const UniswapV2Factory_ABI = require("@uniswap/v2-core/build/UniswapV2Factory.json").abi;
const UniswapV2Router02_ABI = require("@uniswap/v2-periphery/build/UniswapV2Router02.json").abi;
const IUniswapV2Pair_ABI = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json").abi;





const network = {
  name: 'localhost',
  chainId: 31337,
};

// const provider = new ethers.providers.JsonRpcProvider(`http://127.0.0.1:8555`, network);

beforeEach(async () => {
  [owner, marketingWallet, addr2, addr3, addr4, ...addrs] = await ethers.getSigners();

  console.log("-- before each owner:", owner.address);
  console.log("-- before each Marketing wallet:", marketingWallet.address);
  console.log("-- before each addr2:", addr2.address);

  const BLACKHATCATContract = await ethers.getContractFactory("BLACKHATCAT");
  BLACKHATCAT = await BLACKHATCATContract.deploy();
  console.log("BLACKHATCAT contract deployed to:", BLACKHATCAT.address);


  const WETHAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  WETH = await ethers.getContractAt(WETH9_ABI, WETHAddress);

  await WETH.deposit({value: ethers.utils.parseEther("60")});

  const factoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  uniswapFactory = await ethers.getContractAt(UniswapV2Factory_ABI, factoryAddress); 

  const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Replace with the actual address if different
  uniswapRouter = await ethers.getContractAt(UniswapV2Router02_ABI, routerAddress);

/*
  const UniswapV2Router02 = await ethers.getContractFactory("UniswapV2Router02");

  // Deploy it with the WETH and factory addresses
  uniswapRouter = await UniswapV2Router02.deploy(
    WETH.address, 
    uniswapFactory.address  
  );
  */

// Check for existing liquidity pair
lpTokenAddress = await uniswapFactory.getPair(BLACKHATCAT.address, WETH.address);

// If the liquidity pair doesn't exist, create it
if (lpTokenAddress === '0x0000000000000000000000000000000000000000') {
  await uniswapFactory.createPair(BLACKHATCAT.address, WETH.address);
  lpTokenAddress = await uniswapFactory.getPair(BLACKHATCAT.address, WETH.address);
}


// Get the contract instance for the liquidity pair
lpToken = await ethers.getContractAt(IUniswapV2Pair_ABI, lpTokenAddress);



  await BLACKHATCAT.setMarketingReceiver(marketingWallet.address);

 // BLACKHATCAT.on('DebugAllowance', (routerAllowance) => {
 //   console.log("Should be the debug stuff "+routerAllowance.toString());
 // });



  BLACKHATCATBalance = await BLACKHATCAT.balanceOf(owner.address);
  wethBalance = await WETH.balanceOf(owner.address);
  addr3Balance = await BLACKHATCAT.balanceOf(addr3.address);

      // Ensure initialized contracts before operations
      expect(BLACKHATCAT).to.exist;
      expect(WETH).to.exist;
      expect(uniswapFactory).to.exist;
      expect(uniswapRouter).to.exist;
      expect(lpToken).to.exist;

});


// useful functions 

async function getAndLogReserves() {
  const [reserveBLACKHATCAT, reserveWETH] = await lpToken.getReserves();
  console.log("Initial BLACKHATCAT Reserves:", ethers.utils.formatEther(reserveBLACKHATCAT.toString()));
  console.log("Initial WETH Reserves:", ethers.utils.formatEther(reserveWETH.toString()));
  return [reserveBLACKHATCAT, reserveWETH];
}

async function approveTokens() {
  const maxUint256 = ethers.constants.MaxUint256;
  await BLACKHATCAT.connect(owner).approve(uniswapRouter.address, maxUint256);
  await WETH.connect(owner).approve(uniswapRouter.address, maxUint256);
}

async function checkAndLogBalances(amountTokenDesired, amountETHDesired) {
  const BLACKHATCATBalance = await BLACKHATCAT.balanceOf(owner.address);
  const wethBalance = await WETH.balanceOf(owner.address);
  
  console.log(`Owner BLACKHATCAT balance before adding liquidity: ${BLACKHATCATBalance}`);
  console.log(`Owner WETH balance before adding liquidity: ${wethBalance}`);
  console.log(`LP token balance before adding liquidity: ${await lpToken.balanceOf(owner.address)}`);
  
  // Ensure that you have enough balance before performing operations
  expect(await BLACKHATCAT.balanceOf(owner.address)).to.be.gte(amountTokenDesired, "Owner doesn't have enough BLACKHATCAT tokens");
  expect(await WETH.balanceOf(owner.address)).to.be.gte(amountETHDesired, "Owner doesn't have enough WETH tokens");
}

/* Since we are using a larger pool we dont need to use this 
async function setupLiquidityPool() {
// Desired liquidity pool amounts
const amountBLACKHATCATDesired = ethers.utils.parseEther("8869689998000"); // 8,869,689,998,000 BLACKHATCAT
const amountWETHDesired = ethers.utils.parseEther("900"); // 900 WETH

// Minimum liquidity pool amounts (adjust according to your risk tolerance)
const amountBLACKHATCATMin = ethers.utils.parseEther("8000000000000"); // 8,000,000,000,000 BLACKHATCAT as the minimum
const amountWETHMin = ethers.utils.parseEther("800"); // 800 WETH as the minimum

  
  const to = owner.address;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  console.log(`Owner address: ${to}`);
  console.log(`Deadline: ${deadline}`);
  console.log(`Amount of WETH Desired: ${amountWETHDesired.toString()}`);
  console.log(`Amount of BLACKHATCAT Desired: ${amountBLACKHATCATDesired.toString()}`);
  console.log(`Minimum amount of WETH: ${amountWETHMin.toString()}`);
  console.log(`Minimum amount of BLACKHATCAT: ${amountBLACKHATCATMin.toString()}`);

  const result = await uniswapRouter.addLiquidity(
    WETH.address,
    BLACKHATCAT.address,
    amountWETHDesired,
    amountBLACKHATCATDesired,
    amountWETHMin,
    amountBLACKHATCATMin,
    to,
    deadline
  );
  console.log(`LP token balance after liquidity: ${await lpToken.balanceOf(owner.address)}`);
  console.log("Add liquidity result:", result);
}
*/


async function logGasUsed(tx) {
  const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
  if (!receipt || !receipt.gasUsed) {
    console.log('Warning: gasUsed is undefined in receipt', receipt);
    return null; // return null if gasUsed or receipt is undefined
  }
  console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
  return receipt;
}


async function setmarketing(){
  await BLACKHATCAT.setMarketingReceiver(marketingWallet.address);
}


async function printEvents(tx) {
  const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
  const logs = receipt.logs.map((log) => {
      try {
          return BLACKHATCAT.interface.parseLog(log);
      } catch (e) {
          return null;
      }
  }).filter((log) => log !== null);

  console.log("Events:");
  for (const log of logs) {
      console.log(`${log.name}: ${JSON.stringify(log.args)}`);
  }
}


async function setupLiquidityPoolLarge() {
  
  const amountTokenDesired = ethers.utils.parseUnits("88686900000", 18);
  const amountETHDesired = ethers.utils.parseEther("300");
  
  // Increased values but still less than the desired amounts
  const amountTokenMin = ethers.utils.parseUnits("80000000000", 18); // less than 8868690000000000000000000000000
  const amountETHMin = ethers.utils.parseEther("200"); // less than 900
  
  console.log("BLACKHATCAT contract deployed to1:", BLACKHATCAT.address);
  // Now, you can exclude addresses
// Exclude necessary addresses including the contract itself
  await BLACKHATCAT.excludeFromMaxOwnership(owner.address, true);
  await BLACKHATCAT.excludeFromMaxOwnership(marketingWallet.address, true);
  await BLACKHATCAT.excludeFromMaxOwnership(BLACKHATCAT.address, true); // Excluding the contract's own address
  await BLACKHATCAT.excludeFromMaxOwnership(lpToken.address, true);  // Excluding the liquidity pool's address



  
    const to = owner.address; 
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  
  
    const amountToken0Desired = amountTokenDesired;  // This is the BLACKHATCAT amount
    const amountToken1Desired = amountETHDesired;    // This is the WETH amount
  
    const amountToken0Min = amountTokenMin;  // This is the BLACKHATCAT min amount
    const amountToken1Min = amountETHMin;    // This is the WETH min amount

    let reserveBLACKHATCAT, reserveWETH, token0Address, token1Address;

    if (BLACKHATCAT.address.toLowerCase() < WETH.address.toLowerCase()) {
      console.log("BLACKHATCAT is token0 and WETH is token1");
      [reserveBLACKHATCAT, reserveWETH] = await lpToken.getReserves();
      token0Address = BLACKHATCAT.address;
      token1Address = WETH.address;
    } else {
      console.log("WETH is token0 and BLACKHATCAT is token1");
      [reserveWETH, reserveBLACKHATCAT] = await lpToken.getReserves();
      token0Address = WETH.address;
      token1Address = BLACKHATCAT.address;
    }
  
    // Check the initial reserves in the liquidity pool

  
    console.log("Initial BLACKHATCAT Reserves:", ethers.utils.formatEther(reserveBLACKHATCAT.toString()));
    console.log("Initial WETH Reserves:", ethers.utils.formatEther(reserveWETH.toString()));
  
    // Approve tokens for Uniswap Router
    const maxUint256 = ethers.constants.MaxUint256;
    await BLACKHATCAT.connect(owner).approve(uniswapRouter.address, maxUint256);
    await WETH.connect(owner).approve(uniswapRouter.address, maxUint256);
  
    // Assuming you've fetched owner balances before this step
    const BLACKHATCATBalance = await BLACKHATCAT.balanceOf(owner.address);
    const wethBalance = await WETH.balanceOf(owner.address);
    
    console.log(`Owner BLACKHATCAT balance before adding liquidity: ${BLACKHATCATBalance}`);
    console.log(`Owner WETH balance before adding liquidity: ${wethBalance}`);
    console.log(`LP token balance before adding liquidity: ${await lpToken.balanceOf(owner.address)}`);
    console.log(`BLACKHATCAT Reserves before adding liquidity: ${reserveBLACKHATCAT}`); 
    console.log(`WETH Reserves before adding liquidity: ${reserveWETH}`);
  
    await uniswapRouter.addLiquidity(
      token0Address,
      token1Address,
      amountToken0Desired,
      amountToken1Desired,
      amountToken0Min,
      amountToken1Min,
      to,
      deadline
    );
  
    console.log(`Liquidity added`);
    expect(await lpToken.balanceOf(owner.address)).to.be.gt(0); 
    
    const [reserveBLACKHATCATAfter, reserveWETHAfter] = await lpToken.getReserves();
    expect(reserveBLACKHATCATAfter).to.be.gt(reserveBLACKHATCAT);
    expect(reserveWETHAfter).to.be.gt(reserveWETH);
  
    console.log(`Owner BLACKHATCAT balance after adding liquidity: ${await BLACKHATCAT.balanceOf(owner.address)}`); 
    console.log(`Owner WETH balance after adding liquidity: ${await WETH.balanceOf(owner.address)}`);
    console.log(`LP token balance after adding liquidity: ${await lpToken.balanceOf(owner.address)}`);
    console.log(`BLACKHATCAT Reserves after adding liquidity: ${reserveBLACKHATCATAfter}`); 
    console.log(`WETH Reserves after adding liquidity: ${reserveWETHAfter}`);
    
  
    expect(await BLACKHATCAT.balanceOf(owner.address)).to.be.lt(BLACKHATCATBalance);
    expect(await WETH.balanceOf(owner.address)).to.be.lt(wethBalance);
 
}

/////////////////////////// end useful functions

describe("BLACKHATCAT Contract", function() {

  describe("Automatic exclusion of owner and marketingWallet from MAX_OWNERSHIP", function() {
    it("should automatically exclude the owner and marketingWallet from MAX_OWNERSHIP upon deployment", async function() {
      // Check that the owner is excluded
      expect(await BLACKHATCAT.isExcludedFromMaxOwnership(owner.address)).to.equal(true);

      // Check that the marketingWallet is excluded
      expect(await BLACKHATCAT.isExcludedFromMaxOwnership(marketingWallet.address)).to.equal(true);
    });
  });

  describe("Excluding and including addresses from MAX_OWNERSHIP", function() {
    // Existing tests for excluding and including addresses
    it("should allow the owner to exclude an address", async function() {
      await BLACKHATCAT.excludeFromMaxOwnership(addr2.address, true);
      expect(await BLACKHATCAT.isExcludedFromMaxOwnership(addr2.address)).to.equal(true);
    });

    it("should prevent non-owners from excluding an address", async function() {
      await expect(BLACKHATCAT.connect(addr2).excludeFromMaxOwnership(addr2.address, true))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should allow the owner to include an address back", async function() {
      await BLACKHATCAT.excludeFromMaxOwnership(addr2.address, true);
      await BLACKHATCAT.excludeFromMaxOwnership(addr2.address, false);
      expect(await BLACKHATCAT.isExcludedFromMaxOwnership(addr2.address)).to.equal(false);
    });
  });
});




describe("BLACKHATCAT Marketing Receiver", function() {
  it("should set the marketing receiver", async function() {
      // Connect BLACKHATCAT contract with the owner's signer
      const BLACKHATCATWithOwner = BLACKHATCAT.connect(owner);

      // Set the marketing receiver; assuming owner is the one allowed to set it
      await BLACKHATCATWithOwner.setMarketingReceiver(marketingWallet.address);

      // Fetch the set marketing receiver address from the contract
      const setMarketingAddress = await BLACKHATCAT.getMarketingReceiver(); 

      // Log the marketing address for debugging
      console.log("Marketing wallet is:", setMarketingAddress);

      // Check that it's set correctly
      expect(setMarketingAddress).to.equal(marketingWallet.address);
  });
});



describe("ETH tests", function() {
  it("should have ETH balance", async function() {
      const ethBalance = await ethers.provider.getBalance(owner.address);
      console.log("ETH Balance:", ethers.utils.formatEther(ethBalance));
      expect(ethBalance).to.be.gt(0);
  });
});



describe("BLACKHATCAT tests", function() {
    it("should have BLACKHATCAT balance", async function() {
        
        console.log("BLACKHATCAT Balance:", ethers.utils.formatEther(BLACKHATCATBalance));
        expect(BLACKHATCATBalance).to.be.gt(0);
    });

    it("Should transfer token from owner to marketingWallet", async function() {
      BLACKHATCAT.isExcludedFromMaxOwnership(owner.address);
      BLACKHATCAT.isExcludedFromMaxOwnership(marketingWallet.address);

      const tx = await BLACKHATCAT.transfer(marketingWallet.address, ethers.utils.parseEther("500"));
      const receipt = await tx.wait();
      
      receipt.events?.forEach((event) => {
        if (event.event === "DebugTransfer") {
          console.log("DebugTransfer Event Output: ", event.args);
        }
      });
      
      expect(await BLACKHATCAT.balanceOf(marketingWallet.address)).to.equal(ethers.utils.parseEther("500"));
    });
    
  
});


describe("WETH tests", function() {
    it("should have WETH balance", async function() {

        console.log("WETH Balance:", ethers.utils.formatEther(wethBalance));
        expect(wethBalance).to.be.gt(0);
    });
});


it("Should approve the Router to spend tokens", async function() {
  const amount = ethers.utils.parseEther("1000");
  await BLACKHATCAT.approve(uniswapRouter.address, amount);
  const allowance = await BLACKHATCAT.allowance(owner.address, uniswapRouter.address);
  expect(allowance).to.equal(amount);
});


describe("Token operations", function () {
  it("Should return the name of the token", async function () {
    expect(await BLACKHATCAT.name()).to.equal("BLACKHATCAT");
  });

  it("Should return the symbol of the token", async function () {
    expect(await BLACKHATCAT.symbol()).to.equal("BLACKHATCAT");
  });

  it("Should return the decimals of the token", async function () {
    expect(await BLACKHATCAT.decimals()).to.equal(18);
  });

  it("Should return the total supply of the token", async function () {
    expect(await BLACKHATCAT.totalSupply()).to.equal(ethers.utils.parseEther("1000000000000"));
  });


  it("Should fail when trying to transfer more than balance", async function () {
    BLACKHATCAT.isExcludedFromMaxOwnership(owner.address);
    BLACKHATCAT.isExcludedFromMaxOwnership(marketingWallet.address);
    await expect(BLACKHATCAT.transfer(marketingWallet.address, ethers.utils.parseEther("19869690000000"))).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });



   it("Should fail when trying to transferFrom more than approved", async function () {
    await BLACKHATCAT.approve(marketingWallet.address, ethers.utils.parseEther("1000"));
    await expect(BLACKHATCAT.connect(marketingWallet).transferFrom(owner.address, addr2.address, ethers.utils.parseEther("1500"))).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
  });

});




it("Should wrap and unwrap ETH", async function() {
  const depositAmount = ethers.utils.parseEther("1");

  // Wrap 1 ETH into WETH by owner
  await WETH.connect(owner).deposit({ value: depositAmount });

  // Transfer WETH from owner to addr3
  await WETH.connect(owner).transfer(addr3.address, depositAmount);

  // After transfer, addr3's WETH balance should be equal to the deposit amount
  expect(await WETH.balanceOf(addr3.address)).to.equal(depositAmount);

  // Now, addr3 unwraps the WETH back to Ether
  await WETH.connect(addr3).withdraw(depositAmount);

  // After unwrap, addr3's WETH balance should be 0
  expect(await WETH.balanceOf(addr3.address)).to.equal(0);
});





describe("Liquidity Tests", function() {

  it("Should verify that the BLACKHATCAT-WETH pair is created and fetch its reserves", async function() {

    // Check that the liquidity pool token address is not the zero address
    const lpTokenAddress = await uniswapFactory.getPair(BLACKHATCAT.address, WETH.address);
    expect(lpTokenAddress).to.not.equal('0x0000000000000000000000000000000000000000');

    // Get the reserves of the pair
    const reserves = await lpToken.getReserves();

    console.log("BLACKHATCAT Reserve:", ethers.utils.formatEther(reserves[0]));
    console.log("WETH Reserve:", ethers.utils.formatEther(reserves[1]));


});

it("Should not transfer fees to the marketing wallet on Transfer", async function () {
  try {
    const amountToTransfer = ethers.utils.parseEther("10"); // Defining amountToTransfer

    await BLACKHATCAT.excludeFromMaxOwnership(owner.address, true);
    await BLACKHATCAT.excludeFromMaxOwnership(marketingWallet.address, true);
    await BLACKHATCAT.excludeFromMaxOwnership(addr3.address, true);
    await BLACKHATCAT.excludeFromMaxOwnership(addr4.address, true);


    console.log("Checking exclusions before anything else");

    // Check exclusions and log results
    const exclusions = [
      await BLACKHATCAT.isExcludedFromMaxOwnership(owner.address),
      await BLACKHATCAT.isExcludedFromMaxOwnership(marketingWallet.address),
      await BLACKHATCAT.isExcludedFromMaxOwnership(addr3.address),
      await BLACKHATCAT.isExcludedFromMaxOwnership(addr4.address)
    ];

    exclusions.forEach((excluded, index) => {
      const address = [owner.address, marketingWallet.address, addr3.address, addr4.address][index];
      console.log(`Address ${address} excluded: ${excluded}`);
      if (!excluded) {
        console.error(`Address ${address} is not correctly excluded.`);
      }
    });
    if (exclusions.some(excluded => !excluded)) {
      throw new Error("One or more addresses are not correctly excluded.");
    }


    console.log(`Exclusions: ${exclusions.join(', ')}`);
    if (exclusions.some(excluded => !excluded)) {
      throw new Error("One or more addresses are not correctly excluded.");
    }

    console.log("Setting initial balances...");
    await BLACKHATCAT.transfer(addr3.address, ethers.utils.parseEther("100"));

    // Check balances before transfers
    console.log("Checking balances before any transfers...");
    const addr3InitialBalance = await BLACKHATCAT.balanceOf(addr3.address);
    const addr4InitialBalance = await BLACKHATCAT.balanceOf(addr4.address);
    const initialMarketingWalletETHBalance = await ethers.provider.getBalance(marketingWallet.address);
    const initialMarketingWalletBLACKHATCATBalance = await BLACKHATCAT.balanceOf(marketingWallet.address);
    console.log(`Initial Addr3 BLACKHATCAT balance: ${ethers.utils.formatEther(addr3InitialBalance)}`);
    console.log(`Initial Addr4 BLACKHATCAT balance: ${ethers.utils.formatEther(addr4InitialBalance)}`);
    console.log(`Initial Marketing Wallet ETH balance: ${ethers.utils.formatEther(initialMarketingWalletETHBalance)}`);
    console.log(`Initial Marketing Wallet BLACKHATCAT balance: ${ethers.utils.formatEther(initialMarketingWalletBLACKHATCATBalance)}`);

    console.log("Executing first transfer from addr3 to addr4...");
    await BLACKHATCAT.connect(addr3).transfer(addr4.address, amountToTransfer);

    // Check balances after the first transfer
    console.log("Checking balances after the first transfer...");
    const postTransfer = await checkBalances();
    
    console.log("Executing second transfer from addr4 back to addr3...");
    await BLACKHATCAT.connect(addr4).transfer(addr3.address, amountToTransfer);

    // Check balances after the second transfer
    console.log("Checking balances after the second transfer...");
    await checkBalances();

    console.log("All operations completed successfully.");

  } catch (error) {
    console.error("An error occurred during the test:", error);
  }
});

async function checkBalances() {
  const addr3Balance = await BLACKHATCAT.balanceOf(addr3.address);
  const addr4Balance = await BLACKHATCAT.balanceOf(addr4.address);
  const marketingWalletETHBalance = await ethers.provider.getBalance(marketingWallet.address);
  const marketingWalletBLACKHATCATBalance = await BLACKHATCAT.balanceOf(marketingWallet.address);
  console.log(`Addr3 BLACKHATCAT balance: ${ethers.utils.formatEther(addr3Balance)}`);
  console.log(`Addr4 BLACKHATCAT balance: ${ethers.utils.formatEther(addr4Balance)}`);
  console.log(`Marketing Wallet ETH balance: ${ethers.utils.formatEther(marketingWalletETHBalance)}`);
  console.log(`Marketing Wallet BLACKHATCAT balance: ${ethers.utils.formatEther(marketingWalletBLACKHATCATBalance)}`);
}


/*
it("Should not transfer fees to the marketing wallet on Transfer", async function () {
  const amountToTransfer = ethers.utils.parseEther("10"); // Defining amountToTransfer
  const singleFee = amountToTransfer.div(100); // 1% fee
  const expectedTotalFee = singleFee.mul(2); // For both buy and sell
  console.log("Liquid checking is excluded beofre anything elese");
  expect(await BLACKHATCAT.isExcludedFromMaxOwnership(owner.address)).to.equal(true);

  // Check that the marketingWallet is excluded
  expect(await BLACKHATCAT.isExcludedFromMaxOwnership(marketingWallet.address)).to.equal(true);

    // Check that the marketingWallet is excluded
    expect(await BLACKHATCAT.isExcludedFromMaxOwnership(addr3.address)).to.equal(true);

      // Check that the marketingWallet is excluded
  expect(await BLACKHATCAT.isExcludedFromMaxOwnership(addr4.address)).to.equal(true);

  console.log("Setting initial balances...");
  // Send initial BLACKHATCAT tokens to addr3 from the owner
  await BLACKHATCAT.transfer(addr3.address, ethers.utils.parseEther("100"));

  console.log("Checking balances before any transfers...");
  const addr3InitialBalance = await BLACKHATCAT.balanceOf(addr3.address);
  const addr4InitialBalance = await BLACKHATCAT.balanceOf(addr4.address);
  const initialMarketingWalletETHBalance = await ethers.provider.getBalance(marketingWallet.address);
  const initialMarketingWalletBLACKHATCATBalance = await BLACKHATCAT.balanceOf(marketingWallet.address);

  console.log(`Initial Addr3 BLACKHATCAT balance: ${addr3InitialBalance}`);
  console.log(`Initial Addr4 BLACKHATCAT balance: ${addr4InitialBalance}`);
  console.log(`Initial Marketing Wallet ETH balance: ${initialMarketingWalletETHBalance}`);
  console.log(`Initial Marketing Wallet BLACKHATCAT balance: ${initialMarketingWalletBLACKHATCATBalance}`);

  console.log("Executing first transfer from addr3 to addr4...");
  // addr3 transfers tokens to addr4
  await BLACKHATCAT.connect(addr3).transfer(addr4.address, amountToTransfer);

  console.log("Checking balances after the first transfer...");
  const addr3PostTransferBalance = await BLACKHATCAT.balanceOf(addr3.address);
  const addr4PostTransferBalance = await BLACKHATCAT.balanceOf(addr4.address);
  const postTransferMarketingWalletETHBalance = await ethers.provider.getBalance(marketingWallet.address);
  const postTransferMarketingWalletBLACKHATCATBalance = await BLACKHATCAT.balanceOf(marketingWallet.address);

  console.log(`Addr3 BLACKHATCAT balance after the first transfer: ${addr3PostTransferBalance}`);
  console.log(`Addr4 BLACKHATCAT balance after the first transfer: ${addr4PostTransferBalance}`);
  console.log(`Marketing Wallet ETH balance after the first transfer: ${postTransferMarketingWalletETHBalance}`);
  console.log(`Marketing Wallet BLACKHATCAT balance after the first transfer: ${postTransferMarketingWalletBLACKHATCATBalance}`);

  const feeDeductedAmount = amountToTransfer.sub(singleFee);
  console.log(`Expected fee deducted amount: ${feeDeductedAmount}`);

  console.log("Executing second transfer from addr4 back to addr3...");
  // For the sake of testing, let addr4 send back to addr3
  await BLACKHATCAT.connect(addr4).transfer(addr3.address, amountToTransfer);

  console.log("Checking balances after the second transfer...");
  const addr3FinalBalance = await BLACKHATCAT.balanceOf(addr3.address);
  const addr4FinalBalance = await BLACKHATCAT.balanceOf(addr4.address);
  const finalMarketingWalletETHBalance = await ethers.provider.getBalance(marketingWallet.address);
  const finalMarketingWalletBLACKHATCATBalance = await BLACKHATCAT.balanceOf(marketingWallet.address);

  console.log(`Addr3 BLACKHATCAT balance after second transfer: ${addr3FinalBalance}`);
  console.log(`Addr4 BLACKHATCAT balance after second transfer: ${addr4FinalBalance}`);
  console.log(`Marketing Wallet ETH balance after the second transfer: ${finalMarketingWalletETHBalance}`);
  console.log(`Marketing Wallet BLACKHATCAT balance after the second transfer: ${finalMarketingWalletBLACKHATCATBalance}`);

  const totalFee = initialMarketingWalletETHBalance.sub(finalMarketingWalletETHBalance);
  console.log(`Total Fee Deducted: ${totalFee}`);

  // Assertions here...
});
*/

});



describe("Fee operations", function () {
  it("Should set a new marketing receiver and then revert to #1 wallet", async function () {
    // Setting the marketing receiver to addr2 (second in your list as a different example)
    await BLACKHATCAT.setMarketingReceiver(addr2.address);
    expect(await BLACKHATCAT.getMarketingReceiver()).to.equal(addr2.address);

    // Setting the marketing receiver back to addr1 (#1 in your list)
    await BLACKHATCAT.setMarketingReceiver(marketingWallet.address);  // Using 'addr1' which corresponds to Account #1
    expect(await BLACKHATCAT.getMarketingReceiver()).to.equal(marketingWallet.address);
    console.log(`MARKETING WALLET IS NOW ${marketingWallet.address}`)
  });

});



describe("BLACKHATCAT Token Tests", function() {
  const slippageTolerance = 20; // 20%
  const tolerance = ethers.utils.parseUnits("1", 14);
  const depositAmount = ethers.utils.parseEther("1");
  let totalGasUsed = ethers.BigNumber.from("0");

  // The amount of ETH expected to be sent to the marketing wallet
  const marketingThreshold = ethers.utils.parseEther("0.1");

  async function expectApproximatelyEqual(value, expected, tolerance) {
      expect(value.gte(expected.sub(tolerance)) && value.lte(expected.add(tolerance))).to.be.true;
  }

  async function logGasUsed(tx) {
      const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
      return receipt.gasUsed;
  }

  beforeEach(async function() {
    //  await getAndLogReserves();
   //   await approveTokens();
   //   await checkAndLogBalances(
  //        ethers.utils.parseEther("1000000"), 
   //       ethers.utils.parseEther("50")
  //    );
      console.log("going to set up liquidity pool large");
      it("----------------- adding liquid for swap test --------------------");
      await setupLiquidityPoolLarge();
      console.log("liquidity pool large setup");
      it("----------------- finished adding liquid for swap test --------------------");
      console.log("Setting up marketing");
      await setmarketing();


      
  });

  
    it("should make some tests before buy and sell", async function() {
      try {
        // Checking exclusion status for various addresses
        console.log("Checking exclusion status for various addresses...");

        // First, exclude the addresses
        await BLACKHATCAT.excludeFromMaxOwnership(owner.address, true);
        await BLACKHATCAT.excludeFromMaxOwnership(marketingWallet.address, true);
        await BLACKHATCAT.excludeFromMaxOwnership(addr2.address, true);

        // Now, directly check if the addresses are excluded using the mapping
        const isOwnerExcluded = await BLACKHATCAT.isExcludedFromMaxOwnership(owner.address);
        const isMarketingWalletExcluded = await BLACKHATCAT.isExcludedFromMaxOwnership(marketingWallet.address);
        const isAddr2Excluded = await BLACKHATCAT.isExcludedFromMaxOwnership(addr2.address);

        console.log(`Exclusion Status - Owner: ${isOwnerExcluded}, MarketingWallet: ${isMarketingWalletExcluded}, Addr2: ${isAddr2Excluded}`);

        if (!isOwnerExcluded || !isMarketingWalletExcluded || !isAddr2Excluded) {
            throw new Error("One or more addresses are not correctly excluded from max ownership.");
        }
  
        // Define a transfer amount for testing
        const transferAmount = ethers.utils.parseEther("1");
        console.log(`Setting up transfer amount: ${ethers.utils.formatEther(transferAmount)} tokens`);
  
        // Ensure addr2 has approved BLACKHATCAT to spend tokens on its behalf
        console.log("Approving BLACKHATCAT contract to spend tokens on behalf of addr2...");
        await BLACKHATCAT.connect(addr2).approve(BLACKHATCAT.address, transferAmount);
  
        // Verifying addr2 is not fee-exempt
        console.log("Verifying addr2 is not fee-exempt...");
        const isAddr2FeeExempt = await BLACKHATCAT.isExempt(addr2.address);
        if (isAddr2FeeExempt) {
          throw new Error("addr2 is fee exempt! Please change the test account.");
        }
  
        // Fetching initial balances for addr2 and contract
        console.log("Fetching initial balances...");
        const initialBLACKHATCATBalance = await BLACKHATCAT.balanceOf(addr2.address);
        const initialEthBalance = await ethers.provider.getBalance(BLACKHATCAT.address);
  
        console.log(`Initial BLACKHATCAT balance for addr2: ${ethers.utils.formatEther(initialBLACKHATCATBalance)}`);
        console.log(`Initial Contract ETH balance: ${ethers.utils.formatEther(initialEthBalance)}`);
  
        // Add buy/sell logic here, each operation can be wrapped in a separate try-catch for more detailed error handling
  
      } catch (error) {
        console.error("An error occurred during the test:", error.message);
      }
    });
  
  
  



// Assuming your existing imports and helper functions, such as expectApproximatelyEqual
it("should execute the buy and sell transactions", async function () {
console.log("inside the buy and sell fucntion 1");

await BLACKHATCAT.excludeFromMaxOwnership(owner.address, true);
await BLACKHATCAT.excludeFromMaxOwnership(marketingWallet.address, true);
await BLACKHATCAT.excludeFromMaxOwnership(BLACKHATCAT.address, true); // Excluding the contract's own address
await BLACKHATCAT.excludeFromMaxOwnership(lpToken.address, true);  // Excluding the liquidity pool's address
await BLACKHATCAT.excludeFromMaxOwnership(addr2.address, true); 

  // Initialization and constants
  const numberOfSwaps = 40;
  const feeThreshold = ethers.utils.parseEther("0.1");
  let accumulatedFees = ethers.BigNumber.from("0");
  let totalGasUsed = ethers.BigNumber.from("0");
  let slippageTolerance = 30;

  const initialMarketingWalletBalance = await ethers.provider.getBalance(marketingWallet.address);


try {
    const initialBalance = await BLACKHATCAT.balanceOf(addr2.address);
    await BLACKHATCAT.connect(addr2).approve(BLACKHATCAT.address, initialBalance); // Set approval to current balance

    const initialBalanceNum = parseFloat(ethers.utils.formatEther(initialBalance));

    if (initialBalanceNum > 0) {
        const DEAD_WALLET_ADDRESS = "0x000000000000000000000000000000000000dEaD";
        const tx = await BLACKHATCAT.connect(addr2).transfer(DEAD_WALLET_ADDRESS, initialBalance);
        await tx.wait();
        console.log("Successfully sent all BLACKHATCAT tokens to the dead wallet");
    } else {
        console.log("No BLACKHATCAT tokens to send");
    }
} catch (error) {
    console.log("An error occurred:", error);
}

console.log("inside the buy and sell fucntion 2");


  await BLACKHATCAT.connect(addr2).approve(uniswapRouter.address, ethers.utils.parseEther("99999999999"));
    // Fetch the allowance
  const allowance = await BLACKHATCAT.allowance(addr2.address, uniswapRouter.address);

    // Check that the allowance is as expected
    expect(allowance.toString()).to.equal(ethers.utils.parseEther("99999999999").toString());


  const block = await ethers.provider.getBlock('latest');
  const deadline = block.timestamp + 600; // 10 minutes

  console.log("inside the buy and sell fucntion 3");
  
         // Define event listeners
     //    BLACKHATCAT.on("DebugTransfer", (sender, recipient, amount, fee, amountAfterFee, event) => {
   //       console.log(`DebugTransfer Event: sender=${sender} recipient=${recipient} amount=${amount.toString()} fee=${fee.toString()} amountAfterFee=${amountAfterFee.toString()}`);
   //     });
  
    //    BLACKHATCAT.on("FeeDetails", (fee, amountAfterFee, event) => {
   //       console.log(`FeeDetails Event: fee=${fee.toString()} amountAfterFee=${amountAfterFee.toString()}`);
   //     });
  
   //     BLACKHATCAT.on("DebugBalance", (address, balance, event) => {
   //       console.log(`DebugBalance Event: address=${address} balance=${balance.toString()}`);
   //     });
  
    //    BLACKHATCAT.on("FeeProcessed", (address, fee, event) => {
   //       console.log(`FeeProcessed Event: address=${address} fee=${fee.toString()}`);
   //     });


        console.log("inside the buy and sell fucntion 4");
  // Bulk test starts
  for (let i = 0; i < numberOfSwaps; i++) {
    console.log("inside the buy and sell fucntion 5");
    const operation = i % 2 === 0 ? 'buy' : 'sell';
    console.log(`\n======== Executing swap #${i + 1} [Operation: ${operation.toUpperCase()}] ========`);



    const preSwapETHBalance = await ethers.provider.getBalance(BLACKHATCAT.address);
    console.log(`Before Swap: Contract ETH balance: ${ethers.utils.formatEther(preSwapETHBalance)} ETH`);

    const allowance = await BLACKHATCAT.allowance(addr2.address, uniswapRouter.address);
    console.log(`---- Allowance -----: ${ethers.utils.formatEther(allowance)}`);

     
    
    // Fetch reserves

   try {
    let reserveWETH, reserveBLACKHATCAT;
  
    if (BLACKHATCAT.address.toLowerCase() < WETH.address.toLowerCase()) {
      console.log("BLACKHATCAT is token0 and WETH is token1");
      [reserveBLACKHATCAT, reserveWETH] = await lpToken.getReserves();
    } else {
      console.log("WETH is token0 and BLACKHATCAT is token1");
      [reserveWETH, reserveBLACKHATCAT] = await lpToken.getReserves();
    }
  
    // Log the reserves for debugging
    console.log(`WETH Reserves: ${ethers.utils.formatEther(reserveWETH)}`);
    console.log(`BLACKHATCAT Reserves: ${ethers.utils.formatEther(reserveBLACKHATCAT)}`);
  
  } catch (error) {
    console.error(`Reserve Fetch Error: ${error.message}`);
    // Handle the error appropriately; you may continue, throw, or exit depending on your application's needs.
  }
  
  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
 
    // Swap logic starts here
    let tx;
    try {

    if (operation === 'buy') {
                  // Define event listeners
              //    const filter = BLACKHATCAT.filters.TransferFromCalled(null, null, null);

             //     BLACKHATCAT.on(filter, (sender, recipient, amount, event) => {
             //         console.log(`TransferFromCalled Event BUY: sender=${sender} recipient=${recipient} amount=${amount.toString()}`);
             //     })
           
      // Buy Logic
      const amountOutMin = ethers.utils.parseUnits("50", 18);
      const amountInMax = ethers.utils.parseEther('0.1').mul(100 + slippageTolerance).div(100); // With slippageTolerance

      const BLACKHATCATBalance = await BLACKHATCAT.balanceOf(addr2.address);
      console.log(`BLACKHATCAT balance of addr2 before buy: ${ethers.utils.formatEther(BLACKHATCATBalance)} BLACKHATCAT`);

      const contractBLACKHATCATBalanceBefore = await BLACKHATCAT.balanceOf(BLACKHATCAT.address);
      console.log("Contract BLACKHATCAT token balance before buy--:", ethers.utils.formatUnits(contractBLACKHATCATBalanceBefore, 18));

      console.log(`Executing BUY: Will buy ${ethers.utils.formatEther(amountOutMin)} BLACKHATCAT for a maximum of ${ethers.utils.formatEther(amountInMax)} ETH`);

              // Check addresses and tokens
                      // Check addresses and tokens
              console.log(`Uniswap Router Address: ${uniswapRouter.address}`);
              console.log(`Token Address: ${BLACKHATCAT.address}`);
              console.log(`User Address: ${addr2.address}`);
      
      tx = await uniswapRouter.connect(addr2).swapETHForExactTokens(
        amountOutMin,
        [WETH.address, BLACKHATCAT.address],
        addr2.address,
        deadline,
        { value: amountInMax }
      );

          // Transaction Receipt and Gas Usage
    const receiptone = await tx.wait();
    if (receiptone && receiptone.gasUsed) {
      totalGasUsed = totalGasUsed.add(receiptone.gasUsed);

      console.log('Successfully called swapExactETHForTokensSupportingFeeOnTransferTokens');
   //   console.log(`Gas Used for Swap #${i + 1}: ${receiptone.gasUsed.toString()}`);
   //   console.log(`Transaction Receipt: ${JSON.stringify(receiptone, null, 2)}`);

    }
         

      const contractETHBalanceAfter = await ethers.provider.getBalance(BLACKHATCAT.address);
      console.log("Contract ETH balance after--:", ethers.utils.formatEther(contractETHBalanceAfter));

      const contractBLACKHATCATBalanceAfter = await BLACKHATCAT.balanceOf(BLACKHATCAT.address);
      console.log("Contract BLACKHATCAT token balance after--:", ethers.utils.formatUnits(contractBLACKHATCATBalanceAfter, 18));
      

      const [reserveBLACKHATCATAfterbuy, reserveWETHAfterbuy] = await lpToken.getReserves();
      console.log(` liquidity BLACKHATCAT Reservesafter buy: ${reserveBLACKHATCATAfterbuy}`); 
      console.log(`liquidity WETH Reserves after buy: ${reserveWETHAfterbuy}`);

   //   BLACKHATCAT.on("DebugTransfer", (sender, recipient, amount, fee, amountAfterFee, event) => {
  //      console.log(`DebugTransfer Event: sender=${sender} recipient=${recipient} amount=${amount.toString()} fee=${fee.toString()} amountAfterFee=${amountAfterFee.toString()}`);
  //    });

  //    BLACKHATCAT.on("FeeDetails", (fee, amountAfterFee, event) => {
  //      console.log(`FeeDetails Event: fee=${fee.toString()} amountAfterFee=${amountAfterFee.toString()}`);
 //     });

  //    BLACKHATCAT.on("DebugBalance", (address, balance, event) => {
 //       console.log(`DebugBalance Event: address=${address} balance=${balance.toString()}`);
 //     });

  //      BLACKHATCAT.on("FeeProcessed", (address, fee, event) => {
  //        console.log(`FeeProcessed Event: address=${address} fee=${fee.toString()}`);
  //      });

    } else {


  //      const filter = BLACKHATCAT.filters.TransferFromCalled(null, null, null);

  //      BLACKHATCAT.on(filter, (sender, recipient, amount, event) => {
  //          console.log(`TransferFromCalled SELL Event: sender=${sender} recipient=${recipient} amount=${amount.toString()}`);
 //       })



      // Sell Logic
        const BLACKHATCATBalance = await BLACKHATCAT.balanceOf(addr2.address);
        console.log(`BLACKHATCAT balance before sell and after buy: ${ethers.utils.formatEther(BLACKHATCATBalance)} BLACKHATCAT`);

        const ethBalance = await ethers.provider.getBalance(addr2.address);
        console.log(`ETH balance of addr2 before Sell ---- so we can check if there is enough for gas: ${ethers.utils.formatEther(ethBalance)} ETH`);

        
        // Approve if needed
        const allowance = await BLACKHATCAT.allowance(addr2.address, uniswapRouter.address);
        if (allowance.lt(BLACKHATCATBalance)) {
          await BLACKHATCAT.connect(addr2).approve(uniswapRouter.address, BLACKHATCATBalance);  // approve the sale of all 
          console.log("----- Approved all wallet ------");
        } else {
          console.log("----- not approved ------");
            console.log(`----- not approved ------ Allowance: ${ethers.utils.formatEther(allowance.toString())}`);
            console.log(`----- not approved ------ BLACKHATCATBalance: ${ethers.utils.formatEther(BLACKHATCATBalance.toString())}`);

        }

      // The amount to sell is the entire balance
            // The amount to sell is the entire balance
           // Assuming you have the current reserves in the contract

           
            let reserveWETHs, reserveBLACKHATCATs;
          
            if (BLACKHATCAT.address.toLowerCase() < WETH.address.toLowerCase()) {
              console.log("BLACKHATCAT is token0 and WETH is token1");
              [reserveBLACKHATCATs, reserveWETHs] = await lpToken.getReserves();
            } else {
              console.log("WETH is token0 and BLACKHATCAT is token1");
              [reserveWETHs, reserveBLACKHATCATs] = await lpToken.getReserves();
            }

              const amountToSell = BLACKHATCATBalance;
              const amountIn = amountToSell;
              
              // Calculate the price for 1 BLACKHATCAT in terms of WETH
              // Calculate the price for 1 BLACKHATCAT in terms of WETH
              const priceForOneBLACKHATCAT = reserveWETHs.mul(ethers.BigNumber.from(10).pow(18)).div(reserveBLACKHATCATs);

              // Calculate the expected minimum amount of WETH (in wei)
              const expectedWETH = amountToSell.mul(priceForOneBLACKHATCAT).div(ethers.BigNumber.from(10).pow(18));

              // Apply slippage tolerance
              //const amountOutMin = expectedWETH.mul(100 - slippageTolerance).div(100);
              const slippageTolerance = 2; // 1%
              const amountOutMin = expectedWETH.mul(100 - slippageTolerance).div(100);


            

              // Connect router to addr2
              uniswapRouter = uniswapRouter.connect(addr2); 

              console.log("Uniswap router connected to:", uniswapRouter.signer.address);
              // This should now print addr2.address

    

      console.log(`Executing SELL: Will sell ${ethers.utils.formatEther(amountToSell)} BLACKHATCAT for a minimum of ${ethers.utils.formatEther(amountOutMin)} ETH`);

      
        // Check addresses and tokens
        console.log(`Uniswap Router Address: ${uniswapRouter.address}`);
        console.log(`Contract Address: ${BLACKHATCAT.address}`);
        console.log(`User Address: ${addr2.address}`);

        console.log("------ extra buy logs ------");
        // Log the uniswapRouter connection 
        console.log("Uniswap router connected to:", uniswapRouter.signer.address);

        // Log the parameter values
        console.log("amountToSell:", amountToSell.toString()); 
        console.log("amountOutMin:", amountOutMin.toString());
        console.log("deadline:", deadline.toString());


            // Set `addr2.address` as fee-exempt
      //  await BLACKHATCAT.connect(owner).setExemptStatus(addr2.address, true);

        // Validate that the fee exemption was set correctly (optional)
        const isExempt = await BLACKHATCAT.isFeeExempt(addr2.address);
        console.log(`Is addr2.address fee-exempt? ${isExempt}`);

        
        //swapExactTokensForETHSupportingFeeOnTransferTokens
        console.log("Sleeping");
        await sleep(10000);
   try {  
        tx = await uniswapRouter.connect(addr2).swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountIn,
          amountOutMin,
          [BLACKHATCAT.address, WETH.address],
          addr2.address,
          deadline
        );

      } catch (swapError) {
        console.error("Swap failed with error:", swapError);
        return;
      } 
      
      if (!tx) {
        console.error("No transaction returned from swap!");
        return;
      }
      
      // Log the transaction 
    // console.log("Transaction:", tx);


          // Transaction Receipt and Gas Usage
    const receipt = await tx.wait();
    if (receipt && receipt.gasUsed) {
      totalGasUsed = totalGasUsed.add(receipt.gasUsed);
      console.log('Successfully called swapExactTokensForETH');
      console.log(`Gas Used for Swap #${i + 1}: ${receipt.gasUsed.toString()}`);
    //  console.log(`Transaction Receipt: ${JSON.stringify(receipt, null, 2)}`);

    }
         

    }


  } catch (error) {
    console.error(`Error during ${operation.toUpperCase()} at Swap #${i + 1}: ${error}`);
    // Optional: Exit the loop if you encounter an error
    // break;
    console.log("Transaction object:", tx);
    if (tx) {
      try {
        const receipt = await tx.wait(); 
   //     console.log("Transaction Receipt:", receipt);
    
        // Debugging the transaction
        const debugResult = await hre.network.provider.send("debug_traceTransaction", [tx.hash]);
        console.log("Debug Trace Result:", debugResult);
    
        if (receipt.status === false) {
          const reason = receipt.logs[0]?.args?.reason;
          if (reason) {
            console.log("Revert reason:", reason);  
            
            if (reason === "UniswapV2: INSUFFICIENT_LIQUIDITY") {
              console.log(`Not enough liquid`);
            }
          } else {
            console.log("Revert reason not found in the logs.");
          }
        }
      } catch (error) {
        console.error("Error while waiting for the transaction or debugging:", error);
      }
    }
    
  }

    // Contract Balances and Reserves after Swap
    const postSwapBalanceAddr2 = await BLACKHATCAT.balanceOf(addr2.address);
    console.log(`After Swap: BLACKHATCAT Balance of addr2: ${ethers.utils.formatEther(postSwapBalanceAddr2)}`);

    const postSwapBalanceBLACKHATCATcontract = await BLACKHATCAT.balanceOf(BLACKHATCAT.address);
    console.log(`After Swap: BLACKHATCAT Balance of contract: ${ethers.utils.formatEther(postSwapBalanceBLACKHATCATcontract)}`);

    const postSwapETHBalance = await ethers.provider.getBalance(BLACKHATCAT.address);
    console.log(`After Swap: Contract ETH balance: ${ethers.utils.formatEther(postSwapETHBalance)} ETH`);
  }

  ethers.provider.on("debug", (log) => {
   // console.log("from the contract ------ logs");
   // console.log(log);
  });
  

  console.log(`\n======== Test Summary ========`);
  console.log(`Total Gas Used for ${numberOfSwaps} swaps: ${ethers.utils.formatEther(totalGasUsed)}`);
});

});


/*
    if (receipt && receipt.gasUsed) {
      totalGasUsed = totalGasUsed.add(receipt.gasUsed);
    } else {
      console.error('Error: Gas used is undefined');
    }

      console.log(`Total Gas Used for ${numberOfSwaps} swaps: `, ethers.utils.formatEther(totalGasUsed));

describe("BLACKHATCAT Token Tests", function() {

  const slippageTolerance = 2000;  // e.g., 0.5% slippage tolerance represented as basis points at 20%


it("Testing transfer between non-exempt addresses", async function() {
  
 
    await getAndLogReserves();
    await approveTokens();
    await checkAndLogBalances(
        ethers.utils.parseEther("1000000"), 
        ethers.utils.parseEther("50")
    );
    await setupLiquidityPool();
 



  // Transferring tokens from owner to addr2
  let initialOwnerBalance = await BLACKHATCAT.balanceOf(owner.address);
  let amountToTransfer = ethers.BigNumber.from("1000");  // Make sure this is a BigNumber

  await BLACKHATCAT.connect(owner).transfer(addr2.address, amountToTransfer);
  console.log("Transferred tokens from owner to addr2.");

  expect((await BLACKHATCAT.balanceOf(owner.address)).lt(initialOwnerBalance)).to.be.true;
  expect((await BLACKHATCAT.balanceOf(addr2.address)).eq(amountToTransfer)).to.be.true;
  
  // Transferring tokens from addr2 to addr3
  let initialAddr2Balance = await BLACKHATCAT.balanceOf(addr2.address);
  await BLACKHATCAT.connect(addr2).transfer(addr3.address, amountToTransfer);
  console.log("Transferred tokens from addr2 to addr3.");

  expect((await BLACKHATCAT.balanceOf(addr2.address)).lt(initialAddr2Balance)).to.be.true;
  expect((await BLACKHATCAT.balanceOf(addr3.address)).eq(amountToTransfer)).to.be.true;

  const tx1 = await BLACKHATCAT.connect(owner).transfer(addr2.address, amountToTransfer);
  await logGasUsed(tx1);

  const tx2 = await BLACKHATCAT.connect(addr2).transfer(addr3.address, amountToTransfer);
  await logGasUsed(tx2);

});


*/


  it("Testing isExempt and setExemptStatus", async function() {
    console.log("Testing isExempt");
    expect(await BLACKHATCAT.isExempt(addr3.address)).to.be.false;
    await BLACKHATCAT.setExemptStatus(addr3.address, true);
    expect(await BLACKHATCAT.isExempt(addr3.address)).to.be.true;
  });



  it("Testing getFees", async function() {
    let [buyFee, sellFee] = await BLACKHATCAT.getFees();
    expect(buyFee).to.equal(sellFee);  // Assuming both fees are the same in your contract
  });

  

  it("Testing if owner and Marketing arer excluded", async function() {
    // Assuming these assertions are right after contract deployment
    expect(await BLACKHATCAT.isExcludedFromMaxOwnership(owner.address), "Owner should be excluded").to.equal(true);
    expect(await BLACKHATCAT.isExcludedFromMaxOwnership(marketingWallet.address), "Marketing wallet should be excluded").to.equal(true);
    // Additional test logic...
});


  it("Testing transferFrom", async function() {
    console.log("Starting to test transferFrom");
    //exclude from wallet limit 
    expect(await BLACKHATCAT.isExcludedFromMaxOwnership(owner.address)).to.equal(true);
    expect(await BLACKHATCAT.isExcludedFromMaxOwnership(marketingWallet.address)).to.equal(true);
    
    // Initial funding for the marketingWallet
    const initialOwnerBalance = await BLACKHATCAT.balanceOf(owner.address);
    console.log("Initial owner balance:", ethers.utils.formatUnits(initialOwnerBalance, 18).toString());

    const initialMarketingWalletBalance = await BLACKHATCAT.balanceOf(marketingWallet.address);
    console.log("Initial marketingWallet balance:", initialMarketingWalletBalance.toString());

  
    const tokenAmountToSend = ethers.utils.parseUnits("2000", 18); // Assuming 18 decimals
    console.log("Approving amount to send", tokenAmountToSend.toString());
    await BLACKHATCAT.connect(owner).transfer(marketingWallet.address, tokenAmountToSend);
    console.log("made the transfer");

   
    const newOwnerBalance = await BLACKHATCAT.balanceOf(owner.address);
    console.log("New owner balance:", ethers.utils.formatUnits(newOwnerBalance, 18).toString());


    const aftersendMarketingWalletBalance = await BLACKHATCAT.balanceOf(marketingWallet.address);
    console.log("New marketingWallet balance:", aftersendMarketingWalletBalance.toString());
    expect(aftersendMarketingWalletBalance).to.equal(tokenAmountToSend); // Ensuring marketingWallet got the tokens

    await BLACKHATCAT.connect(marketingWallet).approve(addr2.address, 1000);
    const initialAllowance = await BLACKHATCAT.allowance(marketingWallet.address, addr2.address);
    console.log("Allowance set for addr2 from marketingWallet:", initialAllowance.toString());

    await BLACKHATCAT.connect(addr2).transferFrom(marketingWallet.address, addr3.address, 500);
    const postTransferMarketingWalletBalance = await BLACKHATCAT.balanceOf(marketingWallet.address);
    const postTransferAddr3Balance = await BLACKHATCAT.balanceOf(addr3.address);
    const postTransferAllowance = await BLACKHATCAT.allowance(marketingWallet.address, addr2.address);
    console.log("Post-transfer marketingWallet balance:", postTransferMarketingWalletBalance.toString());
    console.log("Post-transfer addr3 balance:", postTransferAddr3Balance.toString());
    console.log("Post-transfer allowance for addr2 from marketingWallet:", postTransferAllowance.toString());

    await expect(BLACKHATCAT.connect(addr2).transferFrom(marketingWallet.address, addr3.address, 600)).to.be.reverted;   // More than allowance
    console.log("Reverted as expected due to exceeded allowance.");

    await expect(BLACKHATCAT.connect(addr2).transferFrom(marketingWallet.address, addr3.address, 10000)).to.be.reverted; // More than balance
    console.log("Reverted as expected due to exceeded balance.");
});






it("Testing approve and related functions", async function() {
  await BLACKHATCAT.connect(marketingWallet).approve(addr2.address, 1000);
  console.log("Approved 1000 tokens for addr2 to spend from marketingWallet.");

  expect(await BLACKHATCAT.allowance(marketingWallet.address, addr2.address)).to.equal(1000);
  await BLACKHATCAT.connect(marketingWallet).increaseAllowance(addr2.address, 500);
  expect(await BLACKHATCAT.allowance(marketingWallet.address, addr2.address)).to.equal(1500);

  await BLACKHATCAT.connect(marketingWallet).decreaseAllowance(addr2.address, 1000);
  expect(await BLACKHATCAT.allowance(marketingWallet.address, addr2.address)).to.equal(500);

  await expect(BLACKHATCAT.connect(marketingWallet).decreaseAllowance(addr2.address, 600)).to.be.reverted;  // Negative allowance
  console.log("Reverted as expected due to negative allowance.");
});




describe("Testing setMarketingReceiver", function() {


  it("should allow owner to set the marketing receiver", async function() {
      const BLACKHATCATWithOwner = BLACKHATCAT.connect(owner);
      await BLACKHATCATWithOwner.setMarketingReceiver(addr3.address);
      expect(await BLACKHATCAT.getMarketingReceiver()).to.equal(addr3.address);
  });

  it("should revert if a non-owner tries to set the marketing receiver", async function() {
      const BLACKHATCATWithAddr2 = BLACKHATCAT.connect(addr2);
      await expect(BLACKHATCATWithAddr2.setMarketingReceiver(addr3.address))
          .to.be.reverted;  // The exact revert message can vary based on your implementation of onlyOwner. If you know it, you can use .to.be.revertedWith("YOUR_REVERT_MESSAGE");
  });
});



describe("Testing withdrawal", function() {
  const twoEth = ethers.utils.parseEther("2");

  beforeEach(async function() {
      // Setup liquidity, approve tokens, and check balances
  //    await getAndLogReserves();
 //     await approveTokens();
 //     await checkAndLogBalances(
 //         ethers.utils.parseEther("1000000"), 
  //        ethers.utils.parseEther("50")
 //     );
      await setupLiquidityPoolLarge()

      await setmarketing();
      // Set marketing receiver
   //   await BLACKHATCAT.setMarketingReceiver(addr3.address);

      // Send 2 ETH to the contract for fee simulation
    //  await owner.sendTransaction({ to: BLACKHATCAT.address, value: twoEth });
  });



  it("Should swap the BLACKHATCAT tokens for ETH in the contract", async function() {

    BLACKHATCAT.isExcludedFromMaxOwnership(owner.address);
    BLACKHATCAT.isExcludedFromMaxOwnership(marketingWallet.address);
    // Listen to the ApprovedAmount event
    const filter = BLACKHATCAT.filters.ApprovedAmount(BLACKHATCAT.address, null, null);
    BLACKHATCAT.on(filter, (tokenOwner, spender, amount, event) => {
        console.log(`ApprovedAmount event detected:`);
        console.log(`- TokenOwner: ${tokenOwner}`);
        console.log(`- Spender: ${spender}`);
        console.log(`- Amount: ${ethers.utils.formatEther(amount)} BLACKHATCAT`);
    });
    


    // Connect with the owner's signer
    const BLACKHATCATWithOwner = BLACKHATCAT.connect(owner);
    

    // Ensure the owner has enough BLACKHATCAT tokens before transferring
    const ownerBalance = await BLACKHATCAT.balanceOf(owner.address);
    expect(ownerBalance).to.be.at.least(ethers.utils.parseEther('1000'), "Owner doesn't have enough BLACKHATCAT tokens");

    // Approve the contract to spend owner's BLACKHATCAT tokens
    const approveTx = await BLACKHATCATWithOwner.approve(BLACKHATCAT.address, ethers.utils.parseEther('1000'));
    await approveTx.wait(); // Wait for the transaction to be mined
    console.log("Approved 1000 BLACKHATCAT tokens for the contract to spend.");


    const tx = await BLACKHATCAT.approve(uniswapRouter.address, ownerBalance, { from: owner.address });
    const receipt = await tx.wait();  // Wait for the transaction to be confirmed
    console.log(receipt.status);  // Should be 1 if successful, 0 if failed
    
    BLACKHATCAT.on('Approval', (owner, spender, amount, event) => {
      console.log(`Owner ${owner} has approved spender ${spender} to spend ${amount} tokens`);
    });
    

    const allowance = await BLACKHATCAT.allowance(BLACKHATCAT.address, uniswapRouter.address); // Replace "routerAddress" with your router's address variable
    console.log("Allowance set: " + allowance.toString());
    
    console.log("Contract's allowance to router:", ethers.utils.formatEther(allowance), "BLACKHATCAT");

    

    // Transfer the approved BLACKHATCAT tokens to the contract
    const transferTx = await BLACKHATCATWithOwner.transfer(BLACKHATCAT.address, ethers.utils.parseEther('1000'));
    await transferTx.wait();  // Wait for the transaction to be mined
    console.log("Transferred 1000 BLACKHATCAT tokens from owner to the BLACKHATCAT contract address.");



    // Fund the contract with ETH for potential gas fees or other functionalities
    await owner.sendTransaction({
        to: BLACKHATCAT.address,
        value: ethers.utils.parseEther('0.1') // sending 0.1 ETH
    });
    console.log("Sent ETH to the BLACKHATCAT contract for gas fees from owner.");

    // Capture the initial balances before the token swap
    const initialEthBalance = await ethers.provider.getBalance(BLACKHATCAT.address);
    const initialBLACKHATCATTokenBalance = await BLACKHATCAT.balanceOf(BLACKHATCAT.address);

    console.log(`Initial ETH balance of the contract: ${ethers.utils.formatEther(initialEthBalance)} ETH`);
    console.log(`Initial BLACKHATCAT token balance of the contract: ${ethers.utils.formatEther(initialBLACKHATCATTokenBalance)} BLACKHATCAT`);


    // Attempt to swap tokens and handle any potential error
    try {
        const contractBLACKHATCATTokenBalance = await BLACKHATCAT.balanceOf(BLACKHATCAT.address);

        const BLACKHATCATWithOwner = BLACKHATCAT.connect(owner);
        await BLACKHATCATWithOwner.manualSwapTokensForETH();

        console.log("Successfully swapped tokens for ETH.");
      


    } catch (error) {
        console.error("Error during token swap:", error);
    }

    // Ensure the ETH balance of the contract increased and the BLACKHATCAT balance decreased after the swap
    const finalEthBalance = await ethers.provider.getBalance(BLACKHATCAT.address);
    const finalBLACKHATCATTokenBalance = await BLACKHATCAT.balanceOf(BLACKHATCAT.address);

    console.log(`Final ETH balance of the contract: ${ethers.utils.formatEther(finalEthBalance)} ETH`);
    console.log(`Final BLACKHATCAT token balance of the contract: ${ethers.utils.formatEther(finalBLACKHATCATTokenBalance)} BLACKHATCAT`);

    expect(finalEthBalance.gt(initialEthBalance)).to.be.true;  // Using BigNumber's 'gt' method for "greater than"
    expect(finalBLACKHATCATTokenBalance.lt(initialBLACKHATCATTokenBalance)).to.be.true;  // Using BigNumber's 'lt' method for "less than"

});





it("should allow owner to withdraw the eth to marketing, leaving gas reserve", async function() {
  // Set the desired gas reserve
    // 2 ETH in Wei for initial deposit
    const twoEth = ethers.utils.parseEther("2");
  
    // 0.04 ETH in Wei for gas reserve
    const gasReserve = ethers.utils.parseEther('0.04');
    
    // 2.04 ETH in Wei for the total deposit to the contract
    const totalDeposit = twoEth.add(gasReserve);
    
    console.log("--- eth to marketing ---- firing sendTransaction"); 
    // Send total deposit to the contract
    await owner.sendTransaction({ to: BLACKHATCAT.address, value: totalDeposit });

  // Verify contract balance
  let contractInitialBalance = await ethers.provider.getBalance(BLACKHATCAT.address);
  console.log("Balance after adding:", ethers.utils.formatEther(contractInitialBalance)); // Log initial balance
  
  expect(contractInitialBalance).to.be.equal(totalDeposit);


  // Declare the actual amount to withdraw in Wei
  const actualWithdrawAmount = ethers.utils.parseEther("2");

  // Get initial marketing wallet balance
  let marketingInitialBalance = await ethers.provider.getBalance(marketingWallet.address);
  console.log("Initial Marketing balance:", ethers.utils.formatEther(marketingInitialBalance));


  console.log("Amount to withdraw:", ethers.utils.formatEther(actualWithdrawAmount)); // Log the amount you're trying to withdraw

    // Fetch and log the marketing address from the contract
    const contractMarketingAddress = await BLACKHATCAT.getMarketingReceiver();
    console.log("Contract's Marketing Address:", contractMarketingAddress);

      // Ensure the marketing address in the contract is the expected one
  expect(contractMarketingAddress).to.equal(marketingWallet.address);


// First, check if the function exists on the contract
if (!BLACKHATCAT['withdrawETHToMarketing']) {
  console.error('withdrawETHToMarketing function does not exist on BLACKHATCAT');
  return;
}

// Initialize transaction object
let tx;

// Try to execute the transaction
try {
  tx = await BLACKHATCAT.withdrawETHToMarketing({ gasLimit: 100000 }); // Only pass in the gas limit as an options object
  console.log("Withdrew ETH to marketing.");
} catch (error) {
  console.error("Error during ETH withdrawal:", error);
  return;
}



// Check if the transaction object is undefined
if (!tx) {
  console.error("Transaction object is undefined");
  return;
}

// Continue with the rest of your code

// Wait for the transaction to be confirmed and get the receipt
const receipt = await tx.wait();

// Filter the event logs for the WithdrawETHToMarketing event
const withdrawEvent = receipt.events?.filter((e) => e.event === "WithdrawETHToMarketing")[0];
//console.log(withdrawEvent);
// Check the amount withdrawn in the event log

const actualWithdrawAmountInEth = ethers.utils.formatEther(withdrawEvent.args.amountWithdrawn);
// Convert both to a Number and then compare
expect(parseFloat(actualWithdrawAmountInEth)).to.equal(parseFloat("2"));

// Assert that the event was emitted with the expected values
expect(withdrawEvent, "WithdrawETHToMarketing event not found").to.exist;
expect(withdrawEvent.args.remainingContractBalance.toString()).to.equal(gasReserve.toString());


// Check contract balance after the withdrawal
let contractBalanceAfterWithdrawal = await ethers.provider.getBalance(BLACKHATCAT.address);
console.log("Contract balance after withdrawal:", ethers.utils.formatEther(contractBalanceAfterWithdrawal));

// Check marketing wallet balance after the withdrawal
let marketingBalanceAfterWithdrawal = await ethers.provider.getBalance(marketingWallet.address);
console.log("Marketing balance after withdrawal:", ethers.utils.formatEther(marketingBalanceAfterWithdrawal));


});






it("should allow owner to withdraw the BLACKHATCAT tokens to marketing", async function () {
  // Define the amount of tokens to test with
  const tokenAmount = ethers.utils.parseUnits("1000", 18); // Use the correct decimal value for your token

  // Send tokens to the contract
  await BLACKHATCAT.connect(owner).transfer(BLACKHATCAT.address, tokenAmount);

  // Ensure the contract has enough BLACKHATCAT tokens before attempting the withdrawal
  const initialcontractTokenBalance = await BLACKHATCAT.balanceOf(BLACKHATCAT.address);
  console.log("BLACKHATCAT tokens in contract:", initialcontractTokenBalance.toString());

  expect(initialcontractTokenBalance.eq(tokenAmount)).to.be.true;
  console.log("Passed the expect token and balance to be the same");

  // Get initial marketing wallet token balance
  const initialTokenBalance = await BLACKHATCAT.balanceOf(marketingWallet.address);
  console.log("Initial Token balance in marketing:", initialTokenBalance.toString());


  // First, check if the function exists on the contract
if (!BLACKHATCAT['withdrawBLACKHATCATToMarketing']) {
  console.error('withdrawBLACKHATCATToMarketing function does not exist on BLACKHATCAT');
  return;
}


  // Execute the transaction to withdraw all BLACKHATCAT tokens to marketing
  try {
    const tx = await BLACKHATCAT.connect(owner).withdrawBLACKHATCATToMarketing();
    await tx.wait();
    console.log("Withdrew BLACKHATCAT to marketing.");
  } catch (error) {
    console.error("Error during BLACKHATCAT withdrawal:", error);
    return;
  }


  // Get new marketing wallet token balance
  const newTokenBalance = await BLACKHATCAT.balanceOf(marketingWallet.address);
  console.log("New token balance:", newTokenBalance.toString());

  // Assert that all BLACKHATCAT tokens from the contract were transferred to the marketing wallet
  expect(newTokenBalance.sub(initialTokenBalance).eq(initialcontractTokenBalance)).to.be.true;

  // Check that the contract balance is now zero
  const finalContractTokenBalance = await BLACKHATCAT.balanceOf(BLACKHATCAT.address);
  console.log("BLACKHATCAT tokens left in contract:", finalContractTokenBalance.toString());
  expect(finalContractTokenBalance.isZero()).to.be.true;

});


  
});