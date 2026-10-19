import { readFileSync } from "node:fs";
import path from "node:path";
import { network } from "hardhat";

const INITIAL_TOKEN_SUPPLY = "1000000";
const SAFE_ABI = [
  "function getOwners() view returns (address[])",
  "function getThreshold() view returns (uint256)",
];

function loadTokenDistribution(ethers, filePath) {
  if (!filePath) {
    throw new Error("TOKEN_DISTRIBUTION_FILE est obligatoire hors réseau local.");
  }

  let distribution;
  try {
    distribution = JSON.parse(readFileSync(path.resolve(process.cwd(), filePath), "utf8"));
  } catch (error) {
    throw new Error(`Impossible de lire TOKEN_DISTRIBUTION_FILE : ${error.message}`);
  }

  if (!Array.isArray(distribution.allocations) || distribution.allocations.length === 0) {
    throw new Error("Le fichier de distribution doit contenir une liste non vide d’allocations.");
  }

  const recipients = new Set();
  let total = 0n;
  const allocations = distribution.allocations.map(({ address, amount }, index) => {
    if (!ethers.isAddress(address) || address === ethers.ZeroAddress) {
      throw new Error(`Adresse invalide à l’allocation ${index + 1}.`);
    }
    const recipient = ethers.getAddress(address);
    if (recipients.has(recipient)) {
      throw new Error(`Adresse dupliquée dans la distribution : ${recipient}.`);
    }

    let units;
    try {
      units = ethers.parseUnits(amount, 18);
    } catch {
      throw new Error(`Montant invalide à l’allocation ${index + 1}.`);
    }
    if (units <= 0n) {
      throw new Error(`Le montant doit être positif à l’allocation ${index + 1}.`);
    }

    recipients.add(recipient);
    total += units;
    return { recipient, units };
  });

  if (total !== ethers.parseUnits(INITIAL_TOKEN_SUPPLY, 18)) {
    throw new Error("La somme des allocations doit être exactement égale à l’offre initiale.");
  }
  return allocations;
}

async function validateSafe(ethers, safeAddress) {
  if (!ethers.isAddress(safeAddress)) {
    throw new Error("SAFE_ADDRESS doit contenir l’adresse d’un Safe valide.");
  }
  if ((await ethers.provider.getCode(safeAddress)) === "0x") {
    throw new Error("SAFE_ADDRESS ne correspond à aucun contrat déployé.");
  }

  const safe = new ethers.Contract(safeAddress, SAFE_ABI, ethers.provider);
  try {
    const [owners, threshold] = await Promise.all([safe.getOwners(), safe.getThreshold()]);
    if (owners.length === 0 || threshold === 0n || threshold > BigInt(owners.length)) {
      throw new Error("Le Safe configuré a des propriétaires ou un seuil invalides.");
    }
  } catch (error) {
    throw new Error(`SAFE_ADDRESS doit référencer un Safe compatible : ${error.shortMessage || error.message}`);
  }
}

function requireDistinctContractAddresses(addresses) {
  const uniqueAddresses = new Set(addresses.map((address) => address.toLowerCase()));
  if (uniqueAddresses.size !== addresses.length) {
    throw new Error("Le déploiement a produit des adresses dupliquées. La configuration frontend n’est pas générée.");
  }
}

async function main() {
  console.log("🚀 Déploiement de la DAO Avancée...\n");

  const { ethers } = await network.getOrCreate();
  const [deployer] = await ethers.getSigners();
  const { chainId } = await ethers.provider.getNetwork();
  const isLocalDeployment = chainId === 31337n;
  const tokenAllocations = isLocalDeployment
    ? []
    : loadTokenDistribution(ethers, process.env.TOKEN_DISTRIBUTION_FILE);
  console.log("Déploiement avec:", deployer.address);

  // Déployer le token
  const GovernanceToken = await ethers.getContractFactory("contracts/AdvancedInvestmentDAO.sol:GovernanceToken");
  const token = await GovernanceToken.deploy(
    "DAO Investment Token",
    "DIT",
    INITIAL_TOKEN_SUPPLY
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ Token déployé:", tokenAddress);

  let safeAddress;
  if (isLocalDeployment) {
    const signers = await ethers.getSigners();
    const owners = [signers[0].address, signers[1].address, signers[2].address];
    const MockSafe = await ethers.getContractFactory("MockSafe");
    const mockSafe = await MockSafe.deploy(owners, 2);
    await mockSafe.waitForDeployment();
    safeAddress = await mockSafe.getAddress();
    console.log("✅ MockSafe de développement déployé:", safeAddress);
  } else {
    safeAddress = process.env.SAFE_ADDRESS;
    if (!safeAddress) {
      throw new Error("SAFE_ADDRESS est obligatoire hors réseau local. Déployez et configurez un Safe avant de continuer.");
    }
    await validateSafe(ethers, safeAddress);
    console.log("✅ Safe de production validé:", safeAddress);
  }

  // Deploy the DAO against the approved local MockSafe or existing Safe.
  const DAO = await ethers.getContractFactory("AdvancedInvestmentDAO");
  const dao = await DAO.deploy(tokenAddress, safeAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log("✅ DAO déployée:", daoAddress);

  for (const { recipient, units } of tokenAllocations) {
    await (await token.transfer(recipient, units)).wait();
  }
  if (!isLocalDeployment) {
    console.log(`✅ Offre initiale distribuée entre ${tokenAllocations.length} allocation(s)`);
  }

  // The deployer relinquishes minting authority: any future mint must be
  // authorized by a DAO proposal and executed through the Safe.
  await token.transferOwnership(daoAddress);
  console.log("✅ Contrôle du token transféré à la DAO");

  const QuarterlyReport = await ethers.getContractFactory("QuarterlyReport");
  const quarterlyReport = await QuarterlyReport.deploy(daoAddress);
  await quarterlyReport.waitForDeployment();
  const quarterlyReportAddress = await quarterlyReport.getAddress();
  console.log("✅ Contrat de rapports déployé:", quarterlyReportAddress);
  requireDistinctContractAddresses([
    tokenAddress,
    safeAddress,
    daoAddress,
    quarterlyReportAddress,
  ]);

  // Déposer des fonds initiaux
  await dao.depositFunds({ value: ethers.parseEther("10") });
  console.log("✅ 10 ETH déposés dans la trésorerie\n");

  console.log("=" .repeat(60));
  console.log("CONFIGURATION FRONTEND À COPIER DANS frontend/.env.local:");
  console.log(`VITE_CHAIN_ID=${chainId}`);
  console.log(`VITE_DAO_ADDRESS=${daoAddress}`);
  console.log(`VITE_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`VITE_SAFE_ADDRESS=${safeAddress}`);
  console.log(`VITE_QUARTERLY_REPORT_ADDRESS=${quarterlyReportAddress}`);
  console.log("");
  console.log("ADRESSES À SAUVEGARDER:");
  console.log("Token:", tokenAddress);
  console.log("DAO:", daoAddress);
  console.log(isLocalDeployment ? "MockSafe (développement):" : "Safe:", safeAddress);
  console.log("=" .repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });