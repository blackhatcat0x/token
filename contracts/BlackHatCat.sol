// SPDX-License-Identifier: MIT

/*
        /$$$$$$$  /$$                     /$$       /$$   /$$             /$$      /$$$$$$              /$$    
        | $$__  $$| $$                    | $$      | $$  | $$            | $$     /$$__  $$            | $$    
        | $$  \ $$| $$  /$$$$$$   /$$$$$$$| $$   /$$| $$  | $$  /$$$$$$  /$$$$$$  | $$  \__/  /$$$$$$  /$$$$$$  
        | $$$$$$$ | $$ |____  $$ /$$_____/| $$  /$$/| $$$$$$$$ |____  $$|_  $$_/  | $$       |____  $$|_  $$_/  
        | $$__  $$| $$  /$$$$$$$| $$      | $$$$$$/ | $$__  $$  /$$$$$$$  | $$    | $$        /$$$$$$$  | $$    
        | $$  \ $$| $$ /$$__  $$| $$      | $$_  $$ | $$  | $$ /$$__  $$  | $$ /$$| $$    $$ /$$__  $$  | $$ /$$
        | $$$$$$$/| $$|  $$$$$$$|  $$$$$$$| $$ \  $$| $$  | $$|  $$$$$$$  |  $$$$/|  $$$$$$/|  $$$$$$$  |  $$$$/
        |_______/ |__/ \_______/ \_______/|__/  \__/|__/  |__/ \_______/   \___/   \______/  \_______/   \___/  
                                                                                                      
                                                            
                                                           
    BlackHatCat - If he crosses your path it's over
    Telegram: https://t.me/blackhatcat
    Web: www.blackhatcat.com/
    BlackHatCat, a pioneering crypto-based project dedicated to combating 
    the proliferation of scam tokens in the blockchain space. Our mission is clear: 
    empower users to safeguard the community by providing a reliable platform for 
    reporting and verifying scam tokens. In an ecosystem where trust is paramount, 
    BlackHatCat stands as a beacon of security and community vigilance.

                                             
*/

pragma solidity 0.8.21;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IBlastInterface/IBlast.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol"; 
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract BLACKHATCAT is IERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address;

    IBlast public constant BLAST = IBlast(0x4300000000000000000000000000000000000002);

    string private constant _name = unicode"BLACKHATCAT";
    string private constant _symbol = unicode"BLACKHATCAT";
    uint8 private constant _decimals = 18;
    uint256 private constant decimal_multiplier = 10 ** uint256(_decimals);
    uint256 private _totalSupply = 10000000000 * (10 ** _decimals);  //supply at 10,000,000,000
    uint256 public minEthBeforeTransfer = 1 ether / 10;  // 0.1 ETH

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => bool) public isFeeExempt;
    mapping(address => bool) public automatedMarketMakerPairs;
    mapping(address => bool) public isExcludedFromMaxOwnership;

    uint256 private denominator = 100;
    uint256 public sellFee = 1;
    uint256 public buyFee = 1;
    address payable private marketing_receiver;  
    address public dead = 0x000000000000000000000000000000000000dEaD;
    address public routerCA = 0x44889b52b71E60De6ed7dE82E2939fcc52fB2B4E; //0x44889b52b71E60De6ed7dE82E2939fcc52fB2B4E thruster router
    // 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D uniswap

    address public thrusterRouter = 0x44889b52b71E60De6ed7dE82E2939fcc52fB2B4E;
    address public dyorSwapRouter = 0xE470699f6D0384E3eA68F1144E41d22C6c8fdEEf;

    uint blocksUntilDeadline = 15; // for example

    IUniswapV2Router02 public router;
    
    address public pair;

    bool public isETHWithdrawalPending = false;
    bool public isBLACKHATCATWithdrawalPending = false;

    event MarketingReceiverUpdated(address indexed newMarketingReceiver);
    event FeesUpdated(uint256 sellFee, uint256 buyFee);

    event TransferDetails(address indexed sender, address indexed recipient, uint256 amount);
    event FeeDetails(uint256 feeAmount, uint256 amountAfterFee);
    event ApprovedAmount(address indexed tokenOwner, address indexed spender, uint256 amount);
    event TransferConfirmed(address indexed from, address indexed to, uint256 value);

    event WithdrawETHToMarketing(address indexed sender, uint256 amountWithdrawn, uint256 remainingContractBalance);
    event Burn(address indexed burner, uint256 amount);

    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);
    event RouterUpdated(address indexed newRouter, address indexed newRouterInterface, address indexed newPair);

    event WithdrawAll(address indexed sender, uint256 ethAmount, uint256 tokenAmount);

    constructor() Ownable() {

        marketing_receiver = payable(address(0xeb7E46e3992ade01Ac32959EBDd306EFBA811B8c));  // !!!change back to this before deploying 0xeb7E46e3992ade01Ac32959EBDd306EFBA811B8c
        isFeeExempt[address(this)] = true;
        isFeeExempt[marketing_receiver] = true;
        isFeeExempt[msg.sender] = true;
        isFeeExempt[routerCA] = true; // Exclude liquidity pool from fees
        isFeeExempt[pair] = true; // Exclude liquidity pool from fees

        // This sets the Gas Mode for MyContract to claimable
        BLAST.configureClaimableGas(); 

             
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }



    function name() public pure returns (string memory) {
        return _name;
    }

    function symbol() public pure returns (string memory) {
        return _symbol;
    }

    function decimals() public pure returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply; 
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public override nonReentrant returns (bool) {
        _transferInternal(msg.sender, recipient, amount);
        return true;
    }
    
    function _transferInternal(address sender, address recipient, uint256 amount) internal {
        transferWithFee(sender, recipient, amount);
    }


    // Function to check if an address is exempted from fees
    function isExempt(address _address) external view returns (bool) {
        return isFeeExempt[_address];
    }


    // Function to set exemption status for an address for fees
    function setExemptStatus(address _address, bool _status) external onlyOwner {
        isFeeExempt[_address] = _status;
    }


    function setAutomatedMarketMakerPair(address newPair, bool value) public onlyOwner {
        require(
            newPair != pair,
            "The pair cannot be removed from automatedMarketMakerPairs"
        );
        _setAutomatedMarketMakerPair(newPair, value);
    }

    function _setAutomatedMarketMakerPair(address newPair, bool value) private {
        automatedMarketMakerPairs[newPair] = value;
        emit SetAutomatedMarketMakerPair(newPair, value);
    }

    function getFees() external view returns (uint256 currentSellFee, uint256 currentBuyFee) {
        return (sellFee, buyFee);
    }

    function burn(uint256 amount) external onlyOwner {
        uint256 amountWithDecimals = amount * decimal_multiplier;
        _burn(msg.sender, amountWithDecimals);
    }
 
    function _transferFromInternal(address sender, address recipient, uint256 amount) internal {
        require(_allowances[sender][msg.sender] >= amount, "ERC20: transfer amount exceeds allowance");
        _transferInternal(sender, recipient, amount);
        _allowances[sender][msg.sender] = _allowances[sender][msg.sender] - amount;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transferFromInternal(sender, recipient, amount);
        return true;
    }

    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from zero address");
        require(spender != address(0), "ERC20: approve to zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }


    
    function swapTokensForETH(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = router.WETH();


        _approve(address(this), address(router), tokenAmount);
        router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        );
    }



    function manualSwapTokensForETH() external onlyOwner {
        uint256 contractTokenBalance = balanceOf(address(this));
        swapTokensForETH(contractTokenBalance);
    }

    function sendETHToMarketing(uint256 amount) internal {
        payable(marketing_receiver).transfer(amount);
    }



    function transferWithFee(address sender, address recipient, uint256 amount) internal returns (uint256) {

        uint256 fee = 0;
        if (!isFeeExempt[sender] && !isFeeExempt[recipient]) {
            if (isSell(sender, recipient)) {
                fee = calculateFeeWithCheck(amount, sellFee);
            } else if (isBuy(sender, recipient)) {
                fee = calculateFeeWithCheck(amount, buyFee);
            } 
        }

               
        if(fee > 0) {
            _transfer(sender, address(this), fee); 
            if(!automatedMarketMakerPairs[sender] ) {
                swapTokensForETH(fee);
                uint256 contractETHBalance = address(this).balance;
                if(contractETHBalance > minEthBeforeTransfer) {
                    sendETHToMarketing(contractETHBalance);
                }
            }
            
        }

        uint256 amountAfterFee = amount - fee;

        emit FeeDetails(fee, amountAfterFee);
        _transfer(sender, recipient, amountAfterFee);
       
        return amountAfterFee;
    }


    function calculateFeeWithCheck(uint256 _amount, uint256 _feeRate) internal view returns (uint256) {
        require(_amount <= (type(uint256).max / _feeRate), "ERC20: arithmetic overflow in fee calculation");
        uint256 fee = (_amount * _feeRate) / denominator;
        return fee;
    }


    function setRouter(address newRouterAddress) public onlyOwner {
        require(newRouterAddress != address(0), "BLACKHATCAT: Router cannot be the zero address");
        require(newRouterAddress != address(router), "BLACKHATCAT: New router address must be different");
        
        IUniswapV2Router02 _newRouter = IUniswapV2Router02(newRouterAddress);
        address _newPair = IUniswapV2Factory(_newRouter.factory()).createPair(address(this), _newRouter.WETH());
        
        // Optionally, handle the old pair if needed, such as removing it from AMM tracking
        // if (pair != address(0)) {
        //     _setAutomatedMarketMakerPair(pair, false);
        // }

        // Update the router and pair
        router = _newRouter;
        pair = _newPair;
        
        // Update AMM pairs to include the new pair
        _setAutomatedMarketMakerPair(_newPair, true);
        
        // Update exemptions for the new pair if needed
        isFeeExempt[_newPair] = true;
        
        emit RouterUpdated(newRouterAddress, address(_newRouter), _newPair);
    }



    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
   
    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender] + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        uint256 currentAllowance = _allowances[msg.sender][spender];
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        _approve(msg.sender, spender, currentAllowance - subtractedValue);

        return true;
    }

    function _transfer(address sender, address recipient, uint256 amountAfterFee) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        
        // Verify that the sender has enough balance to transfer.
        require(_balances[sender] >= amountAfterFee, "ERC20: transfer amount exceeds balance");

        // Perform the transfer.
        _balances[sender] = _balances[sender] - amountAfterFee;
        _balances[recipient] = _balances[recipient] + amountAfterFee;
        
        emit Transfer(sender, recipient, amountAfterFee);
    }


    function isSell(address sender, address recipient) internal view returns (bool) {
        return !automatedMarketMakerPairs[sender] && automatedMarketMakerPairs[recipient] && sender != owner();
    }


    function isBuy(address sender, address recipient) internal view returns (bool) {
        return automatedMarketMakerPairs[sender] && !automatedMarketMakerPairs[recipient] && recipient != owner();
    }


    function setMarketingReceiver(address payable newMarketingReceiver) external onlyOwner {
        require(newMarketingReceiver != address(0), "Marketing receiver cannot be zero address");
        marketing_receiver = newMarketingReceiver;
        isFeeExempt[newMarketingReceiver] = true;
        emit MarketingReceiverUpdated(newMarketingReceiver);
    }

    function getMarketingReceiver() external view returns (address) {
        return marketing_receiver;
    }


    function withdrawETHToMarketing() external onlyOwner {
        require(!isETHWithdrawalPending, "An ETH withdrawal is already pending");
        uint256 gasReserve = 0.04 ether;  // 0.04 ETH in Wei
        uint256 balance = address(this).balance;

        uint256 deadline = block.timestamp + 300;  // 5 minutes
        require(block.timestamp < deadline, "Transaction timed out");

        // Make sure that the contract has more than just the gas reserve
        require(balance > gasReserve, "Not enough ETH in contract to perform withdrawal");

        uint256 amountToWithdraw = balance - gasReserve;

        // Perform the withdrawal
        payable(marketing_receiver).transfer(amountToWithdraw);

        emit WithdrawETHToMarketing(msg.sender, amountToWithdraw, address(this).balance);

        isETHWithdrawalPending = true;
    }



    function withdrawBLACKHATCATToMarketing() external onlyOwner {
        require(!isBLACKHATCATWithdrawalPending, "A BLACKHATCAT withdrawal is already pending");
        uint256 contractBalance = _balances[address(this)];
        require(contractBalance > 0, "No tokens to transfer");

        uint256 deadline = block.timestamp + 300;  // 5 minutes
        require(block.timestamp < deadline, "Transaction timed out");

        _transfer(address(this), marketing_receiver, contractBalance);
        isBLACKHATCATWithdrawalPending = true;
    }


    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "Cannot burn from the zero address");
        require(_balances[account] >= amount, "Insufficient balance to burn");

        _balances[account] -= amount;
        _totalSupply -= amount;

        emit Burn(account, amount);
        emit Transfer(account, dead, amount);
    }


        // Escape Hatch to cancel pending ETH withdrawal
    function cancelETHWithdrawal() external onlyOwner {
        require(isETHWithdrawalPending, "No pending ETH withdrawal to cancel");
        isETHWithdrawalPending = false;
    }

    // Escape Hatch to cancel pending BLACKHATCAT withdrawal
    function cancelBLACKHATCATWithdrawal() external onlyOwner {
        require(isBLACKHATCATWithdrawalPending, "No pending BLACKHATCAT withdrawal to cancel");
        isBLACKHATCATWithdrawalPending = false;
    }


        // Function to withdraw all tokens and ETH to owner Backup function
    function withdrawAllToOwner() external onlyOwner {
        uint256 contractETHBalance = address(this).balance;
        uint256 contractTokenBalance = balanceOf(address(this)); // Using balanceOf() method if it's public

        require(contractETHBalance > 0 || contractTokenBalance > 0, "Nothing to withdraw");

        if (contractETHBalance > 0) {
            payable(owner()).transfer(contractETHBalance);  // Use owner() function from Ownable
        }

        if (contractTokenBalance > 0) {
            _transfer(address(this), owner(), contractTokenBalance); // Use owner() function from Ownable
        }

        emit WithdrawAll(msg.sender, contractETHBalance, contractTokenBalance);
    }



    function claimMyContractsGas() external onlyOwner {
        BLAST.claimAllGas(address(this), msg.sender);
    }

    
    function enableClaimable(address gov) public onlyOwner {
        IBlast(0x4300000000000000000000000000000000000002).configure(IBlast.YieldMode.CLAIMABLE, IBlast.GasMode.CLAIMABLE, gov);
    }


    receive() external payable {}

}



    