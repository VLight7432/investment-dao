# Dossier de reprise NexusDAO

Ce document décrit ce qui est effectivement livré dans ce dépôt. Il ne remplace
ni un audit de sécurité, ni une analyse juridique ou fiscale.

## Périmètre livré

- Contrats Solidity de gouvernance à vote pondéré par `ERC20Votes`, avec
  snapshots, quorum, seuil de proposition et timelock.
- Exécution réservée au Safe configuré, avec un double `MockSafe` exclusivement
  destiné aux tests locaux.
- Mandats d'investissement contrôlant les catégories, plafonds par opération et
  cumulés, contreparties, délai et expiration.
- DApp React permettant la connexion wallet, la création et le vote de
  propositions, la délégation, le contrôle des mandats et la lecture du journal
  d'audit.
- Scripts de déploiement Hardhat avec validation de la distribution initiale et
  du Safe sur les réseaux publics.

Les écrans Decision Studio, NFT et DeFi préparent et documentent une décision.
Ils ne déclenchent pas un achat, une vente, un paiement ou un conseil financier.

## Vérification reproductible

Une installation Node.js LTS et npm sont nécessaires.

```shell
npm ci
npm ci --prefix frontend
npm run verify
```

Cette commande exécute les tests de contrats, le lint, les tests unitaires du
front et son build de production. La même vérification s'exécute dans GitHub
Actions à chaque push ou pull request sur `main`.

## Démonstration locale

1. Lancez `npx hardhat node`.
2. Dans un autre terminal, lancez `npm run deploy:advanced -- --network localhost`.
3. Copiez les adresses affichées dans `frontend/.env.local` en suivant
   `frontend/.env.example`.
4. Lancez `npm run dev --prefix frontend`.

Le mode local utilise `MockSafe`. Il ne doit jamais être utilisé pour conserver
ou déplacer des fonds réels.

## Éléments à remettre lors de la cession

- L'accès au dépôt Git et les droits sur le code, le nom, le domaine et les
  éléments graphiques concernés.
- Les fichiers d'environnement séparément et par un canal sûr ; aucun secret
  ne doit être ajouté au dépôt.
- Les adresses de déploiement, ABI et configuration Safe de chaque réseau.
- La politique de tokenomics, allocations, vesting et droits des détenteurs,
  si elle existe.
- Les éventuels rapports d'audit, résultats de testnet, incidents connus et
  contrats avec prestataires.

## Prérequis avant fonds réels

Le produit n'est pas présenté comme prêt pour la production financière. Avant
toute gestion de fonds, l'acquéreur doit notamment prévoir un audit indépendant,
une revue juridique dans les juridictions concernées, une configuration Safe de
production avec procédure de récupération, une campagne testnet et un plan de
réponse aux incidents.
