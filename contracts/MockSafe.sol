// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Minimal test double. Its owner authorization is intentionally separate
 * from the DAO's Safe-only authorization: forwarded calls originate from Safe.
 */
contract MockSafe {
    address[] public owners;
    uint256 public threshold;
    mapping(bytes32 => mapping(address => bool)) public approved;
    mapping(bytes32 => uint256) public approvalCount;

    event TransactionApproved(bytes32 indexed transactionHash, address indexed owner);

    constructor(address[] memory owners_, uint256 threshold_) {
        require(owners_.length != 0, "No owners");
        require(threshold_ != 0 && threshold_ <= owners_.length, "Invalid threshold");
        owners = owners_;
        threshold = threshold_;
    }

    modifier onlyOwner() {
        require(isOwner(msg.sender), "Not Safe owner");
        _;
    }

    function isOwner(address account) public view returns (bool) {
        for (uint256 i; i < owners.length; ++i) {
            if (owners[i] == account) return true;
        }
        return false;
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransactionHash(address target, uint256 value, bytes calldata data)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(target, value, data));
    }

    function approveTransaction(address target, uint256 value, bytes calldata data)
        external
        onlyOwner
    {
        bytes32 transactionHash = getTransactionHash(target, value, data);
        require(!approved[transactionHash][msg.sender], "Already approved");
        approved[transactionHash][msg.sender] = true;
        approvalCount[transactionHash]++;
        emit TransactionApproved(transactionHash, msg.sender);
    }

    function execute(address target, uint256 value, bytes calldata data)
        external
        onlyOwner
        returns (bytes memory)
    {
        bytes32 transactionHash = getTransactionHash(target, value, data);
        require(approvalCount[transactionHash] >= threshold, "Threshold not met");
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Safe execution failed");
        return result;
    }
}
