// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @dev ERC20Votes checkpoints are the sole source of governance voting power.
 * Holders must delegate (usually to themselves) before their balance can vote.
 */
contract GovernanceToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) ERC20Permit(name) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}

contract AdvancedInvestmentDAO is ReentrancyGuard {
    GovernanceToken public immutable governanceToken;
    address public immutable gnosisSafe;

    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant QUORUM_PERCENTAGE = 20;
    uint256 public constant APPROVAL_THRESHOLD = 50;
    uint256 public constant PROPOSAL_THRESHOLD_PERCENTAGE = 1;

    enum ProposalCategory {
        NFT_INVESTMENT,
        DEFI_INVESTMENT,
        VENTURE_CAPITAL,
        TREASURY_MANAGEMENT,
        GOVERNANCE
    }

    struct Action {
        address target;
        uint256 value;
        bytes data;
    }

    struct InvestmentMandate {
        bool active;
        uint256 expiresAt;
        uint256 executionDelay;
        uint256 transactionCap;
        uint256 version;
    }

    struct Proposal {
        address proposer;
        string description;
        address target;
        uint256 value;
        ProposalCategory category;
        uint256 snapshotBlock;
        uint256 deadline;
        uint256 executionTime;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    struct MultiActionProposal {
        address proposer;
        string description;
        ProposalCategory category;
        uint256 snapshotBlock;
        uint256 deadline;
        uint256 executionTime;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
        Action[] actions;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => MultiActionProposal) private multiActionProposals;
    mapping(uint256 => string) public proposalDiscussionURI;
    mapping(uint256 => string) public multiActionProposalDiscussionURI;
    uint256 public proposalCount;
    uint256 public multiActionProposalCount;

    bool public paused;
    uint256 public timelockDelay = 1 days;
    InvestmentMandate private investmentMandate;
    mapping(ProposalCategory => bool) public mandateCategoryAllowed;
    mapping(ProposalCategory => uint256) public mandateCategoryCap;
    mapping(ProposalCategory => uint256) public mandateCategoryAllocated;
    mapping(address => uint256) private allowedCounterpartyVersion;
    address[] private knownMandateCounterparties;
    mapping(address => bool) private knownMandateCounterparty;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        address target,
        uint256 value,
        ProposalCategory category,
        uint256 snapshotBlock
    );
    event MultiActionProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        ProposalCategory category,
        uint256 snapshotBlock
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight,
        bool multiAction
    );
    event VoteReason(
        uint256 indexed proposalId,
        address indexed voter,
        bool indexed multiAction,
        string reason
    );
    event ProposalDiscussionLinked(
        uint256 indexed proposalId,
        bool indexed multiAction,
        string discussionURI
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event MultiActionProposalExecuted(uint256 indexed proposalId);
    event Paused(address indexed safe);
    event Unpaused(address indexed safe);
    event TimelockDelayUpdated(uint256 previousDelay, uint256 newDelay);
    event FundsDeposited(address indexed depositor, uint256 amount);
    event InvestmentMandateConfigured(
        uint256 indexed version,
        uint256 expiresAt,
        uint256 executionDelay,
        uint256 transactionCap
    );
    event MandateCategoryUpdated(
        ProposalCategory indexed category,
        bool allowed,
        uint256 allocationCap
    );
    event MandateCounterpartyUpdated(address indexed counterparty, bool allowed);

    modifier onlySafe() {
        require(msg.sender == gnosisSafe, "Safe only");
        _;
    }

    modifier notPaused() {
        require(!paused, "DAO paused");
        _;
    }

    modifier onlyDAO() {
        require(msg.sender == address(this), "DAO proposal only");
        _;
    }

    constructor(address token_, address safe_) {
        require(token_ != address(0) && safe_ != address(0), "Invalid address");
        governanceToken = GovernanceToken(token_);
        gnosisSafe = safe_;
    }

    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    function depositFunds() external payable {
        require(msg.value != 0, "Amount is zero");
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @dev The snapshot is the preceding block so ERC20Votes can serve a
     * finalized checkpoint. Votes and total supply always use this same block.
     */
    function _snapshot() private view returns (uint256) {
        require(block.number > 0, "No snapshot block");
        return block.number - 1;
    }

    function _requireProposerVotingPower(
        address proposer,
        uint256 snapshotBlock
    ) private view {
        uint256 votingPower = governanceToken.getPastVotes(
            proposer,
            snapshotBlock
        );
        uint256 supply = governanceToken.getPastTotalSupply(snapshotBlock);
        require(votingPower != 0, "No voting power");
        require(
            votingPower * 100 >= supply * PROPOSAL_THRESHOLD_PERCENTAGE,
            "Proposal threshold not met"
        );
    }

    function createProposal(
        string calldata description,
        address target,
        uint256 value,
        ProposalCategory category
    ) external notPaused returns (uint256 proposalId) {
        return _createProposal(description, target, value, category, "");
    }

    function createProposalWithContext(
        string calldata description,
        address target,
        uint256 value,
        ProposalCategory category,
        string calldata discussionURI
    ) external notPaused returns (uint256 proposalId) {
        return _createProposal(description, target, value, category, discussionURI);
    }

    function _createProposal(
        string calldata description,
        address target,
        uint256 value,
        ProposalCategory category,
        string memory discussionURI
    ) private returns (uint256 proposalId) {
        uint256 snapshotBlock = _snapshot();
        _requireProposerVotingPower(msg.sender, snapshotBlock);
        require(target != address(0), "Invalid target");
        require(value <= address(this).balance, "Insufficient treasury");
        require(bytes(discussionURI).length <= 512, "Discussion URI too long");

        proposalId = ++proposalCount;
        Proposal storage proposal = proposals[proposalId];
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.target = target;
        proposal.value = value;
        proposal.category = category;
        proposal.snapshotBlock = snapshotBlock;
        proposal.deadline = block.timestamp + VOTING_PERIOD;
        proposal.executionTime = proposal.deadline + timelockDelay;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            description,
            target,
            value,
            category,
            proposal.snapshotBlock
        );
        if (bytes(discussionURI).length != 0) {
            proposalDiscussionURI[proposalId] = discussionURI;
            emit ProposalDiscussionLinked(proposalId, false, discussionURI);
        }
    }

    function createMultiActionProposal(
        string calldata description,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas,
        ProposalCategory category
    ) external notPaused returns (uint256 proposalId) {
        return
            _createMultiActionProposal(
                description,
                targets,
                values,
                datas,
                category,
                ""
            );
    }

    function createMultiActionProposalWithContext(
        string calldata description,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas,
        ProposalCategory category,
        string calldata discussionURI
    ) external notPaused returns (uint256 proposalId) {
        return
            _createMultiActionProposal(
                description,
                targets,
                values,
                datas,
                category,
                discussionURI
            );
    }

    function _validateActions(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) private view returns (uint256 aggregateValue) {
        require(
            targets.length != 0 &&
                targets.length == values.length &&
                values.length == datas.length,
            "Invalid actions"
        );

        for (uint256 i; i < targets.length; ++i) {
            require(targets[i] != address(0), "Invalid target");
            aggregateValue += values[i];
        }
        require(aggregateValue <= address(this).balance, "Insufficient treasury");
    }

    function _storeActions(
        MultiActionProposal storage proposal,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) private {
        for (uint256 i; i < targets.length; ++i) {
            proposal.actions.push(
                Action({target: targets[i], value: values[i], data: datas[i]})
            );
        }
    }

    function _createMultiActionProposal(
        string calldata description,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas,
        ProposalCategory category,
        string memory discussionURI
    ) private returns (uint256 proposalId) {
        uint256 snapshotBlock = _snapshot();
        _requireProposerVotingPower(msg.sender, snapshotBlock);
        require(bytes(discussionURI).length <= 512, "Discussion URI too long");
        _validateActions(targets, values, datas);

        proposalId = ++multiActionProposalCount;
        MultiActionProposal storage proposal = multiActionProposals[proposalId];
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.category = category;
        proposal.snapshotBlock = snapshotBlock;
        proposal.deadline = block.timestamp + VOTING_PERIOD;
        proposal.executionTime = proposal.deadline + timelockDelay;
        _storeActions(proposal, targets, values, datas);

        emit MultiActionProposalCreated(
            proposalId,
            msg.sender,
            description,
            category,
            proposal.snapshotBlock
        );
        if (bytes(discussionURI).length != 0) {
            multiActionProposalDiscussionURI[proposalId] = discussionURI;
            emit ProposalDiscussionLinked(proposalId, true, discussionURI);
        }
    }

    function _voteWeight(uint256 snapshotBlock, address voter)
        private
        view
        returns (uint256)
    {
        return governanceToken.getPastVotes(voter, snapshotBlock);
    }

    function vote(uint256 proposalId, bool support) external notPaused {
        _vote(proposalId, support, "");
    }

    function voteWithReason(
        uint256 proposalId,
        bool support,
        string calldata reason
    ) external notPaused {
        require(bytes(reason).length <= 280, "Reason too long");
        _vote(proposalId, support, reason);
    }

    function _vote(
        uint256 proposalId,
        bool support,
        string memory reason
    ) private {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer != address(0), "Proposal does not exist");
        require(block.timestamp < proposal.deadline, "Voting closed");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 weight = _voteWeight(proposal.snapshotBlock, msg.sender);
        require(weight != 0, "No voting power at snapshot");
        proposal.hasVoted[msg.sender] = true;
        if (support) proposal.votesFor += weight;
        else proposal.votesAgainst += weight;
        emit VoteCast(proposalId, msg.sender, support, weight, false);
        if (bytes(reason).length != 0) {
            emit VoteReason(proposalId, msg.sender, false, reason);
        }
    }

    function voteMultiAction(uint256 proposalId, bool support) external notPaused {
        _voteMultiAction(proposalId, support, "");
    }

    function voteMultiActionWithReason(
        uint256 proposalId,
        bool support,
        string calldata reason
    ) external notPaused {
        require(bytes(reason).length <= 280, "Reason too long");
        _voteMultiAction(proposalId, support, reason);
    }

    function _voteMultiAction(
        uint256 proposalId,
        bool support,
        string memory reason
    ) private {
        MultiActionProposal storage proposal = multiActionProposals[proposalId];
        require(proposal.proposer != address(0), "Proposal does not exist");
        require(block.timestamp < proposal.deadline, "Voting closed");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 weight = _voteWeight(proposal.snapshotBlock, msg.sender);
        require(weight != 0, "No voting power at snapshot");
        proposal.hasVoted[msg.sender] = true;
        if (support) proposal.votesFor += weight;
        else proposal.votesAgainst += weight;
        emit VoteCast(proposalId, msg.sender, support, weight, true);
        if (bytes(reason).length != 0) {
            emit VoteReason(proposalId, msg.sender, true, reason);
        }
    }

    function _isApproved(
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 snapshotBlock
    ) private view returns (bool) {
        uint256 totalVotes = votesFor + votesAgainst;
        uint256 snapshotSupply = governanceToken.getPastTotalSupply(snapshotBlock);
        return
            totalVotes != 0 &&
            totalVotes * 100 >= snapshotSupply * QUORUM_PERCENTAGE &&
            votesFor * 100 >= totalVotes * APPROVAL_THRESHOLD;
    }

    function _requireExecutionDelay(
        uint256 deadline,
        ProposalCategory category
    ) private view {
        uint256 requiredDelay = timelockDelay;
        if (
            investmentMandate.active &&
            category != ProposalCategory.GOVERNANCE &&
            investmentMandate.executionDelay > requiredDelay
        ) {
            requiredDelay = investmentMandate.executionDelay;
        }
        require(block.timestamp >= deadline + requiredDelay, "Mandate delay active");
    }

    function _enforceMandate(
        ProposalCategory category,
        address target,
        uint256 value
    ) private {
        if (!investmentMandate.active || category == ProposalCategory.GOVERNANCE) {
            return;
        }

        require(block.timestamp <= investmentMandate.expiresAt, "Mandate expired");
        require(mandateCategoryAllowed[category], "Category not allowed");
        require(
            allowedCounterpartyVersion[target] == investmentMandate.version,
            "Counterparty not allowed"
        );
        require(value <= investmentMandate.transactionCap, "Transaction cap exceeded");

        uint256 updatedAllocation = mandateCategoryAllocated[category] + value;
        require(
            updatedAllocation <= mandateCategoryCap[category],
            "Allocation cap exceeded"
        );
        mandateCategoryAllocated[category] = updatedAllocation;
    }

    function executeProposal(uint256 proposalId)
        external
        onlySafe
        nonReentrant
        notPaused
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer != address(0), "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        _requireExecutionDelay(proposal.deadline, proposal.category);
        require(
            _isApproved(
                proposal.votesFor,
                proposal.votesAgainst,
                proposal.snapshotBlock
            ),
            "Proposal not approved"
        );

        _enforceMandate(proposal.category, proposal.target, proposal.value);
        proposal.executed = true;
        (bool success, ) = proposal.target.call{value: proposal.value}("");
        require(success, "Action failed");
        emit ProposalExecuted(proposalId);
    }

    function executeMultiActionProposal(uint256 proposalId)
        external
        onlySafe
        nonReentrant
        notPaused
    {
        MultiActionProposal storage proposal = multiActionProposals[proposalId];
        require(proposal.proposer != address(0), "Proposal does not exist");
        require(!proposal.executed, "Already executed");
        _requireExecutionDelay(proposal.deadline, proposal.category);
        require(
            _isApproved(
                proposal.votesFor,
                proposal.votesAgainst,
                proposal.snapshotBlock
            ),
            "Proposal not approved"
        );

        for (uint256 i; i < proposal.actions.length; ++i) {
            Action storage action = proposal.actions[i];
            _enforceMandate(proposal.category, action.target, action.value);
        }

        proposal.executed = true;
        for (uint256 i; i < proposal.actions.length; ++i) {
            Action storage action = proposal.actions[i];
            (bool success, ) = action.target.call{value: action.value}(action.data);
            require(success, "Action failed");
        }
        emit MultiActionProposalExecuted(proposalId);
    }

    function pause() external onlySafe {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlySafe {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function setTimelockDelay(uint256 delay) external onlySafe {
        require(delay >= 1 hours, "Delay too short");
        emit TimelockDelayUpdated(timelockDelay, delay);
        timelockDelay = delay;
    }

    /**
     * @dev A mandate is changed only by a passed governance proposal whose
     * execution is authorized by the Safe. A new version resets allocations.
     */
    function configureInvestmentMandate(
        uint256 expiresAt,
        uint256 executionDelay,
        uint256 transactionCap
    ) external onlyDAO {
        require(expiresAt > block.timestamp, "Invalid expiry");
        require(executionDelay >= 1 hours, "Delay too short");
        require(transactionCap != 0, "Transaction cap is zero");

        investmentMandate.active = true;
        investmentMandate.expiresAt = expiresAt;
        investmentMandate.executionDelay = executionDelay;
        investmentMandate.transactionCap = transactionCap;
        investmentMandate.version += 1;
        for (uint256 i; i < uint256(ProposalCategory.GOVERNANCE); ++i) {
            ProposalCategory category = ProposalCategory(i);
            mandateCategoryAllowed[category] = false;
            mandateCategoryCap[category] = 0;
            mandateCategoryAllocated[category] = 0;
        }
        emit InvestmentMandateConfigured(
            investmentMandate.version,
            expiresAt,
            executionDelay,
            transactionCap
        );
    }

    function setMandateCategory(
        ProposalCategory category,
        bool allowed,
        uint256 allocationCap
    ) external onlyDAO {
        require(category != ProposalCategory.GOVERNANCE, "Governance exempt");
        require(!allowed || allocationCap != 0, "Allocation cap is zero");
        mandateCategoryAllowed[category] = allowed;
        mandateCategoryCap[category] = allowed ? allocationCap : 0;
        emit MandateCategoryUpdated(category, allowed, mandateCategoryCap[category]);
    }

    function setMandateCounterparty(address counterparty, bool allowed)
        external
        onlyDAO
    {
        require(counterparty != address(0), "Invalid counterparty");
        if (allowed && !knownMandateCounterparty[counterparty]) {
            knownMandateCounterparty[counterparty] = true;
            knownMandateCounterparties.push(counterparty);
        }
        allowedCounterpartyVersion[counterparty] = allowed
            ? investmentMandate.version
            : 0;
        emit MandateCounterpartyUpdated(counterparty, allowed);
    }

    function setInvestmentMandateActive(bool active) external onlyDAO {
        investmentMandate.active = active;
    }

    function getInvestmentMandate()
        external
        view
        returns (
            bool active,
            uint256 expiresAt,
            uint256 executionDelay,
            uint256 transactionCap,
            uint256 version
        )
    {
        return (
            investmentMandate.active,
            investmentMandate.expiresAt,
            investmentMandate.executionDelay,
            investmentMandate.transactionCap,
            investmentMandate.version
        );
    }

    function isMandateCounterpartyAllowed(address counterparty)
        external
        view
        returns (bool)
    {
        return
            allowedCounterpartyVersion[counterparty] ==
            investmentMandate.version;
    }

    function getActiveMandateCounterparties()
        external
        view
        returns (address[] memory counterparties)
    {
        if (!investmentMandate.active) {
            return new address[](0);
        }

        uint256 activeCount;
        for (uint256 i; i < knownMandateCounterparties.length; ++i) {
            if (
                allowedCounterpartyVersion[knownMandateCounterparties[i]] ==
                investmentMandate.version
            ) {
                activeCount++;
            }
        }

        counterparties = new address[](activeCount);
        uint256 index;
        for (uint256 i; i < knownMandateCounterparties.length; ++i) {
            address counterparty = knownMandateCounterparties[i];
            if (
                allowedCounterpartyVersion[counterparty] ==
                investmentMandate.version
            ) {
                counterparties[index++] = counterparty;
            }
        }
    }

    function getProposal(uint256 proposalId)
        external
        view
        returns (
            address proposer,
            address target,
            uint256 value,
            uint256 snapshotBlock,
            uint256 deadline,
            uint256 executionTime,
            uint256 votesFor,
            uint256 votesAgainst,
            bool executed,
            string memory description,
            ProposalCategory category
        )
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.proposer != address(0), "Proposal does not exist");
        return (
            proposal.proposer,
            proposal.target,
            proposal.value,
            proposal.snapshotBlock,
            proposal.deadline,
            proposal.executionTime,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.executed,
            proposal.description,
            proposal.category
        );
    }

    function getMultiActionProposal(uint256 proposalId)
        external
        view
        returns (
            address proposer,
            uint256 snapshotBlock,
            uint256 deadline,
            uint256 executionTime,
            uint256 votesFor,
            uint256 votesAgainst,
            bool executed,
            uint256 actionCount,
            string memory description,
            ProposalCategory category
        )
    {
        MultiActionProposal storage proposal = multiActionProposals[proposalId];
        require(proposal.proposer != address(0), "Proposal does not exist");
        return (
            proposal.proposer,
            proposal.snapshotBlock,
            proposal.deadline,
            proposal.executionTime,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.executed,
            proposal.actions.length,
            proposal.description,
            proposal.category
        );
    }

    function getMultiAction(uint256 proposalId, uint256 actionIndex)
        external
        view
        returns (address target, uint256 value, bytes memory data)
    {
        MultiActionProposal storage proposal = multiActionProposals[proposalId];
        require(proposal.proposer != address(0), "Proposal does not exist");
        Action storage action = proposal.actions[actionIndex];
        return (action.target, action.value, action.data);
    }

    function proposalHasVoted(uint256 proposalId, address voter)
        external
        view
        returns (bool)
    {
        return proposals[proposalId].hasVoted[voter];
    }

    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
