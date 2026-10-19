# Gouvernance et decentralisation progressive

Ce document decrit le fonctionnement effectivement implemente par NexusDAO.
Il ne constitue ni un conseil financier ni un cadre juridique pour proposer
des investissements au public.

## Principes

- Les detenteurs du token de gouvernance participent avec des droits de vote
  snapshots par `ERC20Votes`.
- Un vote ne peut pas etre modifie par un transfert ou un changement de
  delegation posterieur au snapshot.
- La creation d'une proposition exige 1 % de l'offre au snapshot ; elle doit
  ensuite atteindre 20 % de quorum et 50 % de votes favorables.
- Une proposition approuvee reste soumise au timelock, puis a l'execution du
  Safe configure. Le Safe n'est pas remplace par l'interface web.
- Le contexte de discussion est separe de la transaction mais peut etre
  reference publiquement et de facon immuable sur chaine.

## Cycle d'une proposition

1. La communaute prepare une analyse dans Decision Studio et la discute dans
   un espace public adapte (forum, Discourse, IPFS ou autre lien HTTPS).
2. Un membre disposant de pouvoir de vote cree une proposition on-chain. Il
   peut joindre une URI de discussion de 512 octets maximum.
3. Les membres deleguent ou votent sur le snapshot. Ils peuvent associer un
   motif de vote facultatif de 280 octets maximum a leur transaction.
4. Apres quorum, majorite et delai, les signataires du Safe autorisent
   l'execution.
5. La transaction et les evenements on-chain forment la piste d'audit. Ne
   placez jamais de donnees personnelles ou confidentielles dans une URI ou
   un motif de vote : ces informations sont publiques et permanentes.

## Autorite sur le token

Le script `npm run deploy:advanced` transfere la propriete du
`GovernanceToken` a `AdvancedInvestmentDAO` juste apres son deploiement.
Ainsi, une emission future ne peut pas etre effectuee par le deployeur : elle
doit etre encodee dans une proposition multi-actions de categorie
`GOVERNANCE`, approuvee par les votants et executee par le Safe.

La distribution initiale reste une decision de deploiement. Avant un
deploiement public, publiez la distribution, la periode de vesting, les
adresses de tresorerie et les conditions d'emission restantes.

## Mandat d'investissement

Le mandat est une couche optionnelle mais executable au moment de la sortie
des fonds. Une fois actif, il impose aux propositions d'investissement :

- les categories autorisees ;
- un plafond par operation ;
- un plafond cumulatif par categorie ;
- une liste blanche de contreparties ;
- un delai minimal d'execution ;
- une date d'expiration.

Sa configuration, modification et desactivation ne sont possibles que par un
appel de la DAO a elle-meme, ce qui impose une proposition approuvee et le
passage par le Safe. Chaque nouvelle version remet a zero les allocations et
invalide les contreparties de la version precedente.

## Etapes de decentralisation

| Etape | Etat | Preuve attendue |
|---|---|---|
| Produit et securite | En cours | Tests, audit independant, testnet, bug bounty |
| Gouvernance ouverte | Fonctionnelle | Token distribue, snapshots, propositions et discussions publiques |
| Controle communautaire | A planifier | Safe de production, signataires diversifies, politique de rotation |
| Transfert durable | A planifier | Documentation open source, tresorerie et emissions gouvernees publiquement |

Le `MockSafe` sert exclusivement au developpement et aux tests. Un deploiement
de production doit utiliser un Safe reel, avec proprietaires, seuil et
procedure de recuperation publies.

## Limites actuelles

NexusDAO ne fournit pas encore de KYC/KYB, de conseil financier, de
compatibilite reglementaire, de paiement, de donnees de marche en temps reel,
ni de service de discussion heberge. Les integrations DeFi et NFT doivent
etre configurees et auditees par reseau avant toute utilisation avec des fonds
reels.
