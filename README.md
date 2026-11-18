# Boutique Démo — site de démonstration volontairement vulnérable

Petite boutique e-commerce **délibérément non sécurisée**, conçue comme support de
démonstration pour sensibiliser des dirigeants et porteurs de projet (TPE, PME,
indépendants) à la sécurité de leur site web.

Deux failles sont intégrées, et un **mode « corrigé »** permet de montrer l’avant/après.

> ⚠️ **Avertissement.** Environnement de test, données **100 % fictives**. À utiliser
> **uniquement** en local ou sur un environnement isolé. **Ne jamais** déployer à côté
> d’un vrai service en production, ni exposer publiquement sans protection.

---

## Prérequis

- [Node.js](https://nodejs.org) **18 ou supérieur** (vérifier avec `node -v`).
- Aucune base de données à installer : tout tourne **en mémoire**.

## Lancer en local

```bash
cd boutique-demo
npm install        # installe Express (unique dépendance)
node server.js     # démarre le serveur
```

Puis ouvrir **http://localhost:3000**

Pour démarrer directement en version corrigée :

```bash
SECURE=1 node server.js
```

Le port peut être changé : `PORT=8080 node server.js`.

## Comptes de test

| Email              | Mot de passe | Rôle dans la démo                         |
|--------------------|--------------|-------------------------------------------|
| `lucas@demo.test`  | `demo1234`   | Le « client attaquant » (celui qu’on pilote) |
| `marie@demo.test`  | `demo1234`   | Autre client (victime de la fuite)        |
| `thomas@demo.test` | `demo1234`   | Autre client                              |
| `sophie@demo.test` | `demo1234`   | Autre client                              |

On peut aussi créer un compte depuis la page **Connexion**.

---

## Les deux failles

### 1. Fuite de données — contrôle d’accès cassé (IDOR)

- Connectez-vous (ex. `lucas@demo.test`), allez dans **Mes commandes**, ouvrez une commande.
- L’identifiant est dans l’URL : `/compte/commande/1045`.
- Changez-le (`1045` → `1042`, `1041`…) **ou** cliquez sur « ◀ Commande n−1 ».
- Vous consultez la commande d’un **autre client** : nom, adresse, téléphone, email, contenu.

**Cause.** Le serveur vérifie que l’utilisateur est connecté, mais pas que la commande
lui appartient (`GET /api/orders/:id`).

### 2. Fraude au remboursement — faille de logique métier

- Sur une de **vos** commandes livrées : « Demander un remboursement ».
- Le remboursement est **auto-approuvé**, sans vérifier le retour de la marchandise.
- Le client **garde le produit ET récupère l’argent**.
- La **Vue commerçant** chiffre la perte (« remboursé, marchandise non retournée »).

**Cause.** `POST /api/orders/:id/refund` valide le remboursement immédiatement, sans
étape de retour ni contrôle commerçant.

---

## Mode « corrigé » (avant / après)

Dans la **Vue commerçant**, la case **« Mode sécurisé (corrigé) »** active en direct la
version patchée :

- **IDOR** → le serveur vérifie le propriétaire : accès à la commande d’autrui = **refusé (403)**.
- **Remboursement** → la demande passe « en attente de retour » : **aucun argent rendu**
  tant que le commerçant n’a pas constaté le retour. La perte retombe à **0 €**.

Rejouez exactement les mêmes manipulations : elles échouent proprement. C’est l’argument
le plus parlant pour un dirigeant — *« voici le problème, voici corrigé »*.

Le bouton **« Réinitialiser la démo »** (vue commerçant) remet les données d’origine entre
deux présentations.

---

## Structure du projet

```
boutique-demo/
├── server.js            # serveur Express, API, les 2 failles, le toggle mode sécurisé
├── data.js              # données fictives en mémoire (produits, clients, commandes)
├── package.json
├── README.md
├── DEMO.md              # script de présentation pour public non technique
└── public/
    ├── index.html       # boutique
    ├── panier.html      # panier + validation de commande
    ├── connexion.html   # connexion / création de compte
    ├── compte.html      # espace client : liste des commandes
    ├── commande.html    # détail d'une commande  (démo IDOR + remboursement)
    ├── commercant.html  # tableau de bord commerçant + toggle avant/après
    └── assets/
        ├── style.css
        └── app.js
```

## Déploiement VPS (optionnel, plus tard)

Même logique qu’un petit service Node derrière Nginx : `node server.js` (ou via `pm2`),
puis un reverse-proxy Nginx vers le port local. **Ne pas** l’exposer sur un domaine de
production ni à côté d’un vrai service. Idéalement : accès restreint (auth basique Nginx,
IP autorisées) puisque l’appli est vulnérable par conception.
