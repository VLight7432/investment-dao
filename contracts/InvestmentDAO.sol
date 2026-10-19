// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title InvestmentDAO
 * @dev DAO pour gérer des investissements collectifs avec vote des membres
 */
contract InvestmentDAO is ReentrancyGuard {
    
    // Token de gouvernance de la DAO
    ERC20 public governanceToken;
    
    // Structure pour une proposition d'investissement
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        address targetAddress;
        uint256 amount;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
        bool exists;
        mapping(address => bool) hasVoted;
    }
    
    // Stockage des propositions
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    // Paramètres de la DAO
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant QUORUM_PERCENTAGE = 20; // 20% des tokens doivent voter
    uint256 public constant APPROVAL_THRESHOLD = 50; // 50% des votes doivent être pour
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        address targetAddress,
        uint256 amount
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votes
    );
    
    event ProposalExecuted(uint256 indexed proposalId);
    event FundsDeposited(address indexed depositor, uint256 amount);
    event FundsWithdrawn(address indexed recipient, uint256 amount);
    
    constructor(address _governanceToken) {
        governanceToken = ERC20(_governanceToken);
    }
    
    /**
     * @dev Permet aux membres de déposer des fonds dans la trésorerie
     */
    function depositFunds() external payable {
        require(msg.value > 0, "Le montant doit etre superieur a 0");
        emit FundsDeposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Créer une nouvelle proposition d'investissement
     */
    function createProposal(
        string memory _description,
        address _targetAddress,
        uint256 _amount
    ) external returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) > 0,
            "Vous devez posseder des tokens de gouvernance"
        );
        require(_targetAddress != address(0), "Adresse cible invalide");
        require(_amount > 0, "Le montant doit etre superieur a 0");
        require(_amount <= address(this).balance, "Fonds insuffisants dans la tresorerie");
        
        proposalCount++;
        Proposal storage newProposal = proposals[proposalCount];
        
        newProposal.id = proposalCount;
        newProposal.proposer = msg.sender;
        newProposal.description = _description;
        newProposal.targetAddress = _targetAddress;
        newProposal.amount = _amount;
        newProposal.deadline = block.timestamp + VOTING_PERIOD;
        newProposal.exists = true;
        
        emit ProposalCreated(
            proposalCount,
            msg.sender,
            _description,
            _targetAddress,
            _amount
        );
        
        return proposalCount;
    }
    
    /**
     * @dev Vote sur une proposition
     */
    function vote(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.exists, "Proposition inexistante");
        require(block.timestamp < proposal.deadline, "Periode de vote terminee");
        require(!proposal.hasVoted[msg.sender], "Vous avez deja vote");
        
        uint256 voterBalance = governanceToken.balanceOf(msg.sender);
        require(voterBalance > 0, "Vous devez posseder des tokens pour voter");
        
        proposal.hasVoted[msg.sender] = true;
        
        if (_support) {
            proposal.votesFor += voterBalance;
        } else {
            proposal.votesAgainst += voterBalance;
        }
        
        emit VoteCast(_proposalId, msg.sender, _support, voterBalance);
    }
    
    /**
     * @dev Exécute une proposition approuvée
     */
    function executeProposal(uint256 _proposalId) external nonReentrant {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.exists, "Proposition inexistante");
        require(block.timestamp >= proposal.deadline, "Periode de vote non terminee");
        require(!proposal.executed, "Proposition deja executee");
        
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        uint256 totalSupply = governanceToken.totalSupply();
        
        // Vérifier le quorum
        require(
            (totalVotes * 100) / totalSupply >= QUORUM_PERCENTAGE,
            "Quorum non atteint"
        );
        
        // Vérifier l'approbation
        require(
            (proposal.votesFor * 100) / totalVotes >= APPROVAL_THRESHOLD,
            "Proposition non approuvee"
        );
        
        proposal.executed = true;
        
        // Transférer les fonds
        (bool success, ) = proposal.targetAddress.call{value: proposal.amount}("");
        require(success, "Transfert echoue");
        
        emit ProposalExecuted(_proposalId);
    }
    
    /**
     * @dev Obtenir les détails d'une proposition
     */
    function getProposal(uint256 _proposalId) external view returns (
        uint256 id,
        address proposer,
        string memory description,
        address targetAddress,
        uint256 amount,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 deadline,
        bool executed
    ) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.exists, "Proposition inexistante");
        
        return (
            proposal.id,
            proposal.proposer,
            proposal.description,
            proposal.targetAddress,
            proposal.amount,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.deadline,
            proposal.executed
        );
    }
    
    /**
     * @dev Vérifier si un utilisateur a voté sur une proposition
     */
    function hasVoted(uint256 _proposalId, address _voter) external view returns (bool) {
        return proposals[_proposalId].hasVoted[_voter];
    }
    
    /**
     * @dev Obtenir le solde de la trésorerie
     */
    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Permet de recevoir des ETH directement
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}


/**
 * @title GovernanceToken
 * @dev Token ERC20 pour la gouvernance de la DAO
 */
contract GovernanceToken is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * 10**decimals());
    }
    
    /**
     * @dev Mint de nouveaux tokens (réservé au propriétaire)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}