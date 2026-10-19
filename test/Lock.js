import { anyValue } from "@nomicfoundation/hardhat-ethers-chai-matchers/withArgs";
import { network } from "hardhat";
import { expect } from "chai";

describe("Lock", function () {
  async function loadFixture(fixture) {
    const { networkHelpers } = await network.getOrCreate();
    return networkHelpers.loadFixture(fixture);
  }

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const { ethers, networkHelpers } = await network.getOrCreate();
    const lockedAmount = ONE_GWEI;
    const unlockTime = (await networkHelpers.time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const lock = await ethers.deployContract("Lock", [unlockTime], {
      value: lockedAmount,
    });
    await lock.waitForDeployment();

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.unlockTime()).to.equal(BigInt(unlockTime));
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.owner()).to.equal(owner.address);
    });

    it("Should receive and store the funds to lock", async function () {
      const { lock, lockedAmount } = await loadFixture(
        deployOneYearLockFixture,
      );
      const { ethers } = await network.getOrCreate();

      expect(await ethers.provider.getBalance(await lock.getAddress())).to.equal(
        lockedAmount,
      );
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      // We don't use the fixture here because we want a different deployment
      const { ethers, networkHelpers } = await network.getOrCreate();
      const latestTime = await networkHelpers.time.latest();
      const Lock = await ethers.getContractFactory("Lock");
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
        "Unlock time should be in the future",
      );
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet",
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture,
        );

        // We can increase the time in Hardhat Network
        const { networkHelpers } = await network.getOrCreate();
        await networkHelpers.time.increaseTo(unlockTime);

        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner",
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture,
        );

        // Transactions are sent using the first signer by default
        const { ethers, networkHelpers } = await network.getOrCreate();
        await networkHelpers.time.increaseTo(unlockTime);

        await expect(lock.withdraw()).not.to.revert(ethers);
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture,
        );

        const { networkHelpers } = await network.getOrCreate();
        await networkHelpers.time.increaseTo(unlockTime);

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture,
        );

        const { ethers, networkHelpers } = await network.getOrCreate();
        await networkHelpers.time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances(ethers,
          [owner, lock],
          [lockedAmount, -lockedAmount],
        );
      });
    });
  });

  describe('Lock', function () {
    it('devrait verrouiller et déverrouiller correctement', async function () {
      // TODO: Ajouter le test de verrouillage/déverrouillage
    });
  });
});
