import { network } from "hardhat";

const DAO_ADDRESS = "VOTRE_ADRESSE_DAO";
const TOKEN_ADDRESS = "VOTRE_ADRESSE_TOKEN";
let ethers;

/**
 * Script 1: Déléguer son vote
 */
async function delegateVote(delegateAddress) {
  console.log(`🤝 Délégation du vote à ${delegateAddress}...\n`);

  const dao = await ethers.getContractAt("AdvancedInvestmentDAO", DAO_ADDRESS);
  const token = await ethers.getContractAt("GovernanceToken", TOKEN_ADDRESS);
  const [signer] = await ethers.getSigners();

  const balance = await token.balanceOf(signer.address);
  console.log("   Votre balance:", ethers.formatEther(balance), "tokens");

  const tx = await dao.delegateVote(delegateAddress);
  const receipt = await tx.wait();

  console.log("✅ Délégation effectuée!");
  console.log("   Hash:", receipt.hash);
  console.log("   Votre vote est maintenant exercé par:", delegateAddress);
  console.log("\n");
}

/**
 * Script 2: Révoquer sa délégation
 */
async function revokeDelegation() {
  console.log("🔓 Révocation de la délégation...\n");

  const dao = await ethers.getContractAt("AdvancedInvestmentDAO", DAO_ADDRESS);
  const [signer] = await ethers.getSigners();

  const delegation = await dao.getDelegation(signer.address);
  console.log("   Délégation actuelle vers:", delegation.delegate);

  const tx = await dao.revokeDelegation();
  const receipt = await tx.wait();

  console.log("✅ Délégation révoquée!");
  console.log("   Hash:", receipt.hash);
  console.log("\n");
}

/**
 * Script 3: Consulter le pouvoir de vote
 */
async function getVotingPower(address) {
  console.log(`⚡ Pouvoir de vote de ${address}...\n`);

  const dao = await ethers.getContractAt("AdvancedInvestmentDAO", DAO_ADDRESS);
  const token = await ethers.getContractAt("GovernanceToken", TOKEN_ADDRESS);

  const ownTokens = await token.balanceOf(address);
  const totalPower = await dao.getVotingPower(address);
  const delegators = await dao.getDelegators(address);

  console.log("━".repeat(60));
  console.log("Tokens personnels:", ethers.formatEther(ownTokens));
  console.log("Pouvoir de vote total:", ethers.formatEther(totalPower));
  console.log("Tokens délégués:", ethers.formatEther(totalPower - ownTokens));
  console.log("Nombre de délégateurs:", delegators.length);
  
  if (delegators.length > 0) {
    console.log("\nDélégateurs:");
    for (let i = 0; i < delegators.length; i++) {
      const delBalance = await token.balanceOf(delegators[i]);
      console.log(`  ${i+1}. ${delegators[i]}: ${ethers.formatEther(delBalance)} tokens`);
    }
  }
  console.log("━".repeat(60));
  console.log("\n");
}

/**
 * Script 4: Consulter la réputation
 */
async function getReputation(address) {
  console.log(`🏆 Réputation de ${address}...\n`);

  const dao = await ethers.getContractAt("AdvancedInvestmentDAO", DAO_ADDRESS);
  
  const rep = await dao.getReputationScore(address);
  
  console.log("━".repeat(60));
  console.log("SCORE DE RÉPUTATION:", rep.score.toString());
  console.log("━".repeat(60));
  console.log("\n📊 STATISTIQUES:");
  console.log("  Total propositions:", rep.totalProposals.toString());
  console.log("  Propositions réussies:", rep.successful.toString());
  console.log("  Propositions échouées:", rep.failed.toString());
  console.log("  Participations aux votes:", rep.participation.toString());
  console.log("  Taux de succès:", rep.successRate.toString() + "%");
  console.log("━".repeat(60));
  
  // Afficher expertise par catégorie
  console.log("\n🎯 EXPERTISE PAR CATÉGORIE:");
  const categories = [
    "NFT Investment",
    "DeFi Investment",
    "Venture Capital",
    "Treasury Management",
    "Governance"
  ];
  
  for (let i = 0; i < categories.length; i++) {
    const expertise = await dao.getCategoryExpertise(address, i);
    if (expertise > 0n) {
      console.log(`  ${categories[i]}: ${expertise.toString()} propositions`);
    }
  }
  console.log("━".repeat(60));
  console.log("\n");
}

/**
 * Script 5: Classement des membres (Leaderboard)
 */
async function getLeaderboard(memberAddresses) {
  console.log("🏅 CLASSEMENT DES MEMBRES PAR RÉPUTATION\n");

  const dao = await ethers.getContractAt("AdvancedInvestmentDAO", DAO_ADDRESS);
  
  const [sortedMembers, scores] = await dao.getTopMembers(memberAddresses);
  
  console.log("━".repeat(80));
  console.log("RANG | ADRESSE                                      | SCORE");
  console.log("━".repeat(80));
  
  for (let i = 0; i < sortedMembers.length && i < 10; i++) {
    const rank = i + 1;
    const address = sortedMembers[i];
    const score = scores[i].toString();
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    const emoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "  ";
    console.log(`${emoji} ${rank.toString().padStart(2)} | ${address} | ${score.padStart(6)}`);
  }
  
  console.log("━".repeat(80));
  console.log("\n");
}

/**
 * Script 6: Créer une proposition avec catégorie
 */
async function createCategorizedProposal(description, target, amount, categoryIndex) {
  console.log("📝 Création d'une proposition catégorisée...\n");

  const dao = await ethers.getContractAt("AdvancedInvestmentDAO", DAO_ADDRESS);
  
  const categories = [
    "NFT Investment",
    "DeFi Investment", 
    "Venture Capital",
    "Treasury Management",
    "Governance"
  ];

  console.log("   Description:", description);
  console.log("   Cible:", target);
  console.log("   Montant:", amount, "ETH");
  console.log("   Catégorie:", categories[categoryIndex]);

  const tx = await dao.createProposal(
    description,
    target,
    ethers.parseEther(amount.toString()),
    categoryIndex
  );
  
  const receipt = await tx.wait();
  console.log("\n✅ Proposition créée!");
  console.log("   Hash:", receipt.hash);
  
  // Trouver l'ID de la proposition
  const event = receipt.logs.find(log => {
    try {
      const parsed = dao.interface.parseLog(log);
      return parsed.name === "ProposalCreated";
    } catch (e) {
      return false;
    }
  });
  
  if (event) {
    const parsed = dao.interface.parseLog(event);
    console.log("   ID Proposition:", parsed.args.proposalId.toString());
  }
  
  console.log("\n");
}

/**
 * Script 7: Dashboard complet d'un membre
 */
async function getMemberDashboard(address) {
  console.log(`\n${"═".repeat(80)}`);
  console.log(`  📊 TABLEAU DE BORD - ${address}`);
  console.log(`${"═".repeat(80)}\n`);

  const dao = await ethers.getContractAt("AdvancedInvestmentDAO", DAO_ADDRESS);
  const token = await ethers.getContractAt("GovernanceToken", TOKEN_ADDRESS);

  // 1. Balance et pouvoir de vote
  const balance = await token.balanceOf(address);
  const votingPower = await dao.getVotingPower(address);
  const delegators = await dao.getDelegators(address);
  
  console.log("💰 TOKENS & POUVOIR DE VOTE");
  console.log("─".repeat(80));
  console.log("  Balance personnelle:", ethers.formatEther(balance), "tokens");
  console.log("  Pouvoir de vote total:", ethers.formatEther(votingPower), "tokens");
  console.log("  Nombre de délégateurs:", delegators.length);
  
  // 2. Délégation
  const delegation = await dao.getDelegation(address);
  console.log("\n🤝 DÉLÉGATION");
  console.log("─".repeat(80));
  if (delegation.isActive) {
    console.log("  Statut: ACTIVE");
    console.log("  Délégué à:", delegation.delegate);
    console.log("  Depuis:", new Date(Number(delegation.delegatedAt) * 1000).toLocaleDateString());
  } else {
    console.log("  Statut: Aucune délégation active");
  }
  
  // 3. Réputation
  const rep = await dao.getReputationScore(address);
  console.log("\n🏆 RÉPUTATION");
  console.log("─".repeat(80));
  console.log("  Score:", rep.score.toString(), "points");
  console.log("  Propositions créées:", rep.totalProposals.toString());
  console.log("  Taux de succès:", rep.successRate.toString() + "%");
  console.log("  Participations:", rep.participation.toString());
  
  // 4. Expertise
  console.log("\n🎯 DOMAINES D'EXPERTISE");
  console.log("─".repeat(80));
  const categories = [
    "NFT Investment",
    "DeFi Investment",
    "Venture Capital",
    "Treasury Management",
    "Governance"
  ];
  
  let hasExpertise = false;
  for (let i = 0; i < categories.length; i++) {
    const expertise = await dao.getCategoryExpertise(address, i);
    if (expertise > 0n) {
      hasExpertise = true;
      const stars = "⭐".repeat(Math.min(Number(expertise), 5));
      console.log(`  ${categories[i]}: ${stars} (${expertise.toString()})`);
    }
  }
  if (!hasExpertise) {
    console.log("  Aucune expertise encore développée");
  }
  
  console.log(`\n${"═".repeat(80)}\n`);
}

/**
 * Script 8: Analyser une proposition avec statistiques avancées
 */
async function analyzeProposal(proposalId) {
  console.log(`📊 ANALYSE DÉTAILLÉE - Proposition #${proposalId}\n`);

  const dao = await ethers.getContractAt("AdvancedInvestmentDAO", DAO_ADDRESS);
  const token = await ethers.getContractAt("GovernanceToken", TOKEN_ADDRESS);

  const proposal = await dao.getProposal(proposalId);
  const totalSupply = await token.totalSupply();
  const proposerRep = await dao.getReputationScore(proposal.proposer);

  const categories = [
    "NFT Investment",
    "DeFi Investment",
    "Venture Capital",
    "Treasury Management",
    "Governance"
  ];

  console.log("═".repeat(80));
  console.log("INFORMATIONS GÉNÉRALES");
  console.log("═".repeat(80));
  console.log("Description:", proposal.description);
  console.log("Proposeur:", proposal.proposer);
  console.log("Catégorie:", categories[proposal.category]);
  console.log("Montant:", ethers.formatEther(proposal.amount), "ETH");
  console.log("Deadline:", new Date(Number(proposal.deadline) * 1000).toLocaleString());
  console.log("Statut:", proposal.executed ? "EXÉCUTÉE" : "EN COURS");

  console.log("\n═".repeat(80));
  console.log("VOTES");
  console.log("═".repeat(80));
  
  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const forPercentage = totalVotes > 0n ? (proposal.votesFor * 100n) / totalVotes : 0n;
  const againstPercentage = totalVotes > 0n ? (proposal.votesAgainst * 100n) / totalVotes : 0n;
  const quorumPercentage = (totalVotes * 100n) / totalSupply;

  console.log("Pour:", ethers.formatEther(proposal.votesFor), `(${forPercentage}%)`);
  console.log("Contre:", ethers.formatEther(proposal.votesAgainst), `(${againstPercentage}%)`);
  console.log("Total:", ethers.formatEther(totalVotes));
  
  // Barre de progression visuelle
  const barLength = 50;
  const forBars = Math.floor(Number(forPercentage) * barLength / 100);
  const againstBars = Math.floor(Number(againstPercentage) * barLength / 100);
  console.log("\n" + "█".repeat(forBars) + "░".repeat(againstBars));

  console.log("\n═".repeat(80));
  console.log("QUORUM & VALIDATION");
  console.log("═".repeat(80));
  console.log("Quorum actuel:", quorumPercentage.toString() + "%", "(minimum: 20%)");
  console.log("Quorum atteint:", quorumPercentage >= 20n ? "✅ OUI" : "❌ NON");
  console.log("Approbation:", forPercentage >= 50n ? "✅ APPROUVÉ" : "❌ REJETÉ");

  console.log("\n═".repeat(80));
  console.log("RÉPUTATION DU PROPOSEUR");
  console.log("═".repeat(80));
  console.log("Score:", proposerRep.score.toString());
  console.log("Taux de succès:", proposerRep.successRate.toString() + "%");
  console.log("Expertise catégorie:", (await dao.getCategoryExpertise(proposal.proposer, proposal.category)).toString());

  console.log("\n═".repeat(80));
  console.log("\n");
}

/**
 * Menu principal
 */
async function main() {
  ({ ethers } = await network.getOrCreate());
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "delegate":
      await delegateVote(args[1]);
      break;
    case "revoke":
      await revokeDelegation();
      break;
    case "power":
      await getVotingPower(args[1] || (await ethers.getSigners())[0].address);
      break;
    case "reputation":
      await getReputation(args[1] || (await ethers.getSigners())[0].address);
      break;
    case "leaderboard":
      const members = args.slice(1);
      await getLeaderboard(members);
      break;
    case "create":
      await createCategorizedProposal(
        args[1], // description
        args[2], // target
        args[3], // amount
        parseInt(args[4]) // category
      );
      break;
    case "dashboard":
      await getMemberDashboard(args[1] || (await ethers.getSigners())[0].address);
      break;
    case "analyze":
      await analyzeProposal(args[1]);
      break;
    default:
      console.log("\n🚀 COMMANDES DISPONIBLES:");
      console.log("═".repeat(80));
      console.log("\n📝 DÉLÉGATION:");
      console.log("  delegate <address>      - Déléguer son vote");
      console.log("  revoke                  - Révoquer sa délégation");
      console.log("  power <address>         - Voir le pouvoir de vote");
      console.log("\n🏆 RÉPUTATION:");
      console.log("  reputation <address>    - Consulter la réputation");
      console.log("  leaderboard <addr1> <addr2> ... - Classement");
      console.log("  dashboard <address>     - Tableau de bord complet");
      console.log("\n📊 PROPOSITIONS:");
      console.log("  create <desc> <target> <amount> <category> - Créer");
      console.log("    Catégories: 0=NFT, 1=DeFi, 2=VC, 3=Treasury, 4=Governance");
      console.log("  analyze <id>            - Analyser une proposition");
      console.log("\n═".repeat(80));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });