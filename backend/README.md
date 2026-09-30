# Store Management API — Backend

> API REST NestJS pour la gestion de produits et catégories.

---

## Table des matières

- [Stack technique](#stack-technique)
- [Architecture du projet](#architecture-du-projet)
- [Principes appliqués](#principes-appliqués)
- [Modules](#modules)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Swagger](#swagger)
- [Lancement local](#lancement-local)
- [Docker](#docker)
- [Décisions techniques & justifications](#décisions-techniques--justifications)

---

## Stack technique

| Outil | Version | Rôle |
|---|---|---|
| **NestJS** | 12.x | Framework backend |
| **TypeScript** | 6.0 | Typage statique strict |
| **MongoDB** | 8.x | Base de données NoSQL |
| **Mongoose** | 9.x | ODM pour MongoDB |
| **Swagger** | `@nestjs/swagger` | Documentation interactive |
| **Winston** | 3.x | Logging structuré |
| **Convict** | 6.x | Validation d'environnement |
| **Cloudinary** | 2.x | Stockage d'images (prêt) |
| **class-validator** | — | Validation des DTOs |
| **tsc-alias** | — | Résolution des path aliases au build |

---

## Architecture du projet

```
backend/src/
├── main.ts                          # Bootstrap, CORS, Swagger, pipes globaux
├── app.module.ts                    # Module racine
├── app.controller.ts                # Health check GET /
│
├── common/                          # Code partagé (DRY)
│   ├── base/
│   │   ├── base.entity.ts           # Entité de base (timestamps)
│   │   ├── base.repository.ts       # Repository générique Mongoose
│   │   └── base.service.ts          # Service générique CRUD
│   ├── dto/
│   │   └── pagination-query.dto.ts  # DTO de pagination réutilisable
│   ├── exceptions/
│   │   └── domain.exceptions.ts     # Exceptions métier typées
│   ├── filters/
│   │   └── all-exceptions.filter.ts # Filtre d'exception global
│   ├── interceptors/
│   │   └── logging.interceptor.ts   # Intercepteur de logging HTTP
│   ├── interfaces/
│   │   └── paginated-result.interface.ts
│   ├── pipes/
│   │   └── parse-object-id.pipe.ts  # Validation MongoDB ObjectId
│   └── logger/
│       └── winston.config.ts
│
├── config/                          # Configuration centralisée
│   ├── convict-config.ts            # Source de vérité (Convict)
│   ├── app.config.ts                # Config app (port, host, etc.)
│   ├── database.config.ts           # Config MongoDB
│   ├── swagger.config.ts            # Config Swagger
│   ├── logger.config.ts             # Config Winston
│   ├── winston.config.ts            # Transport Winston
│   └── index.ts                     # Barrel export
│
├── env/                             # Fichiers de surcharge par environnement
│   ├── development.json
│   ├── staging.json
│   └── production.json
│
├── infrastructure/                  # Services d'infrastructure
│   └── cloudinary/
│       ├── cloudinary.module.ts
│       ├── cloudinary.provider.ts
│       └── cloudinary.service.ts
│
└── modules/                         # Modules métier (feature modules)
    ├── products/
    │   ├── schemas/product.schema.ts
    │   ├── dto/create-product.dto.ts
    │   ├── dto/update-product.dto.ts
    │   ├── products.repository.ts
    │   ├── products.service.ts
    │   ├── products.controller.ts
    │   └── products.module.ts
    │
    └── categories/
        ├── schemas/category.schema.ts
        ├── dto/create-category.dto.ts
        ├── categories.repository.ts
        ├── categories.service.ts
        ├── categories.controller.ts
        └── categories.module.ts
```

---

## Principes appliqués

### SOLID

| Principe | Application |
|---|---|
| **S** — Single Responsibility | Chaque classe a un rôle unique : le Controller expose, le Service contient la logique métier, le Repository accède aux données. |
| **O** — Open/Closed | `BaseRepository` et `BaseService` sont ouverts à l'extension (héritables) mais fermés à la modification. |
| **L** — Liskov Substitution | `ProductsRepository` et `CategoriesRepository` sont substituables à `BaseRepository<T>`. |
| **I** — Interface Segregation | Les interfaces (`PaginatedResult`, `PaginationOptions`) sont petites et focalisées. |
| **D** — Dependency Inversion | Les services dépendent d'abstractions (`BaseRepository<T>`) et non de l'implémentation Mongoose directe. L'injection de dépendances NestJS gère le wiring. |

### DRY (Don't Repeat Yourself)

- **`BaseRepository<T>`** : Toute la logique CRUD Mongoose (create, findOne, findById, findPaginated, updateById, softDelete, exists) est centralisée. Les repositories concrets (`ProductsRepository`, `CategoriesRepository`) n'ajoutent que leur logique spécifique.
- **`BaseService<T, R>`** : Les opérations CRUD génériques sont déléguées au repository via un service de base. Les services concrets n'ajoutent que la logique de validation métier.
- **`PaginationQueryDto`** : Un seul DTO pour toute la pagination, avec recherche et tri.
- **`AllExceptionsFilter`** : Un seul filtre pour normaliser toutes les réponses d'erreur dans un format JSON cohérent.

### Robustesse & Gestion des erreurs

- **Exceptions métier typées** : `ProductNotFoundException`, `DuplicateSkuException`, `CategoryNotFoundException` — chaque erreur a un `code` machine-readable et un `message` humain.
- **`AllExceptionsFilter`** : Intercepte **toutes** les exceptions (y compris celles de class-validator) et renvoie un format normalisé `{ statusCode, code, message, timestamp, path }`.
- **`ParseObjectIdPipe`** : Valide les paramètres `:id` avant que Mongoose ne crash avec un `CastError`. Renvoie un 400 propre.
- **Soft delete** : Les produits et catégories ne sont jamais supprimés physiquement. Un champ `isActive: false` les masque des résultats.

### Performance

- **`lean()`** sur toutes les requêtes de lecture : retourne des objets JavaScript simples au lieu de documents Mongoose hydratés → ~5x plus rapide.
- **`Promise.all`** dans `findPaginated` : les requêtes `find()` et `countDocuments()` s'exécutent en parallèle → pas de séquentialisation inutile.
- **Index MongoDB** :
  - `sku` : index unique pour les lookups rapides et la contrainte d'unicité.
  - `categoryId` : index pour filtrer les produits par catégorie sans scan complet.
  - `isActive` : index pour accélérer le filtre de soft-delete.
  - `{ name: 'text', sku: 'text' }` : index textuel pour la recherche full-text.
- **Pagination côté serveur** : `skip()` + `limit()` avec un plafond à `100` items par requête.
- **Pas de N+1** : Aucune relation imbriquée n'est chargée automatiquement. Le `categoryId` est stocké en tant que référence ObjectId mais n'est jamais peuplé (`.populate()` non utilisé), ce qui évite les requêtes en cascade.

### Clarté & Maintenabilité

- **Path aliases** (`@common/`, `@modules/`, `@config/`, `@infrastructure/`) : les imports sont lisibles et indépendants de la profondeur du fichier.
- **Structure modulaire** : chaque feature est un module NestJS autonome avec son propre schema, DTO, repo, service et controller.
- **Barrel exports** : `config/index.ts` regroupe toutes les configurations.
- **Swagger decorators** : chaque endpoint est documenté avec `@ApiOperation`, `@ApiResponse`, et `@ApiTags`.

---

## Modules

### Products (`/api/v1/products`)

CRUD complet avec :
- Création avec validation d'unicité du SKU
- Lecture paginée avec recherche textuelle et tri
- Mise à jour partielle (PATCH) avec re-validation du SKU
- Suppression douce (soft delete via `isActive: false`)

### Categories (`/api/v1/categories`)

CRUD simplifié :
- Création avec validation d'unicité du nom
- Liste de toutes les catégories actives
- Lecture par ID
- Suppression douce

---

## Configuration

La configuration est gérée par **Convict** comme source de vérité unique. Les valeurs par défaut sont définies dans `config/convict-config.ts`, et surchargées par les fichiers `env/*.json` selon `NODE_ENV`.

### Variables d'environnement clés

| Variable | Défaut | Description |
|---|---|---|
| `NODE_ENV` | `development` | Environnement d'exécution |
| `PORT` | `3000` | Port du serveur |
| `MONGODB_URI` | `mongodb://localhost:27017/store` | URI MongoDB |
| `CLOUDINARY_CLOUD_NAME` | — | Nom du cloud Cloudinary |
| `CLOUDINARY_API_KEY` | — | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | — | Secret API Cloudinary |

---

## API Endpoints

### Products

| Méthode | Endpoint | Description | Codes |
|---|---|---|---|
| `POST` | `/api/v1/products` | Créer un produit | 201, 400, 409 |
| `GET` | `/api/v1/products` | Lister (paginé, recherche, tri) | 200 |
| `GET` | `/api/v1/products/:id` | Détail d'un produit | 200, 400, 404 |
| `PATCH` | `/api/v1/products/:id` | Modifier un produit | 200, 400, 404, 409 |
| `DELETE` | `/api/v1/products/:id` | Supprimer (soft delete) | 204, 400, 404 |

### Categories

| Méthode | Endpoint | Description | Codes |
|---|---|---|---|
| `POST` | `/api/v1/categories` | Créer une catégorie | 201, 400, 409 |
| `GET` | `/api/v1/categories` | Lister les catégories actives | 200 |
| `GET` | `/api/v1/categories/:id` | Détail d'une catégorie | 200, 400, 404 |
| `DELETE` | `/api/v1/categories/:id` | Supprimer (soft delete) | 204, 400, 404 |

### Paramètres de pagination (query string)

| Paramètre | Type | Défaut | Contraintes |
|---|---|---|---|
| `page` | number | `1` | >= 1 |
| `limit` | number | `20` | 1–100 |
| `search` | string | — | Recherche full-text |
| `sortBy` | string | `createdAt` | Nom du champ |
| `sortOrder` | `asc` \| `desc` | `asc` | — |

---

## Swagger

Swagger UI est automatiquement activé en `development` et `staging`.

```
http://localhost:3000/api-docs
```

Il est désactivé en `production` (configurable via `swagger.enabled` dans `env/production.json`).

---

## Lancement local

### Prérequis

- Node.js >= 22
- MongoDB en cours d'exécution sur `localhost:27017`

### Installation

```bash
cd backend
npm install
```

### Démarrage en développement

```bash
npm run start:dev
```

### Build production

```bash
npm run build
node dist/main.js
```

---

## Docker

Le projet inclut un `docker-compose.yml` à la racine avec 3 services :
- `mongodb` : Base de données MongoDB
- `backend` : API NestJS
- `frontend` : Application Angular

```bash
docker compose up --build
```

---

## Décisions techniques & justifications

### Pourquoi pas d'authentification ?

La spécification cible un test technique de 3h. L'authentification ajouterait de la complexité sans apporter de valeur sur les critères évalués (qualité du code, performance des requêtes, validation, gestion des erreurs, README). La décision est documentée ici pour montrer qu'elle est **réfléchie**, pas omise.


### Améliorations Futures (Nice-to-haves pour la production)

Pour transformer ce MVP en un système e-commerce totalement robuste à grande échelle, voici les évolutions recommandées (non incluses pour rester dans le périmètre des 3h) :

1. **Tableau d'images (Galerie)** : Au lieu d'une unique `imageUrl`, l'entité Produit pourrait utiliser un tableau d'URLs (`images: string[]`) pour gérer une galerie complète.
2. **Gestion des Variantes (SKU Dérivés)** : Gestion d'entités enfants "Variantes" pour les tailles et couleurs, possédant chacune leur propre stock et modificateur de prix.
3. **Logique de Stock Avancée** : Mettre en place un système de "Mouvements de stock" (Inventory Ledger : Entrée, Sortie, Réservation) au lieu de simples incréments/décréments, garantissant une parfaite traçabilité.
4. **Authentification & Rôles** : Ajouter JWT et Guards NestJS pour restreindre la création/édition au rôle `ADMIN`, et la lecture aux utilisateurs normaux.

---

### Pourquoi pas de Clean Architecture stricte (ports/adapters) ?

YAGNI. Le projet a un seul adaptateur (MongoDB via Mongoose). Ajouter des interfaces abstraites et des couches de mapping n'apporterait que du boilerplate sans bénéfice concret. Le pattern Repository + Service appliqué ici est le juste milieu entre découplage et pragmatisme.

### Pourquoi `lean()` systématique ?

Les documents Mongoose hydratés incluent des méthodes et du tracking de changement. Pour des opérations de lecture pure (GET), `lean()` retourne des POJOs ~5x plus rapides et plus légers en mémoire.

### Pourquoi `tsc-alias` et pas `module-alias` ?

`module-alias` patche `require()` au runtime, ce qui pose des problèmes avec les imports ESM. `tsc-alias` réécrit les imports **au moment du build**, ce qui est plus propre et compatible avec `nodenext`.

### Pourquoi Convict plutôt que `.env` seul ?

Convict valide le **schéma** de la configuration au démarrage (types, plages, formats). Un `.env` mal configuré en production crash immédiatement au boot au lieu de silencieusement mal fonctionner.
