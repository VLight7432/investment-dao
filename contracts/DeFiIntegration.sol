// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAaveLendingPool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external;
}

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline
    ) external returns (uint[] memory amounts);
}

interface ICurvePool {
    function add_liquidity(uint256[2] calldata amounts, uint256 min_mint_amount) external;
}

interface IYearnVault {
    function deposit(uint256 amount) external;
    function withdraw(uint256 shares) external;
}

contract DeFiIntegration {
    address public immutable dao;
    address public aaveLendingPool;
    address public uniswapRouter;
    address public curvePool;
    address public yearnVault;

    modifier onlyDAO() {
        require(msg.sender == dao, "Seule la DAO peut agir");
        _;
    }

    constructor(
        address _dao,
        address _aaveLendingPool,
        address _uniswapRouter,
        address _curvePool,
        address _yearnVault
    ) {
        require(_dao != address(0), "Adresse DAO invalide");
        require(_aaveLendingPool != address(0), "Adresse Aave invalide");
        require(_uniswapRouter != address(0), "Adresse Uniswap invalide");
        require(_curvePool != address(0), "Adresse Curve invalide");
        require(_yearnVault != address(0), "Adresse Yearn invalide");
        dao = _dao;
        aaveLendingPool = _aaveLendingPool;
        uniswapRouter = _uniswapRouter;
        curvePool = _curvePool;
        yearnVault = _yearnVault;
    }

    function depositAave(address asset, uint256 amount) external onlyDAO {
        IAaveLendingPool(aaveLendingPool).deposit(asset, amount, address(this), 0);
    }

    function swapUniswap(address[] calldata path, uint256 amountIn, uint256 amountOutMin) external onlyDAO {
        require(path.length >= 2, "Chemin invalide");
        require(amountOutMin > 0, "Slippage non protege");
        IUniswapV2Router(uniswapRouter).swapExactTokensForTokens(
            amountIn, amountOutMin, path, address(this), block.timestamp + 600
        );
    }

    function depositCurve(uint256[2] calldata amounts, uint256 minMint) external onlyDAO {
        ICurvePool(curvePool).add_liquidity(amounts, minMint);
    }

    function depositYearn(uint256 amount) external onlyDAO {
        IYearnVault(yearnVault).deposit(amount);
    }
}
