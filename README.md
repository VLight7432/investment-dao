# NexusDAO

NexusDAO est une base open source de gouvernance pour tresoreries et
investissements collectifs. Elle relie une proposition, son contexte public,
un vote a snapshots, un mandat d'investissement executable et une validation
multisignature Safe.

> Ce projet est un prototype technique. Il ne fournit ni conseil financier,
> ni KYC/KYB, ni offre d'investissement au public, ni conformite juridique
> automatisee.

## Ce que le projet garantit

- **Vote verifiable** : `ERC20Votes` enregistre le pouvoir de vote a un bloc
  snapshot. Un transfert ou une delegation posterieure ne change pas un vote.
- **Gouvernance hybride** : 1 % de l'offre au snapshot pour proposer, un
  quorum de 20 %, une majorite de 50 %, un timelock et une execution reservee
  au Safe configure.
- **Deliberation traçable** : une proposition peut referencer une discussion
  HTTPS ou IPFS ; un vote peut inclure un motif public facultatif.
- **Mandats executoires** : categories autorisees, plafond par operation,
  plafond cumulatif, liste blanche de contreparties, delai et expiration sont
  controles au moment de l'execution.
- **Emission gouvernee** : apres le deploiement, la DAO devient proprietaire
  du token. Une emission future exige une proposition, un vote et le Safe.
- **Distribution explicite** : hors reseau local, toute l'offre initiale doit
  etre repartie dans un fichier d'allocations valide avant le transfert de
  propriete.

Consultez le guide complet de
[gouvernance et decentralisation progressive](docs/ADVANCED_FEATURES.md).
Pour une reprise technique ou une cession, consultez aussi le
[dossier de reprise](docs/BUYER_HANDOVER.md).

## Architecture

| Composant | Role |
|---|---|
| `AdvancedInvestmentDAO` | Propositions, vote, timelock, execution Safe et mandat |
| `GovernanceToken` | Token ERC-20 avec delegation et snapshots `ERC20Votes` |
| `MockSafe` | Double de test local ; ne pas utiliser en production |
| `DeFiIntegration` / `NFTTrading` | Adaptateurs reserves a la DAO |
| `QuarterlyReport` | Publication de rapports reservee a la DAO |
| `frontend/` | DApp React/Vite : onboarding, Decision Studio, gouvernance et mandats |

## Prerequis

- Node.js LTS et npm
- Un wallet navigateur compatible EIP-1193 pour la DApp
- Pour un reseau public : un Safe deja deploye et un RPC configure

## Demarrage local

Installez les dependances a la racine et dans le frontend :

```shell
npm install
cd frontend && npm install && cd ..
```

Dans un premier terminal, demarrez le reseau local :

```shell
npx hardhat node
```

Dans un second terminal, deployez la DAO :

```shell
npm run deploy:advanced -- --network localhost
```

Le script affiche les valeurs a copier dans `frontend/.env.local` :

```dotenv
VITE_CHAIN_ID=31337
VITE_DAO_ADDRESS=0x...
VITE_TOKEN_ADDRESS=0x...
VITE_SAFE_ADDRESS=0x...
VITE_QUARTERLY_REPORT_ADDRESS=0x...
```

Lancez ensuite la DApp :

```shell
cd frontend
npm run dev
```

Ajoutez facultativement `VITE_SAFE_TX_SERVICE_URL` dans
`frontend/.env.local` (voir `frontend/.env.example`) pour afficher les
transactions Safe publiques en attente et leurs confirmations dans le journal
d'audit.

Le deploiement local utilise `MockSafe` exclusivement pour faciliter les tests.
Configurez votre wallet avec le reseau Hardhat local et les comptes imprimes
par `npx hardhat node`.

## Demo GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` publie automatiquement le
frontend sur GitHub Pages a chaque push sur `main`. Pour le depot
`VLight7432/investment-dao`, l'URL attendue est :

```text
https://vlight7432.github.io/investment-dao/
```

Dans les parametres GitHub du depot, choisissez **Settings > Pages > Build and
deployment > Source: GitHub Actions**. La demo publique ne configure aucune
adresse de contrat : les actions de wallet restent donc desactivees. Pour
publier une DApp connectee, renseignez les variables `VITE_CHAIN_ID`,
`VITE_DAO_ADDRESS`, `VITE_TOKEN_ADDRESS`, `VITE_SAFE_ADDRESS` et
`VITE_QUARTERLY_REPORT_ADDRESS` dans le job de deploiement. Ces valeurs sont
publiques une fois integrees au build ; n'y placez jamais de secret.

## Deploiement public

1. Copiez `.env.example` vers `.env` et renseignez le RPC, la cle du deployeur
   et `SAFE_ADDRESS`.
2. Deployez un Safe reel et configurez ses proprietaires ainsi que son seuil
   avant le deploiement de la DAO.
3. Creez un fichier prive d'allocations a partir de
   `config/token-distribution.example.json`.
4. Renseignez son chemin relatif dans `TOKEN_DISTRIBUTION_FILE`.
5. Executez le script avec le reseau cible :

```shell
npm run deploy:advanced -- --network sepolia
```

Le script refuse un reseau non local si :

- `SAFE_ADDRESS` est absent, ne pointe pas vers un contrat, ou ne repond pas
  comme un Safe compatible ;
- `TOKEN_DISTRIBUTION_FILE` est absent ou invalide ;
- des adresses sont dupliquees, un montant est invalide, ou la somme n'est pas
  exactement egale a l'offre initiale de 1 000 000 tokens.

Ne versionnez jamais `.env`, les cles privees, les adresses de membres non
publiques ou une distribution confidentielle.

## Fichier de distribution

Le fichier attendu est un objet JSON contenant `allocations` :

```json
{
  "allocations": [
    { "address": "0x1111111111111111111111111111111111111111", "amount": "600000" },
    { "address": "0x2222222222222222222222222222222222222222", "amount": "400000" }
  ]
}
```

Les montants utilisent 18 decimales et peuvent etre fractionnaires. La somme
des allocations doit etre exactement `1000000`.

## Cycle de gouvernance

1. Un membre prepare l'analyse et, si utile, une discussion publique.
2. Un detenteur de droits de vote cree une proposition avec sa cible, son
   montant, sa categorie et eventuellement son URI de contexte.
3. Les membres votent selon le snapshot ; ils peuvent expliquer leur vote.
4. Apres quorum, majorite et timelock, les proprietaires du Safe valident
   l'execution.
5. Pour les investissements, le contrat applique egalement le mandat actif.

Une modification de mandat est elle-meme une proposition multi-actions de
categorie `GOVERNANCE`. Le centre **Mandats** de la DApp prepare cette
proposition sans executer directement de transaction.

## Verification

```shell
# Contrats, lint, tests frontend et build
npm run verify
```

## Limites avant production

Avant toute gestion de fonds reels, prevoyez au minimum :

- un audit independant des contrats et des integrations ;
- un Safe de production avec signataires diversifies, seuil adapte et
  procedure de recuperation ;
- une revue juridique, fiscale et reglementaire dans les juridictions ciblees ;
- une politique de distribution, vesting et emission de token publiee ;
- un testnet, un plan de gestion d'incident et, idealement, un bug bounty ;
- des integrations DeFi/NFT configurees, testees et auditees par reseau.

Le projet ne stocke pas et ne doit pas recevoir de donnees personnelles ou
confidentielles dans les descriptions, URI de discussion ou motifs de vote :
ces donnees peuvent etre enregistrees publiquement et durablement sur chaine.

## Structure

```text
contracts/   Smart contracts Solidity
test/        Tests Hardhat
scripts/     Deploiement et interactions
config/      Exemple de distribution initiale
frontend/    DApp React/Vite
docs/        Guides de gouvernance et documentation technique
```
# investment-dao
