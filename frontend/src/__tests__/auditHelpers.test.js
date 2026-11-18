import { describe, expect, it } from "vitest";
import { ethers } from "ethers";
import { describeGovernanceAction, proposalLifecycle } from "../auditHelpers";

describe("journal de gouvernance", () => {
  it("utilise le timelock figé et le délai du mandat courant", () => {
    const proposal = { executed: false, approved: true, deadline: 100, executionTime: 200, category: 0 };
    expect(proposalLifecycle(proposal, 150, 0)).toBe("Délai de sécurité actif");
    expect(proposalLifecycle(proposal, 210, 150)).toBe("Délai de sécurité actif");
    expect(proposalLifecycle(proposal, 250, 150)).toBe("Délai écoulé · contrôles à vérifier");
    expect(proposalLifecycle({ ...proposal, category: 4 }, 210, 150)).toBe("Délai écoulé · contrôles à vérifier");
  });

  it("affiche les modifications du mandat et signale les actions inconnues", () => {
    const dao = {
      target: "0x1111111111111111111111111111111111111111",
      interface: new ethers.Interface([
        "function setMandateCategory(uint8 category, bool allowed, uint256 cap)",
        "function setTimelockDelay(uint256 delay)",
      ]),
    };
    const category = dao.interface.encodeFunctionData("setMandateCategory", [1, true, ethers.parseEther("4")]);
    expect(describeGovernanceAction(dao, dao.target, 0n, category)).toBe("Catégorie 1 : autorisée, plafond 4.0 ETH");
    const delay = dao.interface.encodeFunctionData("setTimelockDelay", [3600]);
    expect(describeGovernanceAction(dao, dao.target, 0n, delay)).toBe("Timelock des futures propositions : 3600 s");
    expect(describeGovernanceAction(dao, dao.target, 0n, "0xdeadbeef")).toContain("Action à vérifier");
    expect(describeGovernanceAction(dao, "0x2222222222222222222222222222222222222222", 1n, "0x")).toContain("Action à vérifier");
  });
});
