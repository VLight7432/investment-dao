# 🏛️ DAO d'Investissement - Guide Complet

Guide complet pour déployer et utiliser votre DAO d'investissement avec Hardhat.

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Architecture du Projet](#architecture)
4. [Déploiement](#déploiement)
5. [Tests](#tests)
6. [Utilisation](#utilisation)
7. [Sécurité](#sécurité)

---

## 🔧 Prérequis

- Node.js v18 ou supérieur
- npm ou yarn
- MetaMask ou autre wallet Ethereum
- ETH pour le gas (testnet ou mainnet)
- Compte Etherscan pour la vérification (optionnel)

---

## 📦 Installation

### 1. Initialiser le projet Hardhat

```bash
# Créer un nouveau dossier
mkdir investment-dao
cd investment-dao

# Initialiser npm
npm init -y

# Installer Hardhat et ses dépendances
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-network-helpers

# Installer OpenZeppelin
npm install @openzeppelin/contracts

# Initialiser Hardhat
npx hardhat init
# Sélectionner "Create a JavaScript project"
```

### 2. Installer les dépendances additionnelles

```bash
npm install --save-dev dotenv
npm install --save-dev @nomicfoundation/hardhat-verify
```

### 3. Structure du projet

```
investment-dao/
├── contracts/
│   ├── InvestmentDAO.sol
│   └── GovernanceToken.sol
├── scripts/
│   ├── deploy.js
│   └── interact.js
├── test/
│   └── InvestmentDAO.test.js
├── hardhat.config.js
├── .env
└── package.json
```

### 4. Configuration de l'environnement

Créer un fichier `.env` à la racine :

```env
# Clés privées (NE JAMAIS COMMITER!)
PRIVATE_KEY=votre_cle_privee_sans_0x

# RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/VOTRE_CLE
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/VOTRE_CLE
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com

# API Keys pour vérification
ETHERSCAN_API_KEY=votre_cle_etherscan
POLYGONSCAN_API_KEY=votre_cle_polygonscan

# Gas Reporter
REPORT_GAS=true
COINMARKETCAP_API_KEY=votre_cle_coinmarketcap
```

---

## 🏗️ Architecture du Projet

### Contrats Principaux

#### **GovernanceToken.sol**
Token ERC-20 représentant le pouvoir de vote dans la DAO.
- 1 token = 1 vote
- Supply initial de 1 million de tokens
- Fonction mint réservée au propriétaire

#### **InvestmentDAO.sol**
Contrat principal gérant la gouvernance et les investissements.

**Paramètres clés:**
- Période de vote : 3 jours
- Quorum requis : 20% des tokens
- Seuil d'approbation : 50% des votes

**Fonctionnalités:**
- Création de propositions d'investissement
- Vote pondéré par les tokens possédés
- Exécution automatique des propositions approuvées
- Gestion de la trésorerie collective

---

## 🚀 Déploiement

### 1. Déploiement local (pour tests)

```bash
# Terminal 1 : Lancer un nœud local
npx hardhat node

# Terminal 2 : Déployer sur le nœud local
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Déploiement sur testnet (Sepolia)

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 3. Déploiement sur mainnet

⚠️ **Attention:** Vérifiez tout minutieusement avant de déployer sur mainnet!

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

### 4. Vérification sur Etherscan

```bash
npx hardhat verify --network sepolia ADRESSE_DU_CONTRAT "constructorArg1" "constructorArg2"
```

---

## 🧪 Tests

### Lancer tous les tests

```bash
npx hardhat test
```

### Lancer un test spécifique

```bash
npx hardhat test --grep "Devrait créer une proposition"
```

### Tests avec rapport de couverture

```bash
npx hardhat coverage
```

### Tests avec rapport de gas

```bash
REPORT_GAS=true npx hardhat test
```

### Scénarios de test couverts

✅ Déploiement et configuration initiale  
✅ Dépôt de fonds dans la trésorerie  
✅ Création de propositions  
✅ Vote sur propositions (pour/contre)  
✅ Vérification du quorum  
✅ Exécution des propositions approuvées  
✅ Rejet des propositions non approuvées  
✅ Protection contre le double vote  
✅ Gestion de multiples propositions simultanées  

---

## 💼 Utilisation

### Étape 1: Distribuer les tokens de gouvernance

```bash
# Après déploiement, éditer interact.js avec les adresses des contrats
# puis distribuer les tokens aux membres fondateurs

npx hardhat run scripts/interact.js distribute 0xADRESSE_MEMBRE 100000
```

### Étape 2: Déposer des fonds

```bash
npx hardhat run scripts/interact.js deposit 10
# Dépose 10 ETH dans la trésorerie
```

### Étape 3: Créer une proposition

Éditer la fonction `createProposal()` dans `interact.js` avec:
- Description de l'investissement
- Adresse cible (contrat DeFi, wallet NFT, etc.)
- Montant en ETH

```bash
npx hardhat run scripts/interact.js create
```

### Étape 4: Voter

```bash
# Voter POUR la proposition #1
npx hardhat run scripts/interact.js vote 1 true

# Voter CONTRE la proposition #1
npx hardhat run scripts/interact.js vote 1 false
```

### Étape 5: Consulter une proposition

```bash
npx hardhat run scripts/interact.js details 1
```

### Étape 6: Exécuter une proposition approuvée

Attendre la fin de la période de vote (3 jours), puis:

```bash
npx hardhat run scripts/interact.js execute 1
```

### Commandes utiles

```bash
# Voir le solde de la trésorerie
npx hardhat run scripts/interact.js treasury

# Compiler les contrats
npx hardhat compile

# Nettoyer les artifacts
npx hardhat clean

# Obtenir les comptes du réseau local
npx hardhat accounts
```

---

## 🔒 Sécurité

### Bonnes Pratiques Implémentées

✅ **ReentrancyGuard** : Protection contre les attaques de réentrance  
✅ **Access Control** : Vérification des permissions  
✅ **Checks-Effects-Interactions** : Pattern de sécurité standard  
✅ **SafeMath** : Intégré nativement dans Solidity 0.8+  
✅ **OpenZeppelin** : Utilisation de contrats audités  

### Recommandations Avant Production

1. **Audit de sécurité professionnel**
   - Engager une société d'audit (OpenZeppelin, Trail of Bits, etc.)
   - Budget typique : $10,000 - $50,000+

2. **Tests approfondis**
   - Couverture de code > 95%
   - Tests de charge et stress tests
   - Tests d'attaques connues

3. **Déploiement progressif**
   - Commencer sur testnet pendant plusieurs semaines
   - Beta privée avec utilisateurs de confiance
   - Limitation des montants initialement

4. **Bug Bounty**
   - Programme de récompenses pour les découvertes de bugs
   - Plateformes : Immunefi, HackerOne

5. **Timelock**
   - Ajouter un délai avant l'exécution des propositions critiques
   - Permet d'annuler en cas de proposition malveillante

6. **Multisig**
   - Utiliser un multisig pour les fonctions d'administration
   - Exemple : Gnosis Safe

### Risques à Considérer

⚠️ **Smart Contract Risk** : Bugs dans le code  
⚠️ **Governance Attack** : Acquisition hostile de tokens  
⚠️ **Front-running** : Manipulation de l'ordre des transactions  
⚠️ **Oracle Manipulation** : Si utilisation d'oracles de prix  
⚠️ **Gas Costs** : Coûts d'exécution sur mainnet  

---

## 📊 Exemples d'Utilisation Réelle

### Cas d'usage 1: Investissement NFT collectif

```solidity
// Proposition pour acheter un NFT Bored Ape
Description: "Achat du Bored Ape #1234"
Target: 0x... (contrat BAYC)
Amount: 50 ETH
```

### Cas d'usage 2: Yield Farming DeFi

```solidity
// Proposition pour déposer dans Aave
Description: "Déposer 100 ETH dans Aave v3"
Target: 0x... (Aave Pool)
Amount: 100 ETH
```

### Cas d'usage 3: Investissement dans un projet

```solidity
// Proposition pour investir dans une startup crypto
Description: "Seed investment dans Project XYZ"
Target: 0x... (wallet du projet)
Amount: 25 ETH
```

---

## 🔄 Évolutions Possibles

### Fonctionnalités avancées à ajouter

1. **Délégation de vote**
   - Permettre de déléguer son pouvoir de vote

2. **Vote quadratique**
   - Système de vote plus équitable

3. **Propositions multi-actions**
   - Exécuter plusieurs transactions en une proposition

4. **NFT Membership**
   - Remplacer les tokens ERC-20 par des NFTs

5. **Reputation System**
   - Récompenser les bons investissements

6. **Emergency Stop**
   - Fonction pause en cas de problème détecté

---

## 📚 Ressources Additionnelles

- [Documentation Hardhat](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethereum.org - DAOs](https://ethereum.org/en/dao/)
- [Solidity by Example](https://solidity-by-example.org/)

---

## 🤝 Support

Pour toute question ou problème:
1. Consulter la documentation Hardhat
2. Vérifier les issues GitHub du projet
3. Rejoindre la communauté Discord
4. Poster sur le forum Ethereum

---

## ⚖️ Licence

MIT License - Libre d'utilisation et de modification

---

**Note importante**: Ce code est fourni à des fins éducatives. Assurez-vous de faire un audit de sécurité professionnel avant tout déploiement en production avec des fonds réels.