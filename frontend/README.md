# Store Product Management — Frontend

> Application Angular 19 pour la gestion des produits et catégories LMT Group.

---

## Table des matières

- [Stack technique](#stack-technique)
- [Architecture du projet](#architecture-du-projet)
- [Design System (DriveTrack)](#design-system-drivetrack)
- [Fonctionnalités](#fonctionnalités)
- [Configuration](#configuration)
- [Lancement local](#lancement-local)
- [Docker](#docker)
- [Décisions techniques & justifications](#décisions-techniques--justifications)

---

## Stack technique

| Outil | Version | Rôle |
|---|---|---|
| **Angular** | 19.x | Framework frontend (Standalone Components) |
| **TypeScript** | 5.x | Typage statique strict |
| **Angular Material** | 19.x | Composants UI (forms, cards, paginator, autocomplete) |
| **Signals** | Built-in | State management réactif (pas de NgRx) |
| **RxJS** | 7.x | Streams asynchrones & opérateurs |
| **CSS Variables** | — | Design system DriveTrack centralisé |

---

## Architecture du projet

```
frontend/src/app/
├── app.component.*                  # Shell : sidebar + top bar + router-outlet
├── app.config.ts                    # Providers (HTTP, animations, interceptors)
├── app.routes.ts                    # Routes avec lazy loading (loadComponent)
│
├── core/
│   └── interceptors/
│       └── error.interceptor.ts     # Intercepteur global (400/404/409/500 → SnackBar)
│
├── shared/
│   └── models/
│       ├── product.model.ts         # Interface Product + DTOs
│       ├── category.model.ts        # Interface Category
│       └── paginated.model.ts       # Interface PaginatedResult<T>
│
└── features/
    └── products/
        ├── data-access/
        │   ├── product-api.service.ts   # HttpClient CRUD produits
        │   └── category-api.service.ts  # HttpClient CRUD catégories
        ├── products.facade.ts           # State management (Signals)
        └── pages/
            ├── product-list/            # Liste + filtres + pagination
            └── product-form/            # Création/édition + auto-create catégorie
```

---

## Design System (DriveTrack)

Toutes les couleurs, typographies, ombres et animations sont centralisées dans `src/styles.css` via des CSS Custom Properties :

| Token | Valeur | Usage |
|---|---|---|
| `--drive-orange` | `#E85D04` | Couleur primaire (boutons, accents, prix) |
| `--drive-deep` | `#C44B00` | Hover/active state |
| `--signal-yellow` | `#F4C430` | Alertes, badges |
| `--asphalt` | `#121212` | Texte principal |
| `--success-green` | `#2D6A4F` | Statut actif |
| `--font-heading` | `Sora` | Titres et branding |
| `--font-body` | `Inter` | Corps de texte |
| `--glass-bg` | `rgba(255,255,255,0.08)` | Glassmorphism |
| `--transition-smooth` | `cubic-bezier(0.25,0.46,0.45,0.94)` | Animations fluides |

### Splash Screen

Un écran de chargement DriveTrack (logo + spinner) s'affiche dans `index.html` **avant** que Angular ne bootstrap. Il se masque automatiquement via un `MutationObserver` dès que le premier composant est rendu.

---

## Fonctionnalités

### Liste des produits
- Recherche textuelle (debounce 400ms, côté serveur)
- Filtre par catégorie (dropdown dynamique)
- Filtre par statut (Active / Non Active)
- Tri par date, prix ou nom
- Pagination serveur (8/16/24 par page)
- Suppression douce (soft delete avec confirmation)

### Formulaire Création / Édition
- **Reactive Forms** avec validation miroir du backend :
  - `name` : required, minLength(2)
  - `sku` : required
  - `price` : required, min(0)
  - `quantity` : required, min(0)
  - `category` : required
- **Autocomplete catégorie** : l'utilisateur peut sélectionner une catégorie existante OU taper un nouveau nom → la catégorie est créée automatiquement via `POST /api/v1/categories` avant la soumission du produit
- Indicateur de soumission (progress bar + bouton désactivé)

### Performance
- **Lazy loading** : chaque page est un `loadComponent()` distinct (chunk séparé)
- **takeUntilDestroyed** : aucun memory leak sur les subscriptions
- **Debounce** sur la recherche (évite les requêtes inutiles)
- **Pagination serveur** : jamais de chargement complet des données

### Gestion des erreurs
- **Intercepteur HTTP global** : capture toutes les erreurs et affiche un SnackBar
- Erreur 409 (SKU dupliqué) affichée dans le formulaire
- Erreurs réseau et 500 gérées proprement

---

## Configuration

### Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `API_URL` | `http://localhost:3000/api/v1` | URL de l'API backend |

Le fichier `src/environments/environment.ts` contient les valeurs de développement.

---

## Lancement local

### Prérequis

- Node.js >= 20
- Backend NestJS en cours d'exécution sur `localhost:3000`

### Installation

```bash
cd frontend
npm install
```

### Démarrage

```bash
npm start
# ou
npx ng serve
```

L'application sera accessible sur `http://localhost:4200`.

---

## Docker

Le `Dockerfile` inclus sert le frontend via `ng serve` en mode développement :

```bash
docker compose up frontend
```

Accessible sur `http://localhost:4200`.

---

## Décisions techniques & justifications

### Pourquoi Signals plutôt que NgRx ?

NgRx est disproportionné pour un CRUD à 2 entités. Les Signals Angular (natifs depuis v16, stables en v19) offrent un state management réactif et typé sans boilerplate. Le `ProductsFacade` centralise tout l'état dans des `signal()` avec des méthodes claires.

### Pourquoi le lazy loading ?

Chaque page est chargée à la demande via `loadComponent()`. Résultat mesuré : le bundle initial passe de 2.87 MB à 2.17 MB (−24%), et les pages sont chargées en chunks séparés (~85-100 kB chacune).

### Pourquoi `takeUntilDestroyed` ?

C'est l'API Angular 19 recommandée pour éviter les memory leaks. Elle remplace le pattern `ngOnDestroy` + `Subject` + `takeUntil` par un one-liner injecté via `DestroyRef`.

### Pourquoi `firstValueFrom` et pas `toPromise()` ?

`toPromise()` est déprécié depuis RxJS 7. `firstValueFrom` est son remplacement officiel, avec un comportement identique mais un nom explicite.

### Pourquoi la création automatique de catégorie ?

Pour éviter un workflow en 2 étapes (créer catégorie → puis produit). L'autocomplete permet de sélectionner une existante OU de taper un nouveau nom. À la soumission, le frontend vérifie si le nom existe (case-insensitive) ; sinon, il crée la catégorie via l'API avant de soumettre le produit.

### Améliorations futures

- Tests unitaires (composants + facade)
- Tests e2e (Cypress/Playwright)
- Mode sombre (les CSS variables le permettent facilement)
- Upload d'images produit (Cloudinary prêt côté backend)
- PWA (Service Worker pour le mode hors-ligne)
