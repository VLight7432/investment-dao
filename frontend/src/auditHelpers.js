import { ethers } from "ethers";

export function proposalLifecycle(proposal, now, mandateDelay) {
  if (proposal.executed) return "Exécutée";
  if (now < proposal.deadline) return "Vote en cours";
  if (!proposal.approved) return "Vote non approuvé";
  const mandateTime = proposal.category === 4 ? 0 : proposal.deadline + mandateDelay;
  return now < Math.max(proposal.executionTime, mandateTime) ? "Délai de sécurité actif" : "Délai écoulé · contrôles à vérifier";
}

export function describeGovernanceAction(dao, target, value, data) {
  const unknown = `Action à vérifier : cible ${target}, valeur ${ethers.formatEther(value)} ETH, données ${data}`;
  if (target.toLowerCase() !== dao.target.toLowerCase() || value !== 0n || data.length < 10) return unknown;
  let parsed;
  try {
    parsed = dao.interface.parseTransaction({ data });
  } catch {
    return unknown;
  }
  if (!parsed) return unknown;
  const args = parsed.args;
  switch (parsed.name) {
    case "configureInvestmentMandate":
      return `Nouvelle version : expiration ${new Date(Number(args[0]) * 1000).toLocaleString("fr-FR")}, délai ${args[1]} s, plafond ${ethers.formatEther(args[2])} ETH`;
    case "setMandateCategory":
      return `Catégorie ${args[0]} : ${args[1] ? `autorisée, plafond ${ethers.formatEther(args[2])} ETH` : "désactivée"}`;
    case "setMandateCounterparty":
      return `Contrepartie ${args[0]} : ${args[1] ? "autorisée" : "retirée"}`;
    case "setInvestmentMandateActive":
      return `Mandat : ${args[0] ? "activation" : "désactivation"}`;
    case "setTimelockDelay":
      return `Timelock des futures propositions : ${args[0]} s`;
    default:
      return unknown;
  }
}
