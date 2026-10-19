// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOpenSeaSeaport {
    function fulfillOrder(bytes calldata order, bytes calldata fulfillerConduitKey) external payable;
}

contract NFTTrading {
    address public immutable dao;
    IOpenSeaSeaport public immutable seaport;

    modifier onlyDAO() {
        require(msg.sender == dao, "Seul la DAO peut agir");
        _;
    }

    constructor(address _dao, address _seaport) {
        require(_dao != address(0), "Adresse DAO invalide");
        require(_seaport != address(0), "Adresse Seaport invalide");
        dao = _dao;
        seaport = IOpenSeaSeaport(_seaport);
    }

    function buyNFT(
        address _collection,
        uint256 _tokenId,
        uint256 _maxPrice,
        bytes calldata order,
        bytes calldata conduitKey
    ) external onlyDAO {
        // Appel OpenSea Seaport pour acheter le NFT
        seaport.fulfillOrder{value: _maxPrice}(order, conduitKey);
    }

    function sellNFT(
        address _collection,
        uint256 _tokenId,
        uint256 _minPrice
    ) external onlyDAO {
        // Ici, il faudrait préparer la création d'une order Seaport côté off-chain,
        // puis la signer et la publier via le frontend ou un relai.
        // On peut émettre un event pour signaler la vente souhaitée.
        emit NFTSaleRequested(_collection, _tokenId, _minPrice);
    }

    event NFTSaleRequested(address indexed collection, uint256 indexed tokenId, uint256 minPrice);
}
