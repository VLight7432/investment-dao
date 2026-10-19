import { expect } from "chai";
import { network } from "hardhat";

describe("AdvancedInvestmentDAO hybrid governance", function () {
  let dao, token, safe;
  let daoAddress, tokenAddress, safeAddress, ethers, networkHelpers;
  let safeOwner, alice, bob, carol, recipient;
  const unit = (value) => ethers.parseEther(value);

  beforeEach(async function () {
    ({ ethers, networkHelpers } = await network.getOrCreate());
    [safeOwner, alice, bob, carol, recipient] = await ethers.getSigners();

    const Token = await ethers.getContractFactory(
      "contracts/AdvancedInvestmentDAO.sol:GovernanceToken"
    );
    token = await Token.deploy("DAO Token", "DTO", 1000);
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();
    await token.transfer(alice.address, unit("300"));
    await token.transfer(bob.address, unit("300"));
    await token.transfer(carol.address, unit("300"));

    const Safe = await ethers.getContractFactory("MockSafe");
    safe = await Safe.deploy([safeOwner.address], 1);
    await safe.waitForDeployment();
    safeAddress = await safe.getAddress();
    const DAO = await ethers.getContractFactory("AdvancedInvestmentDAO");
    dao = await DAO.deploy(tokenAddress, safeAddress);
    await dao.waitForDeployment();
    daoAddress = await dao.getAddress();
    await dao.depositFunds({ value: unit("10") });

    // ERC20Votes requires explicit delegation. This creates checkpoints before
    // any proposal is created.
    await token.connect(alice).delegate(alice.address);
    await token.connect(bob).delegate(bob.address);
    await token.connect(carol).delegate(carol.address);
  });

  async function createFundedProposal() {
    await dao.connect(alice).createProposal(
      "Fund recipient",
      recipient.address,
      unit("1"),
      0
    );
  }

  async function passProposal(proposalId = 1) {
    await dao.connect(alice).vote(proposalId, true);
    await dao.connect(bob).vote(proposalId, true);
    await networkHelpers.time.increase(4 * 24 * 60 * 60);
  }

  function daoCall(functionName, args = []) {
    return dao.interface.encodeFunctionData(functionName, args);
  }

  async function safeExecute(functionName, args = []) {
    const data = daoCall(functionName, args);
    await safe.connect(safeOwner).approveTransaction(daoAddress, 0, data);
    return safe.connect(safeOwner).execute(daoAddress, 0, data);
  }

  async function configureMandate({
    expiresAt,
    executionDelay = 2 * 24 * 60 * 60,
    transactionCap = unit("2"),
    category = 0,
    allocationCap = unit("4"),
    counterparty = recipient.address,
  } = {}) {
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    const expiry = expiresAt ?? now + 30 * 24 * 60 * 60;
    await dao.connect(alice).createMultiActionProposal(
      "Configure investment mandate",
      [daoAddress, daoAddress, daoAddress],
      [0, 0, 0],
      [
        daoCall("configureInvestmentMandate", [expiry, executionDelay, transactionCap]),
        daoCall("setMandateCategory", [category, true, allocationCap]),
        daoCall("setMandateCounterparty", [counterparty, true]),
      ],
      4
    );
    await dao.connect(alice).voteMultiAction(1, true);
    await dao.connect(bob).voteMultiAction(1, true);
    await networkHelpers.time.increase(4 * 24 * 60 * 60);
    await safeExecute("executeMultiActionProposal", [1]);
  }

  it("uses linear ERC20Votes snapshot weights and a 20% snapshot quorum", async function () {
    await createFundedProposal();
    const proposal = await dao.getProposal(1);
    const snapshotBlock = proposal.snapshotBlock;
    const aliceSnapshotVotes = await token.getPastVotes(alice.address, snapshotBlock);
    const supplySnapshot = await token.getPastTotalSupply(snapshotBlock);

    expect(supplySnapshot).to.equal(unit("1000"));
    expect(aliceSnapshotVotes).to.equal(unit("300"));
    expect(proposal.description).to.equal("Fund recipient");
    expect(proposal.category).to.equal(0n);
    await dao.connect(alice).vote(1, true);
    expect((await dao.getProposal(1)).votesFor).to.equal(aliceSnapshotVotes);
  });

  it("requires 1% of snapshot supply to create a proposal", async function () {
    await token.transfer(recipient.address, unit("5"));
    await token.connect(recipient).delegate(recipient.address);
    await expect(
      dao.connect(recipient).createProposal(
        "Insufficient proposal threshold",
        recipient.address,
        0,
        4
      )
    ).to.be.revertedWith("Proposal threshold not met");

    await token.transfer(recipient.address, unit("5"));
    await dao.connect(recipient).createProposal(
      "Threshold met",
      recipient.address,
      0,
      4
    );
    expect(await dao.proposalCount()).to.equal(1n);
  });

  it("anchors public discussion context and optional vote reasons on-chain", async function () {
    const discussionURI = "ipfs://bafybeigdyrzt/proposal-context";
    await dao.connect(alice).createProposalWithContext(
      "Fund recipient with public rationale",
      recipient.address,
      unit("1"),
      0,
      discussionURI
    );
    expect(await dao.proposalDiscussionURI(1)).to.equal(discussionURI);
    await expect(
      dao.connect(alice).voteWithReason(1, true, "Le mandat et le risque sont respectés.")
    )
      .to.emit(dao, "VoteReason")
      .withArgs(1, alice.address, false, "Le mandat et le risque sont respectés.");
  });

  it("moves token minting authority from the deployer to DAO governance", async function () {
    await token.transferOwnership(daoAddress);
    await expect(
      token.mint(recipient.address, unit("1"))
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await dao.connect(alice).createMultiActionProposal(
      "Authorize a governed token issuance",
      [tokenAddress],
      [0],
      [token.interface.encodeFunctionData("mint", [recipient.address, unit("1")])],
      4
    );
    await dao.connect(alice).voteMultiAction(1, true);
    await dao.connect(bob).voteMultiAction(1, true);
    await networkHelpers.time.increase(4 * 24 * 60 * 60);
    await safeExecute("executeMultiActionProposal", [1]);
    expect(await token.balanceOf(recipient.address)).to.equal(unit("1"));
  });

  it("enforces 20% quorum and accepts exactly 50% approval", async function () {
    // Carol has 10% of the fixed supply at the next proposal snapshot.
    await token.connect(carol).transfer(recipient.address, unit("200"));
    await createFundedProposal();
    await dao.connect(carol).vote(1, true);
    await networkHelpers.time.increase(4 * 24 * 60 * 60);
    const rejectedProposalData = daoCall("executeProposal", [1]);
    await safe
      .connect(safeOwner)
      .approveTransaction(daoAddress, 0, rejectedProposalData);
    await expect(
      safe.connect(safeOwner).execute(daoAddress, 0, rejectedProposalData)
    ).to.be.revertedWith("Safe execution failed");

    await createFundedProposal();
    await dao.connect(alice).vote(2, true);
    await dao.connect(bob).vote(2, false);
    await networkHelpers.time.increase(4 * 24 * 60 * 60);
    await safeExecute("executeProposal", [2]);
    expect((await dao.getProposal(2)).executed).to.equal(true);
  });

  it("prevents token recycling after the proposal snapshot", async function () {
    await createFundedProposal();
    const snapshotBlock = (await dao.getProposal(1)).snapshotBlock;
    const aliceWeight = await token.getPastVotes(alice.address, snapshotBlock);

    await token.connect(alice).transfer(recipient.address, unit("300"));
    await dao.connect(alice).vote(1, true);
    await expect(dao.connect(recipient).vote(1, true)).to.be.revertedWith(
      "No voting power at snapshot"
    );
    expect((await dao.getProposal(1)).votesFor).to.equal(aliceWeight);
  });

  it("uses delegation checkpoints and ignores delegation changes after snapshot", async function () {
    // Move Alice's checkpointed voting units to Bob before creating the proposal.
    await token.connect(alice).delegate(bob.address);
    await dao.connect(bob).createProposal(
      "Delegated voting",
      recipient.address,
      unit("1"),
      0
    );
    const snapshotBlock = (await dao.getProposal(1)).snapshotBlock;
    const bobWeight = await token.getPastVotes(bob.address, snapshotBlock);
    expect(bobWeight).to.equal(unit("600"));

    // This change affects only later checkpoints, never this proposal.
    await token.connect(alice).delegate(alice.address);
    await dao.connect(bob).vote(1, true);
    await expect(dao.connect(alice).vote(1, true)).to.be.revertedWith(
      "No voting power at snapshot"
    );
    expect((await dao.getProposal(1)).votesFor).to.equal(unit("600"));
  });

  it("rejects direct Safe-owner execution but executes when called through Safe", async function () {
    await createFundedProposal();
    await passProposal();

    await expect(dao.connect(safeOwner).executeProposal(1)).to.be.revertedWith(
      "Safe only"
    );

    const before = await ethers.provider.getBalance(recipient.address);
    await safeExecute("executeProposal", [1]);
    expect(await ethers.provider.getBalance(recipient.address)).to.equal(
      before + unit("1")
    );
    expect((await dao.getProposal(1)).executed).to.equal(true);
  });

  it("permits pause and timelock management only through Safe", async function () {
    await expect(dao.connect(safeOwner).pause()).to.be.revertedWith("Safe only");
    await expect(dao.connect(safeOwner).setTimelockDelay(3600)).to.be.revertedWith(
      "Safe only"
    );

    await safeExecute("pause");
    expect(await dao.paused()).to.equal(true);
    await safeExecute("setTimelockDelay", [7200]);
    expect(await dao.timelockDelay()).to.equal(7200n);
    await safeExecute("unpause");
    expect(await dao.paused()).to.equal(false);
  });

  it("only lets a passed DAO proposal configure an investment mandate", async function () {
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    await expect(
      dao.connect(safeOwner).configureInvestmentMandate(
        now + 86_400,
        3_600,
        unit("1")
      )
    ).to.be.revertedWith("DAO proposal only");

    await configureMandate();
    const mandate = await dao.getInvestmentMandate();
    expect(mandate.active).to.equal(true);
    expect(mandate.transactionCap).to.equal(unit("2"));
    expect(await dao.mandateCategoryAllowed(0)).to.equal(true);
    expect(await dao.isMandateCounterpartyAllowed(recipient.address)).to.equal(true);
    expect(await dao.getActiveMandateCounterparties()).to.deep.equal([recipient.address]);
  });

  it("enforces mandate delay and cumulative allocation caps", async function () {
    await configureMandate({
      executionDelay: 5 * 24 * 60 * 60,
      transactionCap: unit("1"),
      allocationCap: unit("1.5"),
    });

    await dao.connect(alice).createProposal("Too early", recipient.address, unit("1"), 0);
    await dao.connect(alice).vote(1, true);
    await dao.connect(bob).vote(1, true);
    await networkHelpers.time.increase(4 * 24 * 60 * 60);
    const firstExecution = daoCall("executeProposal", [1]);
    await safe.connect(safeOwner).approveTransaction(daoAddress, 0, firstExecution);
    await expect(
      safe.connect(safeOwner).execute(daoAddress, 0, firstExecution)
    ).to.be.revertedWith("Safe execution failed");

    await networkHelpers.time.increase(5 * 24 * 60 * 60);
    await safe.connect(safeOwner).execute(daoAddress, 0, firstExecution);
    expect(await dao.mandateCategoryAllocated(0)).to.equal(unit("1"));

    await dao.connect(alice).createProposal("Exceeds cap", recipient.address, unit("1"), 0);
    await dao.connect(alice).vote(2, true);
    await dao.connect(bob).vote(2, true);
    await networkHelpers.time.increase(6 * 24 * 60 * 60);
    await expect(safeExecute("executeProposal", [2])).to.be.revertedWith(
      "Safe execution failed"
    );
  });

  it("rejects non-whitelisted counterparties and expired mandates", async function () {
    const now = (await ethers.provider.getBlock("latest")).timestamp;
    await configureMandate({ expiresAt: now + 5 * 24 * 60 * 60 });

    await dao.connect(alice).createProposal("Wrong counterparty", carol.address, unit("1"), 0);
    await dao.connect(alice).vote(1, true);
    await dao.connect(bob).vote(1, true);
    await networkHelpers.time.increase(4 * 24 * 60 * 60);
    await expect(safeExecute("executeProposal", [1])).to.be.revertedWith(
      "Safe execution failed"
    );

    await dao.connect(alice).createProposal("Expired mandate", recipient.address, unit("1"), 0);
    await dao.connect(alice).vote(2, true);
    await dao.connect(bob).vote(2, true);
    await networkHelpers.time.increase(2 * 24 * 60 * 60);
    await expect(safeExecute("executeProposal", [2])).to.be.revertedWith(
      "Safe execution failed"
    );
  });

  it("rejects malformed or unfunded multi-action proposals", async function () {
    await expect(
      dao.connect(alice).createMultiActionProposal("none", [], [], [], 0)
    ).to.be.revertedWith("Invalid actions");
    await expect(
      dao.connect(alice).createMultiActionProposal(
        "length",
        [recipient.address],
        [],
        ["0x"],
        0
      )
    ).to.be.revertedWith("Invalid actions");
    await expect(
      dao.connect(alice).createMultiActionProposal(
        "target",
        [ethers.ZeroAddress],
        [0],
        ["0x"],
        0
      )
    ).to.be.revertedWith("Invalid target");
    await expect(
      dao.connect(alice).createMultiActionProposal(
        "treasury",
        [recipient.address, recipient.address],
        [unit("6"), unit("6")],
        ["0x", "0x"],
        0
      )
    ).to.be.revertedWith("Insufficient treasury");
  });

  it("requires voting power for multi-action creation and Safe execution", async function () {
    await expect(
      dao.connect(recipient).createMultiActionProposal(
        "no voting power",
        [recipient.address],
        [0],
        ["0x"],
        0
      )
    ).to.be.revertedWith("No voting power");

    await dao.connect(alice).createMultiActionProposal(
      "two transfers",
      [recipient.address, recipient.address],
      [unit("1"), unit("1")],
      ["0x", "0x"],
      0
    );
    const multiProposal = await dao.getMultiActionProposal(1);
    expect(multiProposal.description).to.equal("two transfers");
    expect(multiProposal.category).to.equal(0n);
    await dao.connect(alice).voteMultiAction(1, true);
    await dao.connect(bob).voteMultiAction(1, true);
    await networkHelpers.time.increase(4 * 24 * 60 * 60);
    await expect(dao.connect(safeOwner).executeMultiActionProposal(1)).to.be.revertedWith(
      "Safe only"
    );
    await safeExecute("executeMultiActionProposal", [1]);
  });
});
