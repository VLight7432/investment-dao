import { expect } from "chai";
import { network } from "hardhat";

describe("Peripheral access control", function () {
  let dao;
  let outsider;
  let ethers;

  beforeEach(async function () {
    ({ ethers } = await network.getOrCreate());
    [dao, outsider] = await ethers.getSigners();
  });

  it("only permits the DAO to invoke DeFi actions", async function () {
    const DeFiIntegration = await ethers.getContractFactory("DeFiIntegration");
    const integration = await DeFiIntegration.deploy(
      dao.address,
      dao.address,
      dao.address,
      dao.address,
      dao.address
    );
    await integration.waitForDeployment();

    await expect(
      integration.connect(outsider).depositAave(outsider.address, 1)
    ).to.be.revertedWith("Seule la DAO peut agir");
  });

  it("only permits the DAO to generate quarterly reports", async function () {
    const QuarterlyReport = await ethers.getContractFactory("QuarterlyReport");
    const report = await QuarterlyReport.deploy(dao.address);
    await report.waitForDeployment();

    await expect(
      report.connect(outsider).generateQuarterlyReport(1, 1, 0, 1, 1)
    ).to.be.revertedWith("Seule la DAO peut generer un rapport");
  });

  it("enforces the configured Safe approval threshold", async function () {
    const [, secondOwner] = await ethers.getSigners();
    const MockSafe = await ethers.getContractFactory("MockSafe");
    const safe = await MockSafe.deploy([dao.address, secondOwner.address], 2);

    await expect(
      safe.connect(dao).execute(outsider.address, 0, "0x")
    ).to.be.revertedWith("Threshold not met");

    await safe.connect(dao).approveTransaction(outsider.address, 0, "0x");
    await safe.connect(secondOwner).approveTransaction(outsider.address, 0, "0x");
    await safe.connect(dao).execute(outsider.address, 0, "0x");
  });

  it("rejects incomplete NFT trading configuration", async function () {
    const NFTTrading = await ethers.getContractFactory("NFTTrading");

    await expect(
      NFTTrading.deploy(ethers.ZeroAddress, dao.address)
    ).to.be.revertedWith("Adresse DAO invalide");
    await expect(
      NFTTrading.deploy(dao.address, ethers.ZeroAddress)
    ).to.be.revertedWith("Adresse Seaport invalide");
  });
});
