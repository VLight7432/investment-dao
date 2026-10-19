# NexusDAO frontend

Application React/Vite de NexusDAO. Elle fournit les parcours de gouvernance,
de préparation de mandat et de lecture du journal d'audit.

## Démarrage

```shell
npm ci
cp .env.example .env.local
npm run dev
```

Configurez les adresses de contrats déployés dans `.env.local`. Le réseau et les
adresses doivent correspondre au déploiement ciblé.

## Contrôles

```shell
npm run lint
npm test
npm run build
```

Les écrans Decision Studio, DeFi et NFT ne constituent pas un service financier
et ne doivent pas être présentés comme exécutant des investissements sans les
contrats, contrôles Safe, intégrations et validations nécessaires.
